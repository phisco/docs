---
title: Autoscaling
sidebar_position: 13
description: Scale hub-core with the Horizontal Pod Autoscaler.
---

## Horizontal pod autoscaler

The chart includes an opt-in `HorizontalPodAutoscaler` for `hub-core`. When
enabled, the HPA scales the `hub-core` Deployment based on observed CPU
utilization against the Pod's CPU request.

Enable it in your `values.yaml`:

```yaml
hub-core:
  api:
    resources:
      requests:
        cpu: 500m
        memory: 512Mi
      limits:
        cpu: 1000m
        memory: 1Gi
    autoscaling:
      enabled: true
      minReplicas: 2
      maxReplicas: 10
      targetCPUUtilizationPercentage: 70
```

The HPA requires a running Kubernetes metrics server in the cluster.
Without it, the HPA can't read CPU metrics and doesn't scale.

<!-- vale write-good.Passive = NO -->
:::note
The HPA needs CPU `requests` set on the `hub-core` container to compute
utilization. The chart leaves `resources` empty by default. Set requests and
limits explicitly before enabling the HPA, or scaling decisions are
undefined.
:::
<!-- vale write-good.Passive = YES -->

### Custom metrics

CPU and memory are the only metrics the chart wires today. Hub-specific signals
(hub-core query rate, hub-connector ingestion backlog, PostgreSQL connection
saturation) are available via Prometheus. These aren't yet integrated into
the chart's HPA template. If you need to scale on those signals, install a
custom metrics adapter such as the Prometheus Adapter. Then manage your own
`HorizontalPodAutoscaler` resource alongside the chart. Native chart support for
custom metrics is on the roadmap.

## Next step

- [Production overview][production-overview]. Review the rest of the hardening
  checklist.
- [High availability][high-availability]. Pair autoscaling with replica
  counts, PodDisruptionBudgets, and anti-affinity.

[high-availability]: /hub/howtos/high-availability
[production-overview]: /hub/howtos/production-overview
