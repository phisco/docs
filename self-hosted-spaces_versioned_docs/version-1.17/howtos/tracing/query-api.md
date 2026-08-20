---
title: Query API Traces
sidebar_position: 30
description: Distributed tracing details for the Query API (Apollo) component.
---

Query API (Apollo) provides querying capabilities for Kubernetes resources
across multiple Crossplane control planes.

For common tracing configuration, see the
[distributed tracing overview](overview.md).

## Overview

Service name: **`spaces-apollo`**

Each request generates three span types:

- Router ingress (routes to Apollo cluster)
- Apollo HTTP (processes query)
- PostgreSQL (executes SQL)

## Architecture

Requests flow through Spaces Router to Apollo:

```text
Client → Spaces Router → Apollo (Query API) → PostgreSQL
   │           │              │                    │
   └───────────────────────────────────────────────→ Single Trace
```

Each request produces four spans:

1. **Router ingress** - Envoy routes to `spaces-apollo` cluster
2. **Auth check** - External authorization validates request
3. **Apollo HTTP** - Query API processes request (service.name: `spaces-apollo`)
4. **PostgreSQL** - Database executes SQL

### Enabling tracing

Configure Query API tracing via Helm values:

```yaml
apollo:
  apollo:
    observability:
      enabled: true
      tracing:
        enabled: true
        endpoint: "telemetry-spaces-collector.upbound-system.svc.cluster.local"
        insecure: false
        port: 4317
        sampling:
          rate: 0.1 # 10%
        tls:
          caBundleSecretRef: spaces-ca
```

## Custom tags

### Apollo spans

Apollo exports spans with `service.name: query-api` and includes:

| Attribute | Description | Example Value |
|-----------|-------------|---------------|
| `http.request.method` | HTTP method | `POST` |
| `url.path` | Request path | `/apis/query.spaces.upbound.io/v1alpha2/namespaces/default/queries` |
| `http.response.status_code` | Status code | `200` |
| `http.request.body.size` | Request size | `360` |
| `http.response.body.size` | Response size | `3702` |
| `server.address` | Server hostname | `127.0.0.1` |
| `network.peer.address` | Client IP | `192.168.2.11` |
| `user_agent.original` | User agent | `up-cli/v0.40.0 (darwin; arm64)` |

### Database spans

Database spans include PostgreSQL connection pool metrics:

| Attribute | Description | Example Value |
|-----------|-------------|---------------|
| `db.system` | Database system | `postgresql` |
| `db.name` | Database name | `upbound` |
| `db.operation` | Operation type | `query` |
| `db.statement` | SQL query | Full SQL statement |
| `db.pool.total_conns` | Total connections | `1` |
| `db.pool.idle_conns` | Idle connections | `1` |
| `db.pool.acquired_conns` | Acquired connections | `0` |
