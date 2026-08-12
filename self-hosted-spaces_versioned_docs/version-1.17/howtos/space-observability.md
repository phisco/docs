---
title: Configure Space-level observability
sidebar_position: 30
description: Configure Space-level observability
---

:::important
This feature is GA since `v1.14.0`, requires Spaces `v1.6.0`, and is off by default. To enable, set `observability.enabled=true` (`features.alpha.observability.enabled=true` before `v1.14.0`) when installing Spaces:

```bash
up space init --token-file="${SPACES_TOKEN_PATH}" "v${SPACES_VERSION}" \
  ...
  --set "observability.enabled=true" \
```
:::


The observability feature collects telemetry data from user-facing control
plane workloads like:

* Crossplane
* Providers
* Functions

Self-hosted Spaces users can add control plane system workloads such as the
`api-server`, `etcd` by setting the
`observability.collectors.includeSystemTelemetry` Helm flag to true.

### Sensitive data

To avoid exposing sensitive data in the `SharedTelemetryConfig` resource, use
Kubernetes secrets to store the sensitive data and reference the secret in the
`SharedTelemetryConfig` resource.

Create the secret in the same namespace/group as the `SharedTelemetryConfig`
resource. The example below uses `kubectl create secret` to create a new secret:

```bash
kubectl create secret generic sensitive -n <STC_NAMESPACE>  \
    --from-literal=apiKey='YOUR_API_KEY'
```

Next, reference the secret in the `SharedTelemetryConfig` resource:

```yaml
apiVersion: observability.spaces.upbound.io/v1alpha1
kind: SharedTelemetryConfig
metadata:
  name: newrelic
spec:
  configPatchSecretRefs:
    - name: sensitive
      key: apiKey
      path: exporters.otlphttp.headers.api-key
  controlPlaneSelector:
    labelSelectors:
      - matchLabels:
          org: foo
  exporters:
    otlphttp:
      endpoint: https://otlp.nr-data.net
      headers:
        api-key: dummy # This value is replaced by the secret value, can be omitted
  exportPipeline:
    metrics: [otlphttp]
    traces: [otlphttp]
    logs: [otlphttp]
```

The `configPatchSecretRefs` field in the `spec` specifies the secret `name`,
`key`, and `path` values to inject the secret value in the
`SharedTelemetryConfig` resource.


This guide explains how to configure Space-level observability. This feature is
only applicable to self-hosted Space administrators. This lets Space
administrators observe the cluster infrastructure where the Space software gets
installed.

<!-- vale gitlab.SentenceLength = NO -->
When you enable observability in a Space, Upbound deploys a single
[OpenTelemetry Collector][opentelemetry-collector] to collect and export metrics,
logs, and traces to your configured observability backends.
<!-- vale gitlab.SentenceLength = YES -->

## Prerequisites

This feature requires the [OpenTelemetry Operator][opentelemetry-operator] on
the Space cluster.

Note: If running Spaces v1.16 or later, use OpenTelemetry Operator v0.139.0 or
later due to breaking changes in the OpenTelemetry Operator.

## Configuration

To configure how Upbound exports telemetry, review the `spacesCollector` value in
your Space installation Helm chart. Supported exporters are `otlphttp`, `datadog`,
`splunk_hec`, and `debug`. Replace the exporter name and configuration options
based on your backend.

<!-- vale Upbound.Spelling = NO -->
Below is an example using `otlphttp`.
<!-- vale Upbound.Spelling = YES -->

<!-- vale gitlab.MeaningfulLinkWords = NO -->
```yaml
observability:
  spacesCollector:
    env:
      - name: API_KEY
        valueFrom:
          secretKeyRef:
            name: my-secret
            key: api-key
    config:
      exporters:
        otlphttp:
          endpoint: "<your-endpoint>"
          headers:
            api-key: ${env:API_KEY}
      exportPipeline:
        logs:
          - otlphttp
        metrics:
          - otlphttp
        traces:
          - otlphttp
```
<!-- vale gitlab.MeaningfulLinkWords = YES -->

<!-- vale Upbound.Spelling = NO -->
For exporter-specific configuration options, see the OpenTelemetry documentation
for [`otlphttp`][otlphttp-exporter], [`datadog`][datadog-exporter], and
[`splunk_hec`][splunk-exporter].
<!-- vale Upbound.Spelling = YES -->

You can export metrics, logs, and traces from your Crossplane installation, Spaces
infrastructure (controller, API, router, etc.), provider-helm, and
provider-kubernetes.

### Router metrics

The Spaces router component uses Envoy as a reverse proxy and exposes detailed
metrics about request handling, circuit breakers, and connection pooling.
Upbound collects these metrics in your Space after you enable Space-level
observability.

Envoy metrics in Upbound include:

- **Upstream cluster metrics** - Request status codes, timeouts, retries, and latency for traffic to control planes and services
- **Circuit breaker metrics** - Connection and request circuit breaker state for both `DEFAULT` and `HIGH` priority levels
- **Downstream listener metrics** - Client connections and requests received
- **HTTP connection manager metrics** - End-to-end HTTP request processing and latency

For a complete list of available router metrics and example PromQL queries, see the [Router metrics reference][router-ref].

### Distributed tracing

Spaces generates distributed traces through OpenTelemetry integration,
providing end-to-end visibility into request flow across the system. Use these
traces to debug latency issues, understand request paths, and correlate errors
across services.

The router uses:

- **Protocol**: OTLP (OpenTelemetry Protocol) over gRPC
- **Service name**: `spaces-router`
- **Transport**: TLS-encrypted connection to telemetry collector

#### Trace configuration

Enable tracing and configure the sampling rate with the following Helm values:

```yaml
observability:
  enabled: true
  tracing:
    enabled: true
    sampling:
      rate: 0.1  # Sample 10% of new traces (0.0-1.0)
```

The sampling behavior depends on whether a parent trace context exists:

- **With parent context**: If a `traceparent` header is present, the parent's
  sampling decision is respected, enabling proper distributed tracing across services.
- **Root spans**: For new traces without a parent, Envoy samples based on
  `x-request-id` hashing. The default sampling rate is 10%.

#### TLS configuration for external collectors

To send traces to an external OTLP collector, configure the endpoint and TLS settings:

```yaml
observability:
  enabled: true
  tracing:
    enabled: true
    endpoint: "otlp-gateway.example.com"
    port: 443
    tls:
      caBundleSecretRef: "custom-ca-secret"
```

If `caBundleSecretRef` is set, the router uses the CA bundle from the referenced
Kubernetes secret. The secret must contain a key named `ca.crt` with the
PEM-encoded CA bundle. If not set, the router uses the Spaces CA for the
in-cluster collector.

#### Custom trace tags

The router adds custom tags to every span to enable filtering and grouping by
control plane:

| Tag | Source | Description |
|-----|--------|-------------|
| `controlplane.id` | `x-upbound-mxp-id` header | Control plane UUID |
| `controlplane.name` | `x-upbound-mxp-host` header | Internal vcluster hostname |
| `hostcluster.id` | `x-upbound-hostcluster-id` header | Host cluster identifier |

These tags enable queries like "show all slow requests to control plane X" or
"find errors for control planes in host cluster Y."

#### Example trace

The following example shows the attributes from a successful GET request:

```text
Span: ingress
├─ Service: spaces-router
├─ Duration: 8.025ms
├─ Attributes:
│  ├─ http.method: GET
│  ├─ http.status_code: 200
│  ├─ upstream_cluster: ctp-b2b37aaa-ee55-492c-ba0c-4d561a6325fa-api-cluster
│  ├─ controlplane.id: b2b37aaa-ee55-492c-ba0c-4d561a6325fa
│  ├─ controlplane.name: vcluster.mxp-b2b37aaa-ee55-492c-ba0c-4d561a6325fa-system
│  └─ response_size: 1827
```
The router uses:

- **Protocol**: OTLP (OpenTelemetry Protocol) over gRPC
- **Service name**: `spaces-router`
- **Transport**: TLS-encrypted connection to telemetry collector

#### Trace configuration

Enable tracing and configure the sampling rate with the following Helm values:

```yaml
observability:
  enabled: true
  tracing:
    enabled: true
    sampling:
      rate: 0.1  # Sample 10% of new traces (0.0-1.0)
```

The sampling behavior depends on whether a parent trace context exists:

- **With parent context**: If a `traceparent` header is present, the parent's
  sampling decision is respected, enabling proper distributed tracing across services.
- **Root spans**: For new traces without a parent, Envoy samples based on
  `x-request-id` hashing. The default sampling rate is 10%.

#### TLS configuration for external collectors

To send traces to an external OTLP collector, configure the endpoint and TLS settings:

```yaml
observability:
  enabled: true
  tracing:
    enabled: true
    endpoint: "otlp-gateway.example.com"
    port: 443
    tls:
      caBundleSecretRef: "custom-ca-secret"
```

If `caBundleSecretRef` is set, the router uses the CA bundle from the referenced
Kubernetes secret. The secret must contain a key named `ca.crt` with the
PEM-encoded CA bundle. If not set, the router uses the Spaces CA for the
in-cluster collector.

#### Custom trace tags

The router adds custom tags to every span to enable filtering and grouping by
control plane:

| Tag | Source | Description |
|-----|--------|-------------|
| `controlplane.id` | `x-upbound-mxp-id` header | Control plane UUID |
| `controlplane.name` | `x-upbound-mxp-host` header | Internal vcluster hostname |
| `hostcluster.id` | `x-upbound-hostcluster-id` header | Host cluster identifier |

These tags enable queries like "show all slow requests to control plane X" or
"find errors for control planes in host cluster Y."

#### Example trace

The following example shows the attributes from a successful GET request:

```text
Span: ingress
├─ Service: spaces-router
├─ Duration: 8.025ms
├─ Attributes:
│  ├─ http.method: GET
│  ├─ http.status_code: 200
│  ├─ upstream_cluster: ctp-b2b37aaa-ee55-492c-ba0c-4d561a6325fa-api-cluster
│  ├─ controlplane.id: b2b37aaa-ee55-492c-ba0c-4d561a6325fa
│  ├─ controlplane.name: vcluster.mxp-b2b37aaa-ee55-492c-ba0c-4d561a6325fa-system
│  └─ response_size: 1827
```
For detailed tracing configuration, custom tags, and example traces for each
component, see the [distributed tracing documentation](tracing/overview.md).

## Available metrics

Space-level observability collects metrics from multiple infrastructure components:

### Infrastructure component metrics

- Crossplane controller metrics
- Spaces controller, API, and router metrics
- Provider metrics (provider-helm, provider-kubernetes)

### Router metrics

The router component exposes Envoy proxy metrics for monitoring traffic flow and
service health. Key metric categories include:

- `envoy_cluster_upstream_rq_*` - Upstream request metrics (status codes, timeouts, retries, latency)
- `envoy_cluster_circuit_breakers_*` - Circuit breaker state and capacity
- `envoy_listener_downstream_*` - Client connection and request metrics
- `envoy_http_downstream_*` - HTTP request processing metrics

Example query to monitor total request rate:

```promql
sum(rate(envoy_cluster_upstream_rq_total{job="spaces-router-envoy"}[5m]))
```

Example query for P95 latency:

```promql
histogram_quantile(
  0.95,
  sum by (le) (
    rate(envoy_cluster_upstream_rq_time_bucket{job="spaces-router-envoy"}[5m])
  )
)
```

For detailed router metrics documentation and more query examples, see the [Router metrics reference][router-ref].

<!-- vale off -->
## OpenTelemetryCollector image
<!-- vale on -->

Control plane (`SharedTelemetry`) and Space observability deploy the same custom
OpenTelemetry Collector image. The OpenTelemetry Collector image supports
`otlphttp`, `datadog`, `splunk_hec`, and `debug` exporters.

For more information on observability configuration, review the [Helm chart reference][helm-chart-reference].

## Observability in control planes

Read the [observability documentation][observability-documentation] to learn
about the features Upbound offers for collecting telemetry from control planes.


## Router metrics reference {#router-ref}

To avoid overwhelming observability tools with hundreds of Envoy metrics, an
allow-list filters metrics to only the following metric families.

### Upstream cluster metrics

Metrics tracking requests sent from Envoy to configured upstream clusters.
Individual control planes, spaces-api, and other services are each considered
an upstream cluster. Use these metrics to monitor service health, identify
upstream errors, and measure backend latency.

| Metric | Description |
|--------|-------------|
| `envoy_cluster_upstream_rq_xx_total` | HTTP status codes (2xx, 3xx, 4xx, 5xx) with label `envoy_response_code_class` |
| `envoy_cluster_upstream_rq_timeout_total` | Requests that timed out waiting for upstream |
| `envoy_cluster_upstream_rq_retry_limit_exceeded_total` | Requests that exhausted retry attempts |
| `envoy_cluster_upstream_rq_total` | Total upstream requests |
| `envoy_cluster_upstream_rq_time_bucket` | Latency histogram (for P50/P95/P99 calculations) |
| `envoy_cluster_upstream_rq_time_sum` | Sum of request durations |
| `envoy_cluster_upstream_rq_time_count` | Count of requests |

### Circuit breaker metrics

<!-- vale Upbound.Spelling = NO -->
<!-- ignore upstreams -->
Metrics tracking circuit breaker state and remaining capacity. Circuit breakers
prevent cascading failures by limiting connections and concurrent requests to
unhealthy upstreams. Two priority levels exist: `DEFAULT` for watch requests and
`HIGH` for API requests.
<!-- vale Upbound.Spelling = YES -->

| Name | Description |
|--------|-------------|
| `envoy_cluster_circuit_breakers_default_cx_open` | `DEFAULT` priority connection circuit breaker open (gauge) |
| `envoy_cluster_circuit_breakers_default_rq_open` | `DEFAULT` priority request circuit breaker open (gauge) |
| `envoy_cluster_circuit_breakers_default_remaining_cx` | Available `DEFAULT` priority connections (gauge) |
| `envoy_cluster_circuit_breakers_default_remaining_rq` | Available `DEFAULT` priority request slots (gauge) |
| `envoy_cluster_circuit_breakers_high_cx_open` | `HIGH` priority connection circuit breaker open (gauge) |
| `envoy_cluster_circuit_breakers_high_rq_open` | `HIGH` priority request circuit breaker open (gauge) |
| `envoy_cluster_circuit_breakers_high_remaining_cx` | Available `HIGH` priority connections (gauge) |
| `envoy_cluster_circuit_breakers_high_remaining_rq` | Available `HIGH` priority request slots (gauge) |

### Downstream listener metrics

Metrics tracking requests received from clients such as kubectl and API consumers.
Use these metrics to monitor client connection patterns, total request volume,
and responses sent to external users.

| Name | Description |
|--------|-------------|
| `envoy_listener_downstream_rq_xx_total` | HTTP status codes for responses sent to clients |
| `envoy_listener_downstream_rq_total` | Total requests received from clients |
| `envoy_listener_downstream_cx_total` | Total connections from clients |
| `envoy_listener_downstream_cx_active` | Currently active client connections (gauge) |


<!-- vale Microsoft.HeadingAcronyms = NO -->
### HTTP connection manager metrics
<!-- vale Microsoft.HeadingAcronyms = YES -->

Metrics from Envoy's HTTP connection manager tracking end-to-end request
processing. These metrics provide a comprehensive view of the HTTP request
lifecycle including status codes and client-perceived latency.

| Name | Description |
|--------|-------------|
| `envoy_http_downstream_rq_xx` | HTTP status codes (note: no `_total` suffix for this metric family) |
| `envoy_http_downstream_rq_total` | Total HTTP requests received |
| `envoy_http_downstream_rq_time_bucket` | Downstream request latency histogram |
| `envoy_http_downstream_rq_time_sum` | Sum of downstream request durations |
| `envoy_http_downstream_rq_time_count` | Count of downstream requests |

[router-ref]: #router-ref
[observability-documentation]: /self-hosted-spaces/howtos/observability
[opentelemetry-collector]: https://opentelemetry.io/docs/collector/
[opentelemetry-operator]: https://opentelemetry.io/docs/kubernetes/operator/
[helm-chart-reference]: /reference/spaces-helm-reference/
[otlphttp-exporter]: https://github.com/open-telemetry/opentelemetry-collector/tree/main/exporter/otlphttpexporter
[datadog-exporter]: https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/datadogexporter
[splunk-exporter]: https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/splunkhecexporter
