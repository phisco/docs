---
title: Use and Configure Observability Views
description: "Monitor control plane health, resource status, and reconciliation metrics from the Web UI"
sidebar_position: 3
---
<!-- vale Microsoft.Adverbs = NO -->
<!-- vale write-good.Weasel = NO -->
The UXP [Web UI][web-ui] includes built-in observability views that help you
quickly triage issues in your control plane. The dashboard combines resource
state with time-series metrics in one place.

:::note
Time-series metrics require a **Standard** license. Without a license, UXP
serves the resource and package state views only.
:::

Observability views help with quick fault attribution, not as a
replacement for external monitoring stacks.

Observability views can help:

- Identify failing resources. Quickly assess resource health and filter unready
    resources.
- Troubleshoot control plane issues. Check reconcile rates and API call volumes
    to validate the scope of an issue.
- Track function performance. Check function execution latency and find slow or
    failing functions.
<!-- vale Microsoft.Adverbs = YES -->
<!-- vale write-good.Weasel = YES -->
For long-term retention, alerting, and deep analysis, use an
external monitoring stack (Grafana, Datadog, etc).

## Available data

The observability dashboard displays data from two sources:
<!-- vale write-good.Passive = NO -->
1. Resource and Package State (QueryAPI)

    - Resource health chart provides a count of resources by Ready condition
    - Package health chart provides a count of providers, functions, and configurations by health status
    - Not Ready resources table filters and inspects resources that aren't healthy
    - Resource creation timeline allow you to see when resources were created over time

2. Time-Series Metrics (Prometheus, Standard editions only)

    - Reconciliation metrics provides reconciliation rates per controller to identify stuck or overloaded controllers
    - External API calls captures the volume of API calls per resource kind to spot providers under heavy load. This metric is only available for **provider-aws**. Other upjet-based providers (Azure, GCP) don't emit `upjet_resource_external_api_calls_total`.
    - Function latency provides function execution times to identify performance issues
<!-- vale write-good.Passive = YES -->


### Resources and packages at a glance

The Web UI dashboard provides a quick look at your control plane resources: 


![Query API dashboards 1](/img/query-api-dashboards-1.png)

### Package health

You can click into these views to see more information:

![Query API dashboards 2](/img/query-api-dashboards-2.png)

### Additional metrics

![Metric dashboards](/img/metrics-dashboards.png)

## Feature availability

A **Standard** license unlocks the time-series charts:

| Feature | No license | Standard |
|---------|------------|----------|
| Resource health chart | ✓ | ✓ |
| Package health chart | ✓ | ✓ |
| Not Ready resources table | ✓ | ✓ |
| Resource creation timeline | ✗ | ✓ |
| Reconciliation metrics charts | ✗ | ✓ |
| External API call charts | ✗ | ✓ |
| Function latency charts | ✗ | ✓ |

## Prometheus

UXP deploys a lightweight Prometheus instance for **Standard** license 
deployments to power the metrics charts. It's preconfigured with 12-hour
retention and metric filtering that keeps only what the dashboard needs.

<!-- vale Google.Headings = NO -->
### Bring your own Prometheus
<!-- vale Google.Headings = YES -->

If you already run your own Prometheus, disable the built-in instance and point
the dashboard at yours through Helm values:

```yaml
webui:
  config:
    metricsApiEndpoint: 'http://your-prometheus:9090/api/v1'
```

Your Prometheus needs to scrape UXP components and have these metrics available:

- `controller_runtime_reconcile_total`
- `upjet_resource_external_api_calls_total` Emitted by **provider-aws only**. Azure and GCP upjet-based providers don't support this metric.
- `function_run_function_seconds_bucket`, `_sum`, `_count`

[web-ui]: /manuals/console/self-service
