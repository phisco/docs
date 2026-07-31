---
title: High availability
sidebar_position: 12
description: Run Hub with redundancy across nodes and zones.
---

Hub survives the loss of a single Pod, node, or zone when you run `hub-core` and
`hub-webui` with multiple replicas and spread them intentionally.

## Prerequisites
<!-- vale write-good.Passive = NO -->
<!-- vale write-good.TooWordy = NO -->
- A self-hosted Hub install per [the self-hosted install
  guide][install].
- A worker pool with at least three nodes spread across separate failure
  domains. Node labels for `topology.kubernetes.io/zone` (or an equivalent label
  your cluster sets) are required for zone-level anti-affinity.
- An externally managed PostgreSQL with its own HA story. Hub itself goes
  stateless across replicas, so cluster availability is bounded by the database
  tier. See [the database overview][overview].
- Sized resource requests for `hub-core`. Pick a tier in [sizing][sizing]
  before scaling out. Replicas without requests don't pack onto separate
  nodes reliably.
<!-- vale write-good.TooWordy  = YES -->
<!-- vale write-good.Passive = YES -->

HA applies to `hub-core` and `hub-webui`. The `hub-connector` runs as a singleton
in each observed control plane by design and isn't horizontally scaled.

## Configure replicas

Set the replica count for `hub-core` (and, if you installed the UI, for
`hub-webui`):

```yaml
hub-core:
  api:
    replicaCount: 3

hub-webui:
  replicaCount: 2
```

Three `hub-core` replicas is the smallest count that survives a node drain while
keeping a quorum of Ready Pods serving traffic. `hub-core` is stateless (every
replica reads and writes the same PostgreSQL backend), so you can scale up
further without coordination. The UI is a static asset server. Two replicas are
enough for redundancy.

## Configure pod disruption budgets

The chart renders a PodDisruptionBudget for `hub-core`, but leaves it off by
default. Enable it once you run more than one replica so voluntary disruptions
(node drains, cluster upgrades) can't evict every replica at once:

```yaml
hub-core:
  api:
    pdb:
      create: true
      minAvailable: 2
```

The `hub-webui` chart carries the same budget. Enable it if you scaled the UI:

```yaml
hub-webui:
  pdb:
    create: true
    minAvailable: 1
```

See the [Kubernetes PodDisruptionBudget
docs][kubernetes-poddisruptionbudget-docs] for the
full field reference.

## Configure anti-affinity

Spread replicas across nodes and zones so a single failure domain can't take
down every Pod:

```yaml
hub-core:
  api:
    affinity:
      podAntiAffinity:
        requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app.kubernetes.io/name: hub-core
                app.kubernetes.io/instance: hub
            topologyKey: kubernetes.io/hostname
        preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app.kubernetes.io/name: hub-core
                  app.kubernetes.io/instance: hub
              topologyKey: topology.kubernetes.io/zone
```

The required term keeps two `hub-core` Pods off the same node. The preferred term
steers the scheduler toward different zones when capacity allows, without making
the Pods unschedulable if a zone is full. If you operate in a single zone, drop
the preferred term. See the [Kubernetes affinity and anti-affinity
docs][kubernetes-affinity-and-anti-affinity-docs]
for alternative topology keys.

## Next step

- [Autoscaling][autoscaling]. Let `hub-core` grow and shrink with load instead
  of running a fixed replica count.

[autoscaling]: /hub/howtos/autoscaling
[install]: /hub/howtos/install
[kubernetes-affinity-and-anti-affinity-docs]: https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#affinity-and-anti-affinity
[kubernetes-poddisruptionbudget-docs]: https://kubernetes.io/docs/concepts/workloads/pods/disruptions/
[overview]: /hub/howtos/databases/overview
[sizing]: /hub/howtos/sizing
