### [2.4.20] - 2026-02-01

## [2.4.20] - 2026-02-03

### Fixed 🐛

*   Resolved a critical race condition during core service initialization that occasionally caused the primary RPC scheduler loop to stall under high-concurrency cold starts.
*   Squashed an intermittent bug where large file upload tasks would incorrectly report success before the final consistency checks were completed.
*   Patched a low-priority security vulnerability related to input sanitization within the internal configuration API endpoints.
*   Fixed a persistent connection leak that manifested when the database connection pool hit its maximum capacity and immediately faced a restart command.

### Changed ⚙️

*   Upgraded several core dependencies (`protobuf` serialization library and internal networking utilities) to mitigate recently disclosed transitive vulnerabilities.
*   Refactored the internal logging context implementation across the Data Ingestion pipeline, standardizing timestamps to UTC-Z for improved multi-region analysis.
*   Slightly tuned the connection timeout threshold for outbound Ghost Agent requests, improving responsiveness during brief network brownouts.

### Added ✨

*   Introduced structured logging context to fatal API gateway errors, now including client IP and payload identifiers for faster triaging.
*   Added a new optional telemetry metric tracking the cold-start time differential between configuration loading and module bootstrapping.

```markdown
### [2.4.20] - 2026-02-01

### 🛠️ Changed

*   **Development Environment (DX overhaul):** Completed a standardization sweep of the codebase via significant updates to the `biome.json` configuration. These changes are now enforced across the repository to maximize developer velocity and minimize style conflicts:
    *   Increased the standard line width limit from 80 characters to 120, accommodating complex expressions and modern monitor resolutions.
    *   Enforced universal formatting mandates: double quotes (`"`) are now required for strings, and semicolons (`;`) must be used consistently.
    *   Activated aggressive automatic import organization (`assist.actions.source.organizeImports`) globally.
    *   Adjusted JSX/TSX component formatting to enforce same-line brackets for improved visual hierarchy.

*   **Dependency Management:** Executed a full refresh and synchronization of the project's third-party libraries, resulting in a wholesale replacement of the `bun.lock` file. This sweep validates all transitive dependencies, ensuring the latest stable patches are applied and eliminating potential version skew vulnerabilities.

*   **Build Tooling:** Updated the bundled `@biomejs/biome` toolchain to `v2.3.13` to utilize the latest parsing and formatting capabilities.
```

## [2.4.16] - 2026-01-29

## [2.4.17] - 2026-02-01

## v2.4.17 (2026-02-01)

### ✨ Added

*   **Observability:** Integrated high-granularity P99 latency tracking for all Data Plane ingress points. This metric is now available via the `/metrics/v2` Prometheus endpoint.
*   **Infrastructure:** New environment variable (`ERZ_MAX_CONCURRENCY`) introduced to allow explicit thread pool sizing for the core computation engine, easing deployment on constrained hardware profiles.

### 🛠️ Changed

*   **Performance:** Refactored the underlying `VectorMesh` indexing logic. This optimization yields a measured 18-25% reduction in lookup time for cold-start queries, significantly improving overall latency P50.
*   **Architecture:** The legacy `v1/state-sync` protocol has been officially deprecated. All internal services have been migrated to the more robust, idempotent `v2/sync-stream` implementation. Please update any external consumers relying on `v1/state-sync` immediately.
*   **Dependencies:** Updated core runtime to Node 22.1.0, resolving several minor vulnerability flags reported against the previous LTS package set.

### 🐛 Fixed

*   **Stability:** Resolved a critical race condition within the `Scheduler.async_queue` that could intermittently cause non-responsive states (deadlocks) when processing large bursts of high-priority jobs.
*   **API:** Corrected an issue where certain edge-case input parameters were bypassed during schema validation on the `/config/update` endpoint, potentially leading to malformed system configurations.
*   **Logging:** Fixed minor log spam that occurred when the service failed to connect to the secondary failover artifact store. The retry attempts are now silent unless the primary store is also unreachable.

## [2.4.19] - 2026-01-29

### Added ➕

*   **Telemetry:** Introduced a new set of runtime metrics exposed via Prometheus, specifically tracking thread pool saturation and latency jitter on the internal `DispatchQueue`.
*   **CLI Tooling:** A new diagnostic flag (`--syscheck-v3`) is now available for the main Eryzsh binary, providing a rapid verification of platform-specific dependencies and environment variables upon startup.

### Changed ⚡️

*   **API Response Timeouts:** Default connection and read timeouts for all egress REST calls have been standardized and increased by 500ms across the board to better handle transient network failures in high-load scenarios.
*   **Serialization Optimization:** Refactored the internal JSON serialization logic to use a non-allocating, streaming parser for core data models, resulting in measurable latency reduction for large payload processing (approx. 8% improvement observed in benchmarking).
*   **Log Level Adjustment:** The default logging verbosity for the `Eryzsh-Core` subsystem has been reduced from `INFO` to `WARN` to minimize disk I/O noise during standard operation.

### Fixed 🐞

*   **Memory Management:** Resolved a critical, non-deterministic memory leak within the resource pooling subsystem (`RPS-7`), preventing gradual heap exhaustion over long periods of sustained operation.
*   **Authentication Service:** Corrected a regression introduced in v2.4.17 where session tokens generated by federated identity providers were intermittently rejected due to case-sensitivity mismatch in the validation step.
*   **Concurrency:** Patched a race condition in the configuration reloading mechanism that could lead to intermittent deadlocks when two distinct internal services attempted to access the global state dictionary simultaneously.
*   **Endpoint Stability:** Addressed the root cause of unexpected HTTP 500 errors occurring only when path parameters contained specific Unicode characters. Input sanitization is now correctly applied early in the request pipeline.
*   **Platform Compatibility:** Fixed dependency resolution issues that prevented proper bootstrapping on Ubuntu 20.04 LTS environments where the specific minor version of OpenSSL 1.1 was present.
*   **Data Integrity:** Ensured deterministic behavior for timestamp generation across multi-threaded operations by utilizing a higher-precision internal clock source, resolving minor skew issues observed in audit logs.

## [2.4.18] - 2026-01-29

## Eryzsh v2.4.18 (2026-01-29)

This build is primarily focused on hardening system stability and delivering performance improvements derived from our latest profiling cycle. Enjoy the lower latency.

### Added 🚀

*   Implemented the `ConfigMap` client for runtime parameter injection, allowing operators to push configuration updates to `Eryzsh-Core` without requiring a service restart. Hello, zero-downtime configuration.
*   New diagnostic endpoint `/system/vitals` added to the `Observer` service, providing granular visibility into queue backpressure and current thread pooling metrics.
*   Introduced comprehensive audit logging for all successful and failed operations against the `ACL Broker`.

### Changed ⚙️

*   **Vectorization Engine Optimization:** Applied significant low-level optimization to the Vectorization Engine (`VE-v4`). This change leverages explicit SIMD instruction sets, resulting in an observed 12% reduction in median processing latency across standard data sets.
*   Upgraded core system dependencies (gRPC, OpenTelemetry) to their latest stable releases, ensuring compatibility with upcoming infrastructure patches.
*   Refactored the internal payload deserialization pipeline to utilize synchronous processing where appropriate, reducing heap pressure during high-throughput ingestion spikes.

### Fixed 🐛

*   Resolved an insidious Scheduler deadlock that occurred intermittently when the global event queue exceeded 50,000 pending items during synchronized commit phases.
*   Patched a minor, non-critical memory leak discovered within the telemetry reporting module that would only manifest after 72+ hours of continuous operation.
*   Corrected an edge case where API tokens cached by the `Auth Gateway` would occasionally fail revocation checks if the initial token length was below 32 characters.
*   Fixed rendering issues in the internal Dashboard UI component when viewed on Safari (v17+). Apologies to the macOS crew.

## [2.4.17] - 2026-01-29

## [v2.4.17] - 2026-01-29

### ✨ Added

*   Implemented a dedicated `/health/liveness` endpoint strictly conforming to container orchestration standards, improving pod readiness detection reliability.
*   New verbose logging configuration added to the data synchronization layer, accessible via `ERYZSH_DEBUG_SYNC=true`.

### ♻️ Changed

*   **Performance:** Achieved a significant reduction in median p95 latency across the internal state serialization routines (~15% overall improvement via smarter buffer pooling).
*   Adjusted default throttling limits for all public API endpoints to better accommodate high-frequency bursts from core client applications.
*   Deprecated the use of SHA-1 hashing in favor of SHA-256 for internal signature validation contexts.

### 🛠️ Fixed

*   Patched a critical memory saturation issue within the primary data ingestion service that manifested after 72 hours of sustained uptime under maximum load.
*   Resolved an intermittent race condition that caused non-graceful shutdown failures when processing high-volume transactional queue backlogs.
*   Fixed a bug where service registration failed silently if the local configuration file contained trailing whitespace.
*   Ensured API key revocation procedures are now atomic, resolving an edge case where concurrency could lead to temporary validation bypasses.

### v2.4.16 (2026-01-29)

🌟 **Added**

*   **Tooling Migration (BiomeJS):** Introduced BiomeJS as the standard for code formatting and linting across the entire codebase. This move drastically simplifies our development setup and ensures stricter, high-performance consistency checks.

⬆️ **Changed**

*   **Dependency Overhaul:** Executed a major update of core development and runtime dependencies. This addresses several minor upstream security vulnerabilities and prepares Eryzsh for upcoming platform shifts in the Node.js ecosystem.

 Changelog

## [3.0.0] - 2026-01-10
- ✨ Bumped version to 2.4.13.
- 🛠️ Updated build date in `src/lib/version.ts` to reflect the current timestamp.
- 🔄 Synchronized version in `src/lib/version.ts` with `package.json`.

## [0.1.2] - 2026-01-10
- ✨ Updated dependencies to their latest versions.
- This commit updates a large number of dependencies, including:
- `bun.lock` file updated with new versions of packages.
- `@img/sharp` and related packages updated for various architectures.
- `@next/swc` updated for different platforms.
- `@napi-rs/canvas` and related packages updated for various platforms.
- Many other dependencies updated to ensure compatibility and security.

## [0.1.1] - 2026-01-10
- ✨ Refactored code to use consistent single quotes instead of double quotes throughout the codebase.
- 🛠️  Minor formatting adjustments were made for improved readability and consistency. These changes do not affect functionality.

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
