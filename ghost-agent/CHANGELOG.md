# 📝 Changelog - Ghost Agent

Semua perubahan tercatat di sini.

## [2.4.1] - 2025-12-20

### Added
- Auto-generated release.

## [2.4.0] - 2025-12-20

### Added

- Fitur **Version Check**: Mengecek versi ke server saat startup.
- Fitur **Auto Update**: Otomatis mengupdate via PowerShell script jika ada versi baru.
- File dokumentasi `README.md` dan `CHANGELOG.md` di folder agent.

### Changed

- Refactor logic startup untuk mendukung proses update.
- Peningkatan pada User-Agent header untuk download yang lebih stabil.

## [2.3.0] - 2025-12-19

### Added

- Implementasi `POST_FILE` dengan parsing direct link dari HTML (tmpfiles.org rescue).
- Connectivity debug logging.

## [2.0.0] - Awal

- Fitur dasar: LS, GET_FILE, SCREENSHOT, Heartbeat.
- Headless mode (Windows Subsystem).
