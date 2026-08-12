---
title: Spaces Router Traces
sidebar_position: 10
description: Distributed tracing details for the Spaces Router (Envoy) component.
---

The Spaces Router uses Envoy as a reverse proxy to route traffic to control
planes. Envoy generates distributed traces through OpenTelemetry integration,
providing end-to-end visibility into request flow across the system.

For common tracing configuration, see the
[distributed tracing overview](overview.md).

## Overview

The router implements distributed tracing using **service.name**:
`spaces-router`

## Custom tags

The router adds custom tags to every span to enable filtering and grouping by
control plane. These are in addition to standard HTTP span attributes:

| Tag | Source | Description | Example |
|-----|--------|-------------|---------|
| `controlplane.id` | `x-upbound-mxp-id` header | Control plane UUID | `b2b37aaa-ee55-492c-ba0c-4d561a6325fa` |
| `controlplane.name` | `x-upbound-mxp-host` header | Internal vcluster hostname | `vcluster.mxp-b2b37aaa-ee55-...` |
| `hostcluster.id` | `x-upbound-hostcluster-id` header | Host cluster identifier (when present) | `a1b2c3d4-e5f6-7890-abcd-...` |

These tags enable queries like:

- "Show me all slow requests to control plane X"
- "Find errors for control planes in host cluster Y"
- "Trace a request across multiple control planes"

<!-- vale Upbound.Spelling = NO -->
## Envoy-specific attributes
<!-- vale Upbound.Spelling = YES -->

The router includes additional Envoy-specific attributes:

| Attribute | Description | Example |
|-----------|-------------|---------|
| `upstream_cluster` | Target cluster name | `ctp-b2b37aaa-...-api-cluster` |
| `response_flags` | Envoy response flags | `-` (none), `UH` (no healthy upstream) |
| `node_id` | Envoy node identifier | `mxe-router` |
| `component` | Envoy component | `proxy` |
| `request_size` | Request body size in bytes | `0`, `1234` |
| `response_size` | Response body size in bytes | `1827` |
