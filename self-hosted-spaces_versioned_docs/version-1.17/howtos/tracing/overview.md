---
title: Distributed Tracing Overview
sidebar_position: 1
description: Configure distributed tracing in Spaces for end-to-end request visibility.
---

Spaces uses distributed tracing to provide end-to-end visibility into request
flow across the system. Traces help with debugging performance issues,
understanding request patterns, and correlating operations across multiple
services.

## Architecture

The Spaces tracing architecture consists of:

- **Instrumented components**: spaces-router, spaces-api, and query-api
- **Protocol**: OTLP (OpenTelemetry Protocol)
- **Collector**: telemetry-spaces-collector (in-cluster by default), with
  support for bringing your own collector

## Enabling tracing

Configure tracing through Helm values when installing or upgrading Spaces:

```yaml
observability:
  enabled: true
  tracing:
    enabled: true
    sampling:
      rate: 0.1  # Sample 10% of new traces (0.0-1.0)
```

## Sampling strategy

All components use **parent-based sampling**:

<!-- vale gitlab.SentenceLength = NO -->
- **With parent context**: If a `traceparent` header is present, the system
  respects the parent's sampling decision, enabling proper distributed tracing
  across services.
- **Root spans**: For new traces without a parent, the system samples based on
  the configured rate. The default sampling rate is 10%.
<!-- vale gitlab.SentenceLength = YES -->

## TLS configuration

### In-cluster collector (default)

By default, components connect to the in-cluster telemetry collector using the
Spaces CA. No extra TLS configuration is needed:

```yaml
observability:
  enabled: true
  tracing:
    enabled: true
```

### External collectors

To send traces to an external OTLP collector, configure a custom endpoint and
CA bundle:

```yaml
observability:
  enabled: true
  tracing:
    enabled: true
    endpoint: "otel-collector.monitoring"
    port: 443
    tls:
      # The secret must contain a key named 'ca.crt' with the PEM-encoded
      # CA bundle
      caBundleSecretRef: "otel-collector-ca"
```

<!-- vale gitlab.SentenceLength = NO -->
When you set `caBundleSecretRef`, components use the CA bundle from the
referenced Kubernetes secret. When not set, components use the Spaces CA for the
in-cluster collector.
<!-- vale gitlab.SentenceLength = YES -->

## Component-specific tracing

Each component adds custom attributes for filtering and correlation. See the
component-specific documentation for details:

- [Spaces Router traces](spaces-router.md) - reverse proxy routing to control planes
- [Spaces API traces](spaces-api.md) - Spaces resource management API
- [Query API traces](query-api.md) - cross-control plane query service
