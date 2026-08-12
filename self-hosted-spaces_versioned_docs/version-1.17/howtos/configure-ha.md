---
title: Production Scaling and High Availability
description: Configure your Self-Hosted Space for production
sidebar_position: 5
---
<!-- vale write-good.TooWordy = NO -->
<!-- ignore "Minimum" -->

This guide explains how to configure an existing Upbound Space deployment for
production operation at scale.

Use this guide when you're ready to deploy production scaling, high availability,
and monitoring in your Space.


## Prerequisites

Before you begin scaling your Spaces deployment, make sure you have:

<!-- vale gitlab.Uppercase = NO -->
* A working Space deployment
* Cluster administrator access
* An understanding of load patterns and growth in your organization
* A familiarity with node affinity, tainting, and Horizontal Pod Autoscaling
    (HPA)
<!-- vale gitlab.Uppercase = YES -->

## Production scaling strategy
<!-- vale Google.Will = NO -->
<!-- vale gitlab.FutureTense = NO -->
In this guide, you will:
<!-- vale gitlab.FutureTense = YES -->
<!-- vale Google.Will = YES -->

* Create dedicated node pools for different component types
* Configure high-availability to ensure there are no single points of failure
* Set dynamic scaling for variable workloads
* Optimize your storage and component operations
* Monitor your deployment health and performance

## Spaces architecture

The basic Spaces workflow follows the pattern below:


![Spaces workflow][spaces-workflow]

## Node architecture

You can mitigate resource contention and improve reliability by separating system
components into dedicated node pools.

### `etcd` dedicated nodes

`etcd` performance directly impacts your entire Space, so isolate it for
consistent performance.

1. Create a dedicated `etcd` node pool

   **Requirements:**
   - **Minimum**: 3 nodes for HA
   - **Instance type**: General purpose with high network throughput/low latency
   - **Storage**: High performance storage (`etcd` is I/O sensitive)

2. Taint `etcd` nodes to reserve them

   ```bash
   kubectl taint nodes <etcd-node> target=etcd:NoSchedule
   ```

3. Configure `etcd` storage

   `etcd` is sensitive to storage I/O performance. Review the [`etcd` scaling
   documentation][scaling]
   for specific storage guidance.

### API server dedicated nodes

API servers handle all control plane requests and should run on dedicated
infrastructure.

1. Create dedicated API server nodes

   **Requirements:**
   - **Minimum**: 2 nodes for HA
   - **Instance type**: Compute-optimized, memory-optimized, or general-purpose
   - **Scaling**: Scale vertically based on API server load patterns

2. Taint API server nodes

   ```bash
   kubectl taint nodes <api-server-node> target=apiserver:NoSchedule
   ```

### Configure cluster autoscaling

Enable cluster autoscaling for all node pools.

For AWS EKS clusters, Upbound recommends using [`Karpenter`][karpenter] for
improved bin-packing and instance type selection.

For GCP GKE clusters, follow the [GKE autoscaling][gke-autoscaling] guide.

For Azure AKS clusters, follow the [AKS autoscaling][aks-autoscaling] guide.


## Configure high availability

Ensure control plane components can survive node and zone failures.

### Enable high availability mode

1. Configure control planes for high availability

   ```yaml
   controlPlanes:
     ha:
       enabled: true
   ```

   This configures control plane pods to run with multiple replicas and
   associated pod disruption budgets.

### Configure component distribution

1. Set up API server pod distribution

   ```yaml
   controlPlanes:
     vcluster:
       affinity:
         nodeAffinity:
           requiredDuringSchedulingIgnoredDuringExecution:
             nodeSelectorTerms:
               - matchExpressions:
                   - key: target
                     operator: In
                     values:
                       - apiserver
         podAntiAffinity:
           requiredDuringSchedulingIgnoredDuringExecution:
           - labelSelector:
               matchExpressions:
               - key: app
                 operator: In
                 values:
                 - vcluster
             topologyKey: "kubernetes.io/hostname"
           preferredDuringSchedulingIgnoredDuringExecution:
           - podAffinityTerm:
               labelSelector:
                 matchExpressions:
                 - key: app
                   operator: In
                   values:
                   - vcluster
               topologyKey: topology.kubernetes.io/zone
             weight: 100
   ```

2. Configure `etcd` pod distribution

   ```yaml
   controlPlanes:
     etcd:
       affinity:
         nodeAffinity:
           requiredDuringSchedulingIgnoredDuringExecution:
             nodeSelectorTerms:
               - matchExpressions:
                   - key: target
                     operator: In
                     values:
                       - etcd
         podAntiAffinity:
           requiredDuringSchedulingIgnoredDuringExecution:
           - labelSelector:
               matchExpressions:
               - key: app
                 operator: In
                 values:
                 - vcluster-etcd
             topologyKey: "kubernetes.io/hostname"
           preferredDuringSchedulingIgnoredDuringExecution:
           - podAffinityTerm:
               labelSelector:
                 matchExpressions:
                 - key: app
                   operator: In
                   values:
                   - vcluster-etcd
               topologyKey: topology.kubernetes.io/zone
             weight: 100
   ```

### Configure tolerations

Allow control plane pods to schedule on the tainted dedicated nodes (available
in Spaces v1.14+).

1. Add tolerations for `etcd` pods

   ```yaml
   controlPlanes:
     etcd:
       tolerations:
       - key: "target"
         operator: "Equal"
         value: "etcd"
         effect: "NoSchedule"
    ```

2. Add tolerations for API server pods

   ```yaml
   controlPlanes:
     vcluster:
       tolerations:
       - key: "target"
         operator: "Equal"
         value: "apiserver"
         effect: "NoSchedule"
   ```

<!-- vale Google.Headings = NO -->
## Configure autoscaling for Spaces components
<!-- vale Google.Headings = YES -->

Set up the Spaces system components to handle variable load automatically.

### Scale API and `apollo` services

1. Configure minimum replicas for availability

   ```yaml
   api:
     replicaCount: 2

   features:
     alpha:
       apollo:
         enabled: true
         replicaCount: 2
   ```

   Both services support horizontal and vertical scaling based on load patterns.

### Configure router autoscaling

The `spaces-router` is the entry point for all traffic and needs intelligent
scaling.


1. Enable Horizontal Pod Autoscaler

   ```yaml
   router:
     hpa:
       enabled: true
       minReplicas: 2
       maxReplicas: 8
       targetCPUUtilizationPercentage: 80
       targetMemoryUtilizationPercentage: 80
   ```

2. Monitor scaling factors

   **Router scaling behavior:**
   - **Vertical scaling**: Scales based on number of control planes
   - **Horizontal scaling**: Scales based on request volume
   - **Resource monitoring**: Monitor CPU and memory usage



### Configure controller scaling

The `spaces-controller` manages Space-level resources and requires vertical
scaling.

1. Configure adequate resources with headroom

   ```yaml
   controller:
     resources:
       requests:
         cpu: "500m"
         memory: "1Gi"
       limits:
         cpu: "2000m"
         memory: "4Gi"
   ```

   **Important**: The controller can spike when reconciling large numbers of
   control planes, so provide adequate headroom for resource spikes.

## Set up production storage

<!-- vale Google.Headings = NO -->
### Configure Query API database
<!-- vale Google.Headings = YES -->

1. Use a managed PostgreSQL database

   **Recommended services:**
   - [AWS RDS][rds]
   - [Google Cloud SQL][gke-sql]
   - [Azure Database for PostgreSQL][aks-sql]

   **Requirements:**
   - Minimum 400 IOPS performance


## Monitoring

<!-- vale write-good.Weasel = NO -->
<!-- vale Microsoft.Adverbs = NO -->
Monitor key metrics to ensure healthy scaling and identify issues quickly.
<!-- vale Microsoft.Adverbs = YES -->
<!-- vale write-good.Weasel = YES -->

<!-- ### Monitor Router Performance -->

<!-- Track these critical Envoy metrics for the spaces-router: -->

<!-- 1. **Request timeouts** -->
<!--    ``` -->
<!--    envoy_cluster_upstream_rq_timeout -->
<!--    ``` -->
<!--    Counts requests that exceeded configured timeout. Indicates slow or unresponsive services. -->

<!-- 2. **HTTP response codes** -->
<!--    ``` -->
<!--    envoy_cluster_upstream_rq_xx -->
<!--    ``` -->
<!--    Monitor success rates (2xx) and error rates (4xx/5xx). Use to calculate service health ratios and identify failing endpoints. -->

<!-- 3. **Request latency distribution** -->
<!--    ``` -->
<!--    envoy_cluster_upstream_rq_time_bucket -->
<!--    ``` -->
<!--    Provides percentile calculations (p50, p95, p99) for response times. -->

<!-- 4. **Circuit breaker status** -->
<!--    ``` -->
<!--    envoy_cluster_circuit_breakers_default_cx_open -->
<!--    ``` -->
<!--    Values >0 indicate the connection circuit breaker is open. This is specific to watch connections (heavily used by Argo). When >0, Envoy is rejecting new connection attempts. -->

### Control plane health

Track these `spaces-controller` metrics:

1. **Total control planes**

   ```
   spaces_control_plane_exists
   ```

   Tracks the total number of control planes in the system.

2. **Degraded control planes**

   ```
   spaces_control_plane_degraded
   ```

    Returns control planes that don't have a `Synced`, `Ready`, and
    `Healthy` state.

3. **Stuck control planes**

   ```
   spaces_control_plane_stuck
   ```

   Control planes stuck in a provisioning state.

4. **Deletion issues**

   ```
   spaces_control_plane_deletion_stuck
   ```

   Control planes stuck during deletion.

### Alerting

Configure alerts for critical scaling and health metrics:

- **High error rates**: Alert when 4xx/5xx response rates exceed thresholds
- **Control plane health**: Alert when degraded or stuck control planes exceed acceptable counts

## Architecture overview

**Spaces System Components:**

- **`spaces-router`**: Entry point for all endpoints, dynamically builds routes to control plane API servers
- **`spaces-controller`**: Reconciles Space-level resources, serves webhooks, works with `mxp-controller` for provisioning
- **`spaces-api`**: API for managing groups, control planes, shared secrets, and telemetry objects (accessed only through spaces-router)
- **`spaces-apollo`**: Hosts the Query API, connects to PostgreSQL database populated by `apollo-syncer` pods


**Control Plane Components (per control plane):**
- **`mxp-controller`**: Handles provisioning tasks, serves webhooks, installs UXP and `XGQL`
- **`XGQL`**: GraphQL API powering console views
- **`kube-state-metrics`**: Collects usage metrics for billing (updated by `mxp-controller` when CRDs change)
- **`vector`**: Works with `kube-state-metrics` to send usage data to external storage for billing
- **`apollo syncer`**: Syncs `etcd` data into PostgreSQL for the Query API
<!-- vale write-good.TooWordy = YES -->

### `up ctx` workflow

<a href="/img/up-ctx-workflow.png" target="_blank">
  <img src="/img/up-ctx-workflow.png" alt="up ctx workflow diagram" style={{cursor: 'pointer'}} />
</a>

### Access a control plane API server via kubectl

<a href="/img/kubectl-workflow.png" target="_blank">
  <img src="/img/kubectl-workflow.png" alt="kubectl workflow diagram" style={{cursor: 'pointer'}} />
</a>

### Query API/Apollo

<a href="/img/query-api-workflow.png" target="_blank">
  <img src="/img/query-api-workflow.png" alt="query API workflow diagram" style={{cursor: 'pointer'}} />
</a>

## See also

* [Upbound Spaces deployment requirements][deployment]
* [Upbound `etcd` scaling resources][scaling]

[up-ctx-workflow]: /img/up-ctx-workflow.png
[kubectl]: /img/kubectl-workflow.png
[query-api]: /img/query-api-workflow.png
[spaces-workflow]: /img/up-basic-flow.png
[rds]: https://aws.amazon.com/rds/postgresql/
[gke-sql]: https://cloud.google.com/kubernetes-engine/docs/tutorials/stateful-workloads/postgresql
[aks-sql]: https://learn.microsoft.com/en-us/azure/aks/deploy-postgresql-ha?tabs=azuredisk
[deployment]: https://docs.upbound.io/self-hosted-spaces/howtos/deployment-reqs/
[karpenter]: https://docs.aws.amazon.com/eks/latest/best-practices/karpenter.html
[gke-autoscaling]: https://cloud.google.com/kubernetes-engine/docs/how-to/cluster-autoscaler
[aks-autoscaling]: https://learn.microsoft.com/en-us/azure/aks/cluster-autoscaler-overview
[scaling]: https://docs.upbound.io/deploy/self-hosted-spaces/scaling-resources#scaling-etcd-storage
