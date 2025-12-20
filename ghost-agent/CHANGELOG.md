# 📝 Changelog - Ghost Agent

Semua perubahan tercatat di sini.

## [2.4.4] - 2025-12-20

This urgent patch release, 2.4.4, focuses on hardening the core system, squashing critical race conditions, and improving input sanitation across the board. Expect enhanced stability and tighter network performance.

### Added ➕
*   Introduced the `--shouty` flag for the CLI, enabling real-time, verbose logging of socket transaction states for deeper debugging visibility.

### Changed ⚡
*   Adjusted default network operation timeouts to be significantly more aggressive, preventing unnecessary idle cycles during connection handshake attempts.
*   Upgraded core internal dependencies (including `libssh2` and data validation libraries) to incorporate recent security patches and performance fixes.

### Fixed 🐛
*   Mitigated a high-severity race condition vulnerability that could lead to data inconsistency during concurrent writes to the temporary processing cache.
*   Patched an injection vulnerability in administrative input fields by implementing strict server-side validation and sanitization. 🛡️
*   Resolved an edge case where API error codes were intermittently misinterpreted, causing improper rollback behavior on failed requests.

### Removed 🧹
*   Sunset the deprecated `/api/v1/legacy/status` endpoint, streamlining the codebase and enforcing migration to modern health-check structures.

## [2.4.3] - 2025-12-20

### Added
- Auto-generated release.

## [2.4.2] - 2025-12-20

### Added
- Auto-generated release.

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
