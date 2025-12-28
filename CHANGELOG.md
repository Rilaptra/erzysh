# Changelog
All notable changes to the Eryzsh ecosystem.

## [2.4.9] - 2025-12-28

### v2.4.9 - 2025-12-28

This patch focuses heavily on core stability, performance optimization, and expanding internal observability just ahead of the end-of-year freeze.

#### ✨ Added

*   Integrated a new `/metrics` endpoint on the `Rift` data service, exposing crucial operational telemetry (thread pools, queue depth, and cache hit rates) via Prometheus. Get those high-cardinality dashboards ready. 📊
*   Introduced initial experimental support for dynamic endpoint configuration via the new `eryzsh.toml` schema, allowing faster rollout of canary deployments.

#### 🛠 Changed

*   **Performance Uplift:** Executed a significant refactor within the `GhostAgent` state machine to utilize the new `Wire-v3` core serialization standard instead of legacy Protoc-2. This migration yields a measurable 15-20% reduction in P99 tail latency during high-throughput ingestions. ⚡
*   Updated the standard library constraints across all Rust components (MSRV bump) to leverage recent performance improvements in the compiler backend.
*   The internal logging mechanism has been standardized to use JSON format across all core services, simplifying log parsing and analysis via Kibana/Elastic.

#### 🩹 Fixed

*   **Critical Fix:** Resolved a persistent memory accumulation issue within the `Scheduler` component that only manifested after approximately 72 hours of continuous uptime, leading to unexpected OOM kills in low-resource environments. No more stealthy heap climbs. 🧹
*   Patched an edge case in the network handler where rapid disconnect/reconnect cycles (typical of poorly maintained proxies) caused the system to fail hard instead of gracefully backing off and retrying the WebSocket handshake. Connection resilience is now substantially improved. 🔗
*   Corrected the initialization routine for the `DataPlane` service which sometimes caused a brief, transient data stall if the backing cache was empty on first startup. Data streams are now immediate.

