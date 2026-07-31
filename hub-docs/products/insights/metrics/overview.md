---
title: Metrics
sidebar_position: 1
description: Collect Crossplane and resource metrics from every connected control plane and query them fleet-wide with PromQL.
---

Metrics gives you one place to ask questions about Crossplane behavior across
every control plane you've connected to Hub. A collector on each control
plane scrapes Crossplane, its providers and functions, filters to a curated set
of metrics, and ships them to Hub over the connector's authenticated channel.
Hub stamps each series with the control plane's identity, writes it to a
Prometheus-compatible backend, and serves it back through a query API that
answers in PromQL.

The result is a single query surface for the whole fleet. Instead of opening one
Grafana per cluster, you ask "which control planes have reconcile errors right
now" and get one answer covering every control plane you can see.

You read metrics through the `metrics.hub.upbound.io` API group and its `Query`
resource.

:::note
Metrics is an alpha feature. It's disabled by default, and its API may
change in incompatible ways between releases. See the [feature
lifecycle](../../../reference/feature-releases.md). Set the `Metrics` gate in your
Helm values to turn it on. It also needs an OTel gateway and a
Prometheus-compatible backend. See [Feature
flags](../../../reference/feature-flags.md#metrics).
:::

## The pipeline

Metrics travel the same path as resource data, through the connector already
running on each control plane.

| Stage | What runs | What it does |
| --- | --- | --- |
| Scrape | Collector in the `hub-connector` chart | Discovers Crossplane Pods, scrapes them, and drops everything outside the curated allowlist. |
| Push | `hub-connector` | Forwards OTLP over the connector's authenticated channel to Hub. |
| Ingest | `hub-core` | Authenticates the connector, resolves its identity, and forwards to the gateway. |
| Stamp and store | OTel gateway in the `hub-core` chart | Adds identity labels, re-applies the allowlist, and remote-writes to the backend. |
| Query | `hub-core` | Accepts PromQL, scopes it to the caller's control planes, and reads from the backend. |

Only the curated set leaves a control plane, and the gateway applies the same
allowlist again on arrival. A misconfigured or rogue source collector can't
push metrics Hub didn't ask for.

The backend is Prometheus-compatible and swappable: self-hosted Prometheus or
any remote-write endpoint, Google Managed Prometheus, or Amazon Managed
Prometheus. See [Metrics pipeline](../../../howtos/metrics.md) for backend setup.

## What the pipeline collects

Two sources feed the pipeline. Crossplane and its ecosystem expose controller
metrics on their own Pods. Resource State Metrics, an optional component in the
`hub-connector` chart, turns the status conditions of resources in the control
plane into gauges.

The default allowlist covers both:

| Metric | Source | What it tells you |
| --- | --- | --- |
| `controller_runtime_reconcile_total` | Crossplane, providers, functions | Reconcile volume by controller and result. |
| `controller_runtime_reconcile_errors_total` | Crossplane, providers, functions | Reconcile failures by controller. |
| `controller_runtime_reconcile_time_seconds.*` | Crossplane, providers, functions | Reconcile latency histogram. |
| `upjet_resource_external_api_calls_total` | Upjet-based providers | Calls a provider makes to the cloud API it fronts. |
| `function_run_function_seconds.*` | Composition functions | Function execution latency histogram. |
| `kube_customresource_.*` | Resource State Metrics | Status conditions of resources in the control plane. |

The list is a Helm value on both the collector and the gateway, so you can add
metrics your providers expose. Both sides must allow a metric for it to reach
storage. See [adding metrics to the
allowlist](../../../howtos/metrics.md#add-metrics-to-the-allowlist).

Resource State Metrics emits one `kube_customresource_resource_condition` series
per condition per resource, labeled with `group`, `version`, `kind`, `name`,
`namespace`, and `condition_type`. A value of `1` means the condition is `True`.

:::warning
Resource State Metrics watches every API group by default, so its series count
scales with the number of resources in the control plane, not with the number of
Crossplane resources. Narrow `rsm.apiGroups` before enabling it on a large
control plane.
:::

## Querying metrics

Send a `Query` to `metrics.hub.upbound.io/v1alpha1`. It runs a PromQL range
query and returns the resulting time series.

```shell
curl -sk -H "Authorization: Bearer $TOKEN" \
  -X POST "<hub-url>/apis/metrics.hub.upbound.io/v1alpha1/queries" \
  -H 'Content-Type: application/json' \
  -d '{
    "apiVersion": "metrics.hub.upbound.io/v1alpha1",
    "kind": "Query",
    "query": {
      "promql": "sum(rate(controller_runtime_reconcile_total[5m])) by (control_plane_name, result)",
      "start": "2026-07-29T12:00:00Z",
      "end": "2026-07-29T13:00:00Z",
      "step": "5m"
    }
  }' | jq
```

The request body carries four required fields:

| Field | Type | Description |
| --- | --- | --- |
| `query.promql` | string | The PromQL expression. |
| `query.start` | string | Range start, RFC3339. |
| `query.end` | string | Range end, RFC3339. |
| `query.step` | string | Resolution, as a Go duration such as `15s`, `1m`, or `5m`. |

Hub echoes the request and adds `results.series`. Each series carries its label
set and a list of timestamp and value pairs:

```json
{
  "kind": "Query",
  "apiVersion": "metrics.hub.upbound.io/v1alpha1",
  "metadata": {},
  "query": {
    "promql": "sum(rate(controller_runtime_reconcile_total[5m])) by (control_plane_name, result)",
    "start": "2026-07-29T12:00:00Z",
    "end": "2026-07-29T13:00:00Z",
    "step": "5m"
  },
  "results": {
    "series": [
      {
        "labels": {
          "control_plane_name": "cp-a",
          "result": "success"
        },
        "values": [
          { "timestamp": 1785326400, "value": 1.0090489265401168 },
          { "timestamp": 1785326700, "value": 2.0181023783336527 }
        ]
      }
    ]
  }
}
```

Because `Query` is a `POST` against an API group, you can also send it with
`kubectl` using a [`hub` context](../../../howtos/configure-kubectl.md):

```shell
kubectl --context=hub create --raw \
  /apis/metrics.hub.upbound.io/v1alpha1/queries -f query.json
```

## Correlating metrics with fleet data

Metrics and the resources API describe the same objects from two angles. The
resources API holds current state: conditions, the full manifest, and who changed
what. Metrics hold history: when a condition flipped, how often it flips, and how
one control plane compares to the rest of the fleet.

`control_plane_name` and `realm` join them at the control plane level. They're
the `ControlPlane` resource's name and namespace in `hub.upbound.io/v1beta1`.
Below that, the two metric families reach resources at different levels:

| Metric family | Reaches | Through |
| --- | --- | --- |
| `kube_customresource_*` | A single resource | `group`, `kind`, `name`, and `namespace`, which identify the same object the `resources` endpoint returns. |
| `controller_runtime_*` | A resource type | The `controller` label, which names the controller reconciling that type. |

### The `controller` label

Crossplane names each controller after the type it reconciles, as
`<category>/<crd-plural>.<group>`. So
`composite/xdatabases.platform.example.com` is the controller for the
`XDatabase` composite resources in `platform.example.com`, and
`packages/provider.pkg.crossplane.io` is the one reconciling `Provider`
packages. Common categories are `composite`, `claim`, `managed`, `packages`, and
`package-runtime`.

That makes controller metrics a type-level signal: they tell you which kind of
resource its controller is struggling with, not which instance. Pair them with
`kube_customresource_*` or the resources API to get from the type to the
instances.

List the real values before you write a matcher against them, because the shape
varies by controller:

```promql
topk(20, sum(increase(controller_runtime_reconcile_total[15m])) by (controller, result))
```

| Question | Ask |
| --- | --- |
| What state is this resource in now? | Resources API. |
| When did it stop being `Ready`? | `kube_customresource_resource_condition` over a time range. |
| Is it flapping? | `changes()` over the same series. |
| What's unhealthy across the fleet? | `kube_customresource_resource_condition == 0`. |
| Is this control-plane-specific or systemic? | Aggregate by `control_plane_name`. |
| Which kind of resource is failing to reconcile? | `controller_runtime_reconcile_errors_total` by `controller`. |

A worked example. Find which control planes produce the most reconcile errors:

```promql
topk(5, sum(rate(controller_runtime_reconcile_errors_total[5m])) by (control_plane_name))
```

Take the worst control plane and ask which controller, and so which resource
type, the errors come from:

```promql
topk(5, sum(rate(controller_runtime_reconcile_errors_total{control_plane_name="<name>"}[5m])) by (controller))
```

Then find the instances of that type that aren't `Ready`:

```promql
kube_customresource_resource_condition{control_plane_name="<name>", kind="<Kind>", condition_type="Ready"} == 0
```

Then pull one of those resources from the resources API for its conditions,
messages, and manifest:

```shell
kubectl --context=hub get --raw \
  '/apis/hub.upbound.io/v1beta1/resources?search=<resource-name>&view=full'
```

Working fleet-first like this is the point of the feature. Aggregate to find
where a problem lives, then drop to the resources API for the detail on the one
control plane that has it.

## Identity and access

Hub stamps every series with the identity of the control plane it came from,
taken from the authenticated connector rather than from anything the source
collector sends. Write your queries against these two labels:

| Label | Value |
| --- | --- |
| `control_plane_name` | The control plane's name, unique within its realm. |
| `realm` | The realm that owns the control plane. |

Because Hub derives them from the authenticated session on arrival, a control
plane can't claim to be another one. The gateway also strips the per-Pod and
per-node attributes the Prometheus receiver adds during scraping, so a restarted
Pod doesn't create a new time series.

Hub stamps a third label, `control_plane_id`, and uses it to enforce access.
Leave it out of your queries. On every query Hub checks the sender against the
control planes they can access and injects the matching `control_plane_id`
selector. A caller with no authorized control planes gets `403`.

## What the feature doesn't cover

- The query API accepts range queries only. There's no instant-query endpoint.
- The pipeline carries metrics only. Logs and traces don't flow through it.
- CPU and memory metrics aren't in the curated set. They need a metrics source
  on the control plane that Crossplane doesn't provide out of the box.
- Hub doesn't ship a retention policy. Retention belongs to whichever
  Prometheus-compatible backend you point the gateway at.

## See also

- [Metrics pipeline](../../../howtos/metrics.md): enable the feature and choose a backend.
- [Connect a control plane](../../../howtos/connect-control-plane.md)
- [Feature flags](../../../reference/feature-flags.md)
- [Feature lifecycle](../../../reference/feature-releases.md)
