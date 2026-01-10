
## [2.4.11] - 2025-12-28

## [2.4.13] - 2025-12-28

### v2.4.13 — 2025-12-28

### Added

✨ Implemented new telemetry probes to track and log internal query paths exceeding the 250ms execution threshold, greatly improving future diagnostic capacity.

### Changed

⚡️ Refactored the core `DataStream` serialization protocol, moving from Protocol Buffer v2 to v3 for ~7% latency reduction in high-volume inter-service syncs.

⚙️ Adjusted the default external resource health check timeout from 500ms to 750ms to accommodate expected network jitter in highly distributed zones.

### Fixed

🐛 Fixed a critical resource handle leak in the `SynapseResolver` queue scheduler, stabilizing shutdowns during high-volume persistence operations.

🔒 Patched an obscure edge case where concurrent write operations could temporarily bypass optimistic locking checks if scheduled via the legacy internal scheduler bridge. All relevant services are now required to use the atomic comparator.

## [2.4.12] - 2025-12-28

### v2.4.12 — 2025-12-28

This is a stability and performance patch focused on resource management and core agent resilience. We’ve tightened the concurrency model around the persistence layer, resulting in fewer lock contentions under heavy load.

---

### Added

*   ➕ Introduced `MEMORY_PRESSURE_THRESHOLD` configuration for the Ghost Agent nodes, enabling early warning telemetry hooks for critical memory consumption.
*   🛡️ Added support for structured, environment-driven data masking in core logging utilities, improving compliance capabilities in high-security production environments.
*   🔑 New CLI command: `eryzsh debug validate-schema`, allowing developers to locally verify data integrity schemas against the current database structure before deployment.

### Changed

*   ⚡ Optimized the internal `RequestScheduler` to dynamically adjust the worker thread pool size based on backpressure metrics. Initial testing shows an average reduction in queue latency by ~8%.
*   ⬆️ Updated dependency: Migrated internal networking utilities from `Cryo-Net v3.0.4` to the performance-enhanced `v3.1.0` SDK.
*   ⚙️ Refactored the core state management interface to strictly enforce idempotency guarantees on all write operations, simplifying error handling for downstream consumers.

### Fixed

*   🐛 Resolved a critical race condition within the `PersistenceManager` that could lead to a deadlock when flushing high-volume state updates simultaneously across multiple threads.
*   🐞 Fixed an intermittent bug where expired session tokens were not properly revoked from the distributed cache, consuming unnecessary memory resources.
*   🩹 Patched a vulnerability that allowed improperly formatted URI parameters to bypass input sanitation checks on the metrics endpoint. (Thanks to @security-researcher-104 for the report.)

### v2.4.11 (2025-12-28)

### Added

✨ **Runtime Introspection via CLI.**
Introduced `eryzshctl state inspect`. This new command provides deep-dive diagnostics into active session contexts and worker metadata, allowing engineers to troubleshoot live sessions without requiring a service restart or connection interruption.

### Changed

⚡️ **Scheduler Overhaul.**
The core asynchronous scheduler has been replaced, migrating away from the legacy thread-pool implementation. The new non-blocking executor substantially improves I/O bound throughput and has demonstrably reduced P95 latencies across high-volume services.

🛠️ **Configuration Migration.**
Default configuration schemas now strictly enforce TOML parsing for consistency and faster initialization. We have formally deprecated YAML input support for all core modules (`eryzshd`, `data-pipe`, `ghost-agent`). Please update your configuration files prior to v2.5.0.

### Fixed

🩹 **Crucial Memory Leak Patch.**
Addressed a significant, intermittent memory retention issue within the ephemeral worker pool of the Data Ingestion Pipeline (DIP). This leak specifically manifested under high-frequency, bursty load conditions, leading to unnecessary resource scaling events. Stability restored.

🐛 Adjusted internal `ghost-agent` timeout logic to correctly differentiate between connection failure and resource contention stalls. This eliminates false-negative disconnection reports during periods of peak internal backpressure.

