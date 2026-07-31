---
title: Metrics pipeline
sidebar_position: 4
description: Enable the Metrics feature, pick a Prometheus-compatible backend, and turn on collection for connected control planes.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Metrics needs configuration on both sides of the connector: a gateway and
a storage backend on the hub, and a collector on each control plane you want to
collect from. This page covers both. See
[Metrics](../products/insights/metrics/overview.md) for what the feature does and how to
query it.

Hub doesn't run the metrics store. You point the gateway at a
Prometheus-compatible backend you already operate, and the query API reads back
from the same backend.

## Prerequisites

Before you start, have the following ready:
<!-- vale write-good.Passive = NO -->
- A running Hub installation. See [Installing Hub](install.md).
- Helm access to the Hub release, so you can run `helm upgrade`. See [the chart
  reference](install.md#the-chart-reference) for what `<chart-ref>` stands for.
- At least one connected control plane or space. See [Connect a control
  plane](connect-control-plane.md) and [Connect a space](connect-space.md).
- A Prometheus-compatible backend that accepts remote-write and serves the
  Prometheus HTTP query API, reachable from the Hub cluster.
- The feature flag server enabled. The server is on by default; the `Metrics`
  gate it serves isn't. See [Feature flags](../reference/feature-flags.md).
<!-- vale write-good.Passive = YES -->

## Step 1: Choose a backend

The gateway writes through one exporter, and the query API reads from one URL.
Both come from `hub-core.otelGateway.metrics`.

| `backend` | Writes with | Use it for |
| --- | --- | --- |
| `prometheus` | Prometheus remote-write | Self-hosted Prometheus, Thanos, Mimir, or any remote-write endpoint. |
| `gmp` | The native Google Managed Prometheus exporter | Google Managed Prometheus. |
| `amp` | Remote-write | Amazon Managed Prometheus. |

`queryURL` is the base URL the query API reads from, and it's separate from the
write endpoint on every backend. For self-hosted Prometheus the two usually
share a host. For managed Prometheus they don't.

## Step 2: Configure the hub

Enable the `Metrics` gate, the OTel gateway, and a backend. The gate turns on
the `metrics.hub.upbound.io` API group; the gateway receives, labels, and
forwards.

<Tabs groupId="metrics-backend">
<TabItem value="prometheus" label="Self-hosted Prometheus">

1. Add the gate and the gateway to your `values.yaml`.

   ```yaml
   hub-core:
     api:
       featureFlags:
         gates:
           Metrics: true
     otelGateway:
       enabled: true
       metrics:
         backend: prometheus
         queryURL: http://prometheus-server.monitoring.svc
         prometheus:
           writeEndpoint: http://prometheus-server.monitoring.svc/api/v1/write
           insecure: true
   ```

2. Confirm your Prometheus accepts remote-write. Prometheus rejects it unless
   you start it with the receiver enabled:

   ```shell
   prometheus --web.enable-remote-write-receiver
   ```

</TabItem>
<TabItem value="gmp" label="Google Managed Prometheus">

1. Add the gate and the gateway to your `values.yaml`.

   ```yaml
   hub-core:
     api:
       featureFlags:
         gates:
           Metrics: true
     otelGateway:
       enabled: true
       serviceAccount:
         annotations:
           iam.gke.io/gcp-service-account: <gsa-name>@<project>.iam.gserviceaccount.com
       metrics:
         backend: gmp
         queryURL: <gmp-query-endpoint>
         gmp:
           project: <project>
   ```

2. Grant the gateway a Google identity. The exporter writes to the Google Cloud
   Monitoring API over gRPC and authenticates with Application Default
   Credentials, so the gateway ServiceAccount needs a Google identity holding
   `roles/monitoring.metricWriter`, through Workload Identity or a mounted key.

3. Point `queryURL` at a Prometheus-compatible read endpoint for the same data.
   Google Managed Prometheus doesn't serve the Prometheus HTTP query API
   directly. Deploy the [GMP frontend
   proxy][gmp-frontend] and use its address.

</TabItem>
<TabItem value="amp" label="Amazon Managed Prometheus">

1. Add the gate and the gateway to your `values.yaml`.

   ```yaml
   hub-core:
     api:
       featureFlags:
         gates:
           Metrics: true
       serviceAccount:
         annotations:
           eks.amazonaws.com/role-arn: arn:aws:iam::<account>:role/<hub-core-query-role>
     otelGateway:
       enabled: true
       serviceAccount:
         annotations:
           eks.amazonaws.com/role-arn: arn:aws:iam::<account>:role/<gateway-write-role>
       metrics:
         backend: amp
         queryURL: https://aps-workspaces.<region>.amazonaws.com/workspaces/<workspace-id>
         amp:
           writeEndpoint: https://aps-workspaces.<region>.amazonaws.com/workspaces/<workspace-id>/api/v1/remote_write
           region: <region>
   ```

   `region` is required. The query API has no other source for it.

2. Annotate both ServiceAccounts, with different permissions. The write path and
   the read path resolve AWS credentials independently, in different Pods:

   | Path | ServiceAccount | IAM permission |
   | --- | --- | --- |
   | Write | `otelGateway.serviceAccount` | `aps:RemoteWrite` |
   | Read | `api.serviceAccount` | `aps:QueryMetrics` |

</TabItem>
</Tabs>

Apply the values with an upgrade:

```shell
helm upgrade hub <chart-ref> \
  --namespace hub \
  --values values.yaml
```

Confirm the gateway is running:

```shell
kubectl --namespace hub get pods --selector app.kubernetes.io/component=otel-gateway
```

## Step 3: Turn on collection for control planes

The hub side receives, but nothing sends until you enable the collector on the
connector. The collector is off by default in the `hub-connector` chart.

<Tabs groupId="metrics-source">
<TabItem value="controlplane" label="A connected control plane">

Upgrade the connector on the control plane:

```shell
helm upgrade hub-connector oci://xpkg.upbound.io/upbound/hub-connector \
  --kube-context "$CONTROL_PLANE_CONTEXT" \
  --namespace upbound-system \
  --reuse-values \
  --set collector.enabled=true \
  --set rsm.enabled=true
```

</TabItem>
<TabItem value="space" label="A connected space">

A space connector provisions a metrics pipeline into each member control plane,
using the same values. Set them once on the space connector and every control
plane in the space collects:

```shell
helm upgrade hub-connector oci://xpkg.upbound.io/upbound/hub-connector \
  --kube-context "$SPACE_CONTEXT" \
  --namespace upbound-system \
  --reuse-values \
  --set collector.enabled=true \
  --set rsm.enabled=true
```

The space connector applies the change to control planes as it reconciles them.
New control planes get the pipeline when it provisions their connector.

</TabItem>
</Tabs>

### What the collector scrapes

The collector discovers Pods in `collector.scrapeNamespaces` and keeps only
those annotated `prometheus.io/scrape: "true"`. It scrapes port `8080` and path
`/metrics` unless the Pod overrides them with `prometheus.io/port` and
`prometheus.io/path`.

| Value | Default | Description |
| --- | --- | --- |
| `collector.scrapeNamespaces` | `[crossplane-system, upbound-system]` | Namespaces to discover Pods in. Upstream Crossplane installs into `crossplane-system`; UXP installs into `upbound-system`. |
| `collector.scrapeInterval` | `15s` | How often to scrape each target. |
| `collector.metricAllowlist` | The curated set | Metric-name regexps that may leave the control plane. |

### Turn on resource state metrics

`rsm.enabled` deploys [resource-state-metrics][rsm], a SIG Instrumentation
project that turns resource status conditions into
`kube_customresource_resource_condition` gauges. It's optional and off by
default. The collector scrapes it as an extra target, and the
`kube_customresource_.*` entry in the default allowlist lets those series
through.

`rsm.apiGroups` selects which API groups it watches, and defaults to `"*"`.

:::warning
At `"*"` the component emits a series per condition per resource in the control
plane, including core Kubernetes objects. Around 1,000 resources produces about
9,000 series. Narrow `rsm.apiGroups` to the Crossplane groups you care about
before enabling it on a large control plane.
:::

## Step 4: Verify

1. Query the API group to confirm it responds. With the gate on,
   `/apis/metrics.hub.upbound.io/v1alpha1` returns:

   ```json
   {
     "kind": "APIResourceList",
     "apiVersion": "v1",
     "groupVersion": "metrics.hub.upbound.io/v1alpha1",
     "resources": [
       {
         "name": "queries",
         "singularName": "",
         "namespaced": false,
         "kind": "Query",
         "verbs": [
           "create"
         ]
       }
     ]
   }
   ```

2. Query for anything the pipeline should be producing. Metrics take a scrape
   interval or two to appear after you enable the collector.

   ```shell
   curl -sk -H "Authorization: Bearer $TOKEN" \
     -X POST "<hub-url>/apis/metrics.hub.upbound.io/v1alpha1/queries" \
     -H 'Content-Type: application/json' \
     -d '{
       "apiVersion": "metrics.hub.upbound.io/v1alpha1",
       "kind": "Query",
       "query": {
         "promql": "count(controller_runtime_reconcile_total) by (control_plane_name)",
         "start": "2026-07-29T12:00:00Z",
         "end": "2026-07-29T13:00:00Z",
         "step": "5m"
       }
     }' | jq '.results.series[].labels'
   ```

   One series per collecting control plane means the whole path works.

## Add metrics to the allowlist

Both sides filter, so a metric needs adding in two places. The collector's
`collector.metricAllowlist` decides what leaves a control plane, and the
gateway's `otelGateway.metricAllowlist` re-checks the same set on arrival as a
safety net. A metric allowed on only one side never reaches storage.

Entries are regular expressions matched against the metric name. Histograms
expand into `_bucket`, `_sum`, and `_count` series, so match them with a
trailing `.*`.

1. Add the metric to the gateway allowlist. Repeat the default entries, since
   Helm replaces lists rather than merging them:

   ```yaml
   hub-core:
     otelGateway:
       metricAllowlist:
         - "controller_runtime_reconcile_total"
         - "controller_runtime_reconcile_errors_total"
         - "controller_runtime_reconcile_time_seconds.*"
         - "upjet_resource_external_api_calls_total"
         - "function_run_function_seconds.*"
         - "kube_customresource_.*"
         - "my_provider_custom_metric.*"
   ```

2. Add the same entry to `collector.metricAllowlist` on every connector that
   should send it, listing the defaults again for the same reason.

3. Upgrade both releases.

:::warning
Every label combination on an allowed metric becomes a stored time series, on
every control plane in the fleet. Check that the metric you're adding doesn't
carry per-resource or per-request labels before you add it.
:::

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `404` on the metrics API group | Enable the `Metrics` gate (`hub-core.api.featureFlags.gates.Metrics=true`). |
| `hub-core` fails to start after enabling the gate | The gate needs `hub-core.otelGateway.enabled=true`. `hub-core` exits when the gate is on and the gateway URLs are unset. |
| Chart fails to render with a missing-backend error | Set `hub-core.otelGateway.metrics.backend` to `prometheus`, `gmp`, or `amp`. |
| `403` on every query | The caller has no authorized control planes. Grant access to a realm or a control plane. See [RBAC](rbac.md). |
| Queries succeed but return no series | Confirm `collector.enabled=true` on the connector, that the target Pods carry `prometheus.io/scrape: "true"`, and that their namespace is in `collector.scrapeNamespaces`. |
| A specific metric never arrives | Add it to both `collector.metricAllowlist` and `otelGateway.metricAllowlist`. |
| Writes work, queries fail on Amazon Managed Prometheus | Annotate `api.serviceAccount` with an IRSA role granting `aps:QueryMetrics`. The gateway's role only covers writes. |
| Queries fail on Google Managed Prometheus | `queryURL` must point at a Prometheus-compatible read endpoint. Google Managed Prometheus doesn't serve one directly, so deploy the [GMP frontend proxy][gmp-frontend] and use its address. |

## See also

- [Metrics](../products/insights/metrics/overview.md)
- [Feature flags](../reference/feature-flags.md)
- [Connect a control plane](connect-control-plane.md)
- [Connect a space](connect-space.md)

[gmp-frontend]: https://cloud.google.com/stackdriver/docs/managed-prometheus/query#promql-ui
[rsm]: https://github.com/kubernetes-sigs/resource-state-metrics
