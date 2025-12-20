# 👻 Ghost Agent (Rust)

Erzysh Ghost Agent adalah program jembatan ringan yang berjalan di latar belakang (background) untuk memberikan akses remote ke PC Windows Anda.

## ✨ Fitur Baru (v2.4)

- **Check Version:** Agent akan mengecek versi terbaru ke server setiap kali dijalankan.
- **Auto Update:** Jika versi baru tersedia, agent akan mendownload dan mengupdate dirinya sendiri secara otomatis menggunakan PowerShell script.

## 🚀 Cara Install / Update Manual

Jika Anda ingin menginstall fresh atau mendownload ulang agent, jalankan command berikut di Command Prompt atau PowerShell:

```powershell
curl -sL https://erzysh.vercel.app/ghost-setup | powershell
```

## 🛠️ Build dari Source

Jika Anda ingin memodifikasi dan melakukan build sendiri:

1. Pastikan Rust sudah terinstall.
2. Clone repository dan masuk ke folder `ghost-agent`.
3. Jalankan build:
   ```bash
   cargo build --release
   ```
4. File executable akan berada di `target/release/erzysh_ghost.exe`.

## ⚙️ Konfigurasi

Agent menggunakan file `config.json` untuk menyimpan pengaturan:

- `api_url`: Endpoint API Eryzsh.
- `device_id`: ID unik device Anda (jangan sebarkan).
- `heartbeat_interval_ms`: Seberapa sering mengirim status online.
- `poll_interval_ms`: Seberapa sering mengecek perintah baru.

---

**© 2025 Rizqi Lasheva. Eryzsh Project.**
