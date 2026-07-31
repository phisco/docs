---
title: Observability
sidebar_position: 16
description: Collect hub's service metrics, install the hub-observability chart, and export them to your monitoring backend.
---

Hub's components emit their own Prometheus metrics: request rates and latency, Go
runtime health, and hub-specific counters for ingestion, queries, and internal
work. This page covers what hub exposes, a turnkey chart to view it, and how to
wire it into your own monitoring backend for production.

:::note[This page isn't the Metrics pipeline]
This page is about the health of the **hub software itself**. It's separate from
the [Metrics pipeline](metrics.md), which collects **control-plane** metrics from
connected control planes and serves them through the Metrics Query API. The two
are independent: you can run either, both, or neither, and they never share
storage.
:::

## What the hub exposes today

`hub-core` serves a Prometheus metrics endpoint on port `8085`. It carries two
kinds of metrics:

- **Standard framework metrics** its runtime emits automatically. The
  [OpenTelemetry HTTP server metrics][otel-http-metrics] for every API route (the
  `RED` signals: request rate, errors, and latency) and the usual Go runtime
  metrics (`go_*`: `goroutines`, heap, and GC). Consult those conventions for the
  full field list.
- **Hub instruments** (prefixed `hub_core_`) for the ingest and query paths and
  the internal subsystems, catalogued below.

All hub metric names below are the Prometheus-exposition form. Counters end in
`_total`; histograms expose `_bucket`, `_sum`, and `_count` series.

[otel-http-metrics]: https://opentelemetry.io/docs/specs/semconv/http/http-metrics/

### Resource ingestion

<!-- vale Microsoft.Dashes = NO -->
<!-- vale Upbound.Spelling = NO -->
| Metric | Type | Key labels | Measures |
| --- | --- | --- | --- |
| `hub_core_ingest_resource_total` | counter | `control_plane`, `realm`, `op` | Committed resource ingests. The foundation volume metric. |
| `hub_core_ingest_resource_by_type_total` | counter | `group`, `kind`, `crossplane_type`, `op` | The same ingests broken down by resource type. |
| `hub_core_ingest_rejected_total` | counter | `reason` | Ingest requests rejected before commit. |
| `hub_core_ingest_stale_write_dropped_total` | counter | `control_plane`, `realm` | Upserts dropped because the incoming resource version wasn't newer than the stored one. Spikes indicate out-of-order delivery or a connector resync storm. |
| `hub_core_ingest_event_lag_seconds` | histogram | - | Lag between event generation at the source and receipt by hub. |
<!-- vale Upbound.Spelling = YES -->
<!-- vale Microsoft.Dashes = YES -->

### Metrics ingestion

The ingest side of the Metrics pipeline, measured as hub's own operational
counters.

<!-- vale Microsoft.Dashes = NO -->
| Metric | Type | Key labels | Measures |
| --- | --- | --- | --- |
| `hub_core_metrics_ingest_forward_total` | counter | `control_plane`, `http_response_status_code` | OTLP metrics forwarded to the gateway. |
| `hub_core_metrics_ingest_rejected_total` | counter | `reason` | Ingest requests rejected before forwarding. |
| `hub_core_metrics_ingest_body_bytes` | histogram | - | Size of accepted OTLP request bodies. |
<!-- vale Microsoft.Dashes = YES -->

### Query APIs

| Metric | Type | Key labels | Measures |
| --- | --- | --- | --- |
| `hub_core_resource_query_view_total` | counter | `view` | Resource list queries by projection view (full vs. summary). |
| `hub_core_resource_query_result_count` | histogram | `view` | Result count returned per list query. |
| `hub_core_metrics_query_total` | counter | `outcome` | Metric query requests by terminal outcome. |
| `hub_core_metrics_query_duration_seconds` | histogram | `status` | Prometheus backend range-query latency. |
| `hub_core_metrics_query_result_series` | histogram | - | Series returned by a range query. |
| `hub_core_metrics_query_points_estimate` | histogram | - | Estimated sample points a query materializes .`(end − start) / step`. An expensive-query detector. |
| `hub_core_metrics_query_span_seconds` | histogram | - | Requested query time-range width. |
| `hub_core_metrics_query_scope_rejections_total` | counter | `reason` | PromQL scope-injection rejections. Attempted tenant-boundary violations. |
| `hub_core_metrics_query_scope_size` | histogram | - | Authorized control-plane matchers injected into a scoped query. |

### Internals

Hub extracts relationship edges (owner references, Crossplane composite → claim →
managed-resource links) at ingest. When an edge points at a resource hub hasn't
ingested yet, hub holds the edge in a backlog, and a background sweeper promotes
it once the target arrives.

| Metric | Type | Measures |
| --- | --- | --- |
| `hub_core_pending_edges_count` | gauge | Edges waiting for their target resource. The backlog. A steady rise means many references point at resources not yet ingested. |
| `hub_core_edge_sweeper_promoted_total` | counter | Pending edges resolved into real edges. |
| `hub_core_edge_sweeper_cycle_capped_total` | counter | Sweeps that hit the per-cycle batch cap with a backlog remaining. The sweeper can't clear the backlog at its current rate. |

## Start with the hub-observability chart

The quickest way to see these metrics is the `hub-observability` chart. It
installs a single [`grafana/otel-lgtm`](https://github.com/grafana/docker-otel-lgtm)
pod:
- an OpenTelemetry Collector 
- Prometheus 
- Grafana

<!-- vale Upbound.Spelling = NO -->
The pod scrapes `hub-core:8085` into its own Prometheus. It comes with three
preloaded dashboards: **Hub Service Health**, **Hub Ingest**, and **Hub Query**.
<!-- vale Upbound.Spelling = YES -->

The chart discovers hub pods in its **own release namespace**, so install it in
the same namespace as the hub:

```bash
helm install hub-observability oci://xpkg.upbound.io/upbound/hub-observability \
  --namespace hub
kubectl -n hub port-forward svc/hub-observability-hub-observability 3000:3000
# → http://localhost:3000
```

To run it in a separate namespace instead, point it at the namespace where hub
runs with `scrape.namespace`:

```bash
helm install hub-observability oci://xpkg.upbound.io/upbound/hub-observability \
  --namespace observability --create-namespace \
  --set scrape.namespace=hub
```
<!-- vale gitlab.Uppercase = NO -->
The chart is **demo and evaluation-grade**. It runs as one all-in-one pod with a
single PVC on a single node. Use it to explore the metrics and dashboards. Back
production alerting with your own monitoring stack instead.
<!-- vale gitlab.Uppercase = YES -->

## Export to your own backend

For production, scrape `hub-core:8085` with your own agent and send the metrics
to the **observability backend of your choice**.

The pipeline below is **only an example**. An OpenTelemetry Collector that
scrapes the hub pods and remote-writes to a Prometheus-compatible endpoint. Swap
the exporter for one that matches your backend (OTLP, Google Cloud, Datadog, and
so on):

```yaml
receivers:
  prometheus:
    config:
      scrape_configs:
        - job_name: hub-core
          kubernetes_sd_configs:
            - role: pod
              namespaces:
                names: [hub]
          relabel_configs:
            - source_labels: [__meta_kubernetes_pod_label_app_kubernetes_io_name]
              action: keep
              regex: hub-core
            - source_labels: [__meta_kubernetes_pod_ip]
              target_label: __address__
              # $$ escapes the Collector's env-var expansion so the relabel
              # engine receives a literal ${1} capture group.
              replacement: $${1}:8085
exporters:
  prometheusremotewrite:
    endpoint: https://<your-backend>/api/v1/write
service:
  pipelines:
    metrics:
      receivers: [prometheus]
      exporters: [prometheusremotewrite]
```

**Hub Service Health**, **Hub Ingest**, and **Hub Query** are plain Grafana JSON
built on PromQL. If your backend serves the Prometheus query API, import them
into your own Grafana for the same views.

## Roadmap

Instrumentation today covers the ingest and query paths. Planned additions,
subject to change:

- **Authentication and tokens:** OIDC login, token exchange, and device-flow
  funnels, currently visible only in logs.
- **Authorization:** the per-request filter cost that dominates list latency for
  large organizations, and denial breakdowns.
- **Database:** connection-pool saturation and per-store query latency.
- **Fail-closed alerts:** cheap error counters for feature-flag evaluation and
  authorization role checks, so a silent dependency outage becomes an alert.
- **Distributed tracing:** connector ↔ API request-path traces through the same
  collector, with an opt-in trace backend in the chart.

## Next step

If you haven't yet, work through [Production hardening](production-overview.md) for
sizing, high availability, autoscaling, RBAC, and upgrades. 
Once you've prepared your hub install for production, come back and configure
watching for your hardened install.
