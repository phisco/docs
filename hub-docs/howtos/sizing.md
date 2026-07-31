---
title: Sizing
sidebar_position: 11
description: Pick replica counts, resources, and a Postgres tier by total resource count.
---

This page helps you pick replica counts, resource requests, and a Postgres tier
based on the total number of resources your Hub installation tracks.

:::note
Upbound tested this guidance on GKE at roughly 200,000 and 600,000 resources,
against a single Cloud SQL `db-custom-8-32768` instance (8 vCPU, 32 GiB) running
PostgreSQL 18. Neither test point showed memory pressure. Both used small resource
objects, so larger `spec` and `status` bodies raise ingest cost and database size
on top of the counts below. Above 600,000 resources, start at the `large` tier and
contact Upbound.
:::

## Sizing tiers

One number picks your tier: the total resources Hub tracks. Each connector syncs
the resources in its target control plane and reports them to `hub-core`, which
persists them in PostgreSQL. Count across all connectors, then read the matching
tier below.

The tiers describe `hub-core` replica count, `hub-core` per-pod resource requests
and limits, `hub-connector` per-pod resources, and a recommended Postgres tier.
The chart includes empty `resources: {}` for `hub-core` and `hub-connector` by
default. Set the values shown here explicitly via your `values.yaml`.

Memory requests and limits are identical across all three tiers, which is
deliberate: memory stays flat as the resource count grows for both components.
What moves between tiers is the PostgreSQL instance class, along with the
`hub-core` replica count and CPU request. `hub-core` holds no bulk state, so its
replicas are about availability and absorbing concurrent queries rather than
store size.

### Small

<!-- vale write-good.Weasel = NO -->
For evaluation installs, internal platform teams, and early production with a
handful of clusters.
<!-- vale write-good.Weasel = YES -->

- **Total resources:** up to 50,000.
- **`hub-core` replicas:** 2, for redundancy across nodes. See [high
  availability][high-availability].
- **`hub-core` resources per pod:** requests `cpu: 250m`, `memory: 512Mi`. Limits
  `cpu: 1`, `memory: 1Gi`.
- **`hub-connector` resources per pod:** requests `cpu: 100m`, `memory: 256Mi`.
  Limits `cpu: 1`, `memory: 512Mi`.
- **Postgres:** 2 vCPU and 8 GiB. See [PostgreSQL instance
  classes](#postgresql-instance-classes) for the equivalent in each cloud. Start
  at 20 GiB of SSD storage with autoscaling enabled. No read replica needed.

```yaml
hub-core:
  api:
    replicaCount: 2
    resources:
      requests:
        cpu: 250m
        memory: 512Mi
      limits:
        cpu: 1
        memory: 1Gi

hub-connector:
  connector:
    resources:
      requests:
        cpu: 100m
        memory: 256Mi
      limits:
        cpu: 1
        memory: 512Mi
```

### Medium

For production installs serving a platform organization with a moderate fleet.

- **Total resources:** up to 200,000.
- **`hub-core` replicas:** 3.
- **`hub-core` resources per pod:** requests `cpu: 500m`, `memory: 512Mi`. Limits
  `cpu: 1`, `memory: 1Gi`.
- **`hub-connector` resources per pod:** requests `cpu: 100m`, `memory: 256Mi`.
  Limits `cpu: 1`, `memory: 512Mi`.
- **Postgres:** 2 to 4 vCPU and 16 GiB. See [PostgreSQL
  instance classes](#postgresql-instance-classes). Start at 20 GiB of SSD storage
  with autoscaling enabled.

```yaml
hub-core:
  api:
    replicaCount: 3
    resources:
      requests:
        cpu: 500m
        memory: 512Mi
      limits:
        cpu: 1
        memory: 1Gi

hub-connector:
  connector:
    resources:
      requests:
        cpu: 100m
        memory: 256Mi
      limits:
        cpu: 1
        memory: 512Mi
```

### Large

For broad fleets and heavy automation traffic.

- **Total resources:** up to 600,000.
- **`hub-core` replicas:** 5, with the [Horizontal Pod
  Autoscaler][autoscaling] enabled to absorb bursts.
- **`hub-core` resources per pod:** requests `cpu: 1`, `memory: 512Mi`. Limits
  `cpu: 2`, `memory: 1Gi`. Observed memory stayed well under the limit at this
  scale, leaving headroom for query concurrency and garbage collection.
- **`hub-connector` resources per pod:** requests `cpu: 100m`, `memory: 256Mi`.
  Limits `cpu: 1`, `memory: 512Mi`. Consider narrowing
  `connector.sync.limitToClusterRoles` to the resources you actually query. Each
  synced type adds an informer that consumes connector memory.
- **Postgres:** 8 vCPU and 32 GiB. See [PostgreSQL
  instance classes](#postgresql-instance-classes). Start at 50 GiB of SSD storage
  with autoscaling enabled. Add a read replica if you observe contention between
  connector writes and UI reads.

```yaml
hub-core:
  api:
    replicaCount: 5
    resources:
      requests:
        cpu: 1
        memory: 512Mi
      limits:
        cpu: 2
        memory: 1Gi
    autoscaling:
      enabled: true
      minReplicas: 5
      maxReplicas: 15
      targetCPUUtilizationPercentage: 70

hub-connector:
  connector:
    resources:
      requests:
        cpu: 100m
        memory: 256Mi
      limits:
        cpu: 1
        memory: 512Mi
```

## PostgreSQL instance classes

Size the [managed PostgreSQL instance][databases] for connection count and burst
CPU during ingest, not for data volume. Start from the row matching your resource
count:

| Total resources | vCPU and RAM | AWS RDS | GCP Cloud SQL | Azure Database for PostgreSQL |
|-----------------|--------------|---------|---------------|-------------------------------|
| Up to 50,000 | 2 vCPU, 8 GiB | `db.m6g.large` | `db-custom-2-8192` | `Standard_D2ds_v5` |
| Up to 200,000 | 2 to 4 vCPU, 16 GiB | `db.m6g.xlarge` | `db-custom-4-16384` | `Standard_D4ds_v5` |
| Up to 600,000 | 8 vCPU, 32 GiB | `db.m6g.2xlarge` | `db-custom-8-32768` | `Standard_D8ds_v5` |

Use the General Purpose tier on Azure. Provider instance names change between
generations, so confirm the current equivalent in your provider's console.

:::warning
Both test points ran on the single 8 vCPU, 32 GiB instance named above, so the two
smaller rows are interpolations rather than tested configurations. Upbound also
didn't profile how saturated that instance was, so a smaller class may well serve
the same workload. Treat every row as a starting point rather than a requirement,
and watch CPU, connection saturation, and cache hit ratio under your own load.
:::

## Pick your tier

Count the resources Hub tracks across every connector: under 50,000 → `small`,
50,000 to 200,000 → `medium`, 200,000 to 600,000 → `large`. Above 600,000, start
at `large` and contact Upbound, because that scale is beyond what Upbound tested.

Whichever tier you land on is a starting point. If you expect many concurrent UI
users or heavy automation traffic, add `hub-core` replicas or enable the
[Horizontal Pod Autoscaler][autoscaling], neither of which changes the memory
values. Roll out to a non-production install first, watch CPU, memory, and
PostgreSQL connection saturation under realistic load, and adjust before promoting
to production.

## Next step

- [Provision your database][databases]. Review the PostgreSQL version, extension,
  and authentication requirements for the instance class you picked.
- [Run Hub with redundancy][high-availability]. Set replica counts, pod
  disruption budgets, and anti-affinity for the tier you picked.
- [Configure autoscaling][autoscaling]. Enable the Horizontal Pod Autoscaler
  for `hub-core` and turn on storage autoscaling on your Postgres tier.

[autoscaling]: /hub/howtos/autoscaling
[databases]: /hub/howtos/databases/overview
[high-availability]: /hub/howtos/high-availability
