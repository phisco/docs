---
title: Observability
sidebar_position: 50
description: A guide for how to use the integrated observability pipeline feature
  in a Space.
plan: "enterprise"
---

<Enterprise />

This guide explains how to configure control plane observability in Upbound
Spaces. Upbound provides integrated observability features built on
[OpenTelemetry][opentelemetry] to collect, process, and export logs, metrics,
and traces from workloads running within individual control planes.

<!-- vale Google.Headings = NO -->

:::tip
For self-hosted Space administrators who want to observe the cluster
infrastructure, see the
[Space-level observability guide][space-level-o11y]. That guide covers
infrastructure metrics, router metrics, and [distributed tracing](/self-hosted-spaces/howtos/tracing/overview).
:::


## Prerequisites
<!-- vale write-good.Passive = NO -->
<!-- vale write-good.TooWordy = NO -->
**Control plane observability** is enabled by default. No additional setup is
required.
<!-- vale write-good.TooWordy = YES -->
<!-- vale write-good.Passive = YES -->

### Self-hosted Spaces

1. **Enable the observability feature** when installing Spaces:
   ```bash
   up space init --token-file="${SPACES_TOKEN_PATH}" "v${SPACES_VERSION}" \
     ...
     --set "observability.enabled=true"
   ```

Set `features.alpha.observability.enabled=true` instead if using Spaces version
before `v1.14.0`.

## Control plane observability

Control plane observability collects telemetry data from workloads running
within individual control planes using `SharedTelemetryConfig` resources.

The pipeline deploys [OpenTelemetry Collectors][opentelemetry-collectors] per
control plane, defined by a `SharedTelemetryConfig` at the group level.
Collectors pass data to external observability backends.

:::important
From Spaces `v1.13` and beyond, telemetry only includes user-facing control
plane workloads (Crossplane, providers, functions).

Self-hosted users can include system workloads (`api-server`, `etcd`) by setting
`observability.collectors.includeSystemTelemetry=true` in Helm.
:::

:::important
Spaces validates `SharedTelemetryConfig` resources before applying them by
sending telemetry to configured exporters. For self-hosted Spaces, ensure that
`spaces-controller` can reach the exporter endpoints.
:::

### `SharedTelemetryConfig`

`SharedTelemetryConfig` is a group-scoped custom resource that defines telemetry
configuration for control planes.

#### New Relic example

```yaml
apiVersion: observability.spaces.upbound.io/v1alpha1
kind: SharedTelemetryConfig
metadata:
  name: newrelic
  namespace: default
spec:
  controlPlaneSelector:
    labelSelectors:
      - matchLabels:
          org: foo
  exporters:
    otlphttp:
      endpoint: https://otlp.nr-data.net
      headers:
        api-key: YOUR_API_KEY
  exportPipeline:
    metrics: [otlphttp]
    traces: [otlphttp]
    logs: [otlphttp]
```

#### Datadog Example

```yaml
apiVersion: observability.spaces.upbound.io/v1alpha1
kind: SharedTelemetryConfig
metadata:
  name: datadog
  namespace: default
spec:
  controlPlaneSelector:
    labelSelectors:
      - matchLabels:
          org: foo
  exporters:
    datadog:
      api:
        site: ${DATADOG_SITE}
        key: ${DATADOG_API_KEY}
  exportPipeline:
    metrics: [datadog]
    traces: [datadog]
    logs: [datadog]
```

<!-- vale Upbound.Spelling = NO -->
<!-- vale Microsoft.HeadingAcronyms = NO -->
#### Splunk HEC Example
<!-- vale Microsoft.HeadingAcronyms = YES -->
<!-- vale Upbound.Spelling = YES -->

```yaml
apiVersion: observability.spaces.upbound.io/v1alpha1
kind: SharedTelemetryConfig
metadata:
  name: splunk
  namespace: default
spec:
  controlPlaneSelector:
    labelSelectors:
      - matchLabels:
          org: foo
  exporters:
    splunk_hec:
      endpoint: https://splunk.example.com:8088/services/collector
      token: ${SPLUNK_HEC_TOKEN}
  exportPipeline:
    metrics: [splunk_hec]
    traces: [splunk_hec]
    logs: [splunk_hec]
```

### Control plane selection

Use `spec.controlPlaneSelector` to specify which control planes should use the
telemetry configuration.

#### Label-based selection

```yaml
spec:
  controlPlaneSelector:
    labelSelectors:
      - matchLabels:
          environment: production
```

#### Expression-based selection

```yaml
spec:
  controlPlaneSelector:
    labelSelectors:
      - matchExpressions:
        - { key: environment, operator: In, values: [production,staging] }
```

#### Name-based selection

```yaml
spec:
  controlPlaneSelector:
    names:
    - controlplane-dev
    - controlplane-staging
    - controlplane-prod
```

### Manage sensitive data

:::important
Available from Spaces `v1.10`
:::

Store sensitive data in Kubernetes secrets and reference them in your
`SharedTelemetryConfig`:

1. **Create the secret:**
   ```bash
   kubectl create secret generic sensitive -n <STC_NAMESPACE> \
       --from-literal=apiKey='YOUR_API_KEY'
   ```

2. **Reference in SharedTelemetryConfig:**
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
           api-key: dummy # Replaced by secret value
     exportPipeline:
       metrics: [otlphttp]
       traces: [otlphttp]
       logs: [otlphttp]
   ```

### Telemetry processing

:::important
Available from Spaces `v1.11`
:::

Configure processing pipelines to transform telemetry data using the [transform
processor][transform-processor].

#### Add labels to metrics

```yaml
spec:
  processors:
    transform:
      error_mode: ignore
      metric_statements:
        - context: datapoint
          statements:
            - set(attributes["newLabel"], "someLabel")
  processorPipeline:
    metrics: [transform]
```

#### Remove labels

From metrics:
```yaml
processors:
  transform:
    metric_statements:
      - context: datapoint
        statements:
          - delete_key(attributes, "kubernetes_namespace")
```

From logs:
```yaml
processors:
  transform:
    log_statements:
      - context: log
        statements:
          - delete_key(attributes, "log.file.name")
```

#### Modify log messages

```yaml
processors:
  transform:
    log_statements:
      - context: log
        statements:
          - set(attributes["original"], body)
          - set(body, Concat(["log message:", body], " "))
```

### Monitor status

Check the status of your `SharedTelemetryConfig`:

```bash
kubectl get stc
NAME       SELECTED   FAILED   PROVISIONED   AGE
datadog    1          0        1             63s
```

- `SELECTED`: Number of control planes selected
- `FAILED`: Number of control planes that failed provisioning
- `PROVISIONED`: Number of successfully running collectors

For detailed status information:

```bash
kubectl describe stc <name>
```

## Supported exporters

Upbound Spaces supports the following exporters:
- `datadog` - For Datadog integration
- `otlphttp` - General-purpose exporter (used by New Relic, among others)
<!-- vale Upbound.Spelling = NO -->
- `splunk_hec` - For Splunk HTTP Event Collector integration
<!-- vale Upbound.Spelling = YES -->
- `debug` - For troubleshooting

## Considerations

- **Control plane conflicts**: Each control plane can only use one `SharedTelemetryConfig`. Multiple configs selecting the same control plane conflict.
- **Resource scope**: `SharedTelemetryConfig` resources are group-scoped, allowing different telemetry configurations per group.

For more advanced configuration options, review the [Helm chart
reference][helm-chart-reference] and [OpenTelemetry Transformation Language
documentation][opentelemetry-transformation-language].

<!-- vale Google.Headings = YES -->
[opentelemetry]: https://opentelemetry.io/
[opentelemetry-collectors]: https://opentelemetry.io/docs/collector/
[transform-processor]: https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/processor/transformprocessor/README.md
[opentelemetry-transformation-language]: https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/pkg/ottl
[space-level-o11y]: /self-hosted-spaces/howtos/space-observability
[helm-chart-reference]: /reference/spaces-helm-reference/
