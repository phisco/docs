---
title: Scaling vCluster and etcd Resources
weight: 950
description: A guide for scaling vCluster and etcd resources in self-hosted Spaces
aliases:
    - /all-spaces/self-hosted-spaces/scaling-resources
    - /spaces/scaling-resources
---

In large workloads or control plane migration, you may performance impacting
resource constraints. This guide explains how to scale vCluster and `etcd`
resources for optimal performance in your self-hosted Space.


## Signs of resource constraints

You may need to scale your vCluster or `etcd` resources if you observe:

- API server timeout errors such as `http: Handler timeout`
- Error messages about `too many requests` and requests to `try again later`
- Operations like provider installation failing with errors like `cannot apply provider package secret`
- vCluster pods experiencing continuous restarts
- API performance degrades with high resource volume

<!-- vale Google.Headings = NO -->
## Scaling vCluster resources
<!-- vale Google.Headings = YES -->

The vCluster component handles Kubernetes API requests for your control planes. 
Deployments with multiple control planes or providers may exceed default resource allocations.

```yaml
# Default settings
controlPlanes.vcluster.resources.limits.cpu: "3000m"
controlPlanes.vcluster.resources.limits.memory: "3960Mi"
controlPlanes.vcluster.resources.requests.cpu: "170m"
controlPlanes.vcluster.resources.requests.memory: "1320Mi"
```

For larger workloads, like migrating from an existing control plane with several
providers, increase these resource limits in your Spaces `values.yaml` file.

```yaml
controlPlanes:
  vcluster:
    resources:
      limits:
        cpu: "4000m"      # Increase to 4 cores
        memory: "6Gi"     # Increase to 6GB memory
      requests:
        cpu: "500m"       # Increase baseline CPU request
        memory: "2Gi"     # Increase baseline memory request
```

## Scaling `etcd` storage

Kubernetes relies on `etcd` performance, which can lead to IOPS (input/output
operations per second) bottlenecks. Upbound allocates `50Gi` volumes for `etcd`
in cloud environments to ensure adequate IOPS performance.

```yaml
# Default setting
controlPlanes.etcd.persistence.size: "5Gi"
```

For production environments or when migrating large control planes, increase
`etcd` volume size and specify an appropriate storage class:

```yaml
controlPlanes:
  etcd:
    persistence:
      size: "50Gi"                 # Recommended for production
      storageClassName: "fast-ssd" # Use a high-performance storage class
```

### Storage class considerations

For AWS:
- Use GP3 volumes with adequate IOPS
- For AWS GP3 volumes, IOPS scale with volume size (3000 IOPS baseline)
- For optimal performance, provision at least 32Gi to support up to 16,000 IOPS

For GCP and Azure:
- Use SSD-based persistent disk types for optimal performance
- Consider premium storage options for high-throughput workloads

## Scaling Crossplane resources

Crossplane manages provider resources in your control planes. You may need to increase provider resources for larger deployments:

```yaml
# Default settings
controlPlanes.uxp.resourcesCrossplane.requests.cpu: "370m"
controlPlanes.uxp.resourcesCrossplane.requests.memory: "400Mi"
```

<!-- vale write-good.Weasel = NO -->
For environments with many providers or managed resources:
<!-- vale write-good.Weasel = YES -->

```yaml
controlPlanes:
  uxp:
    resourcesCrossplane:
      limits:
        cpu: "1000m"      # Add CPU limit
        memory: "1Gi"     # Add memory limit
      requests:
        cpu: "500m"       # Increase CPU request
        memory: "512Mi"   # Increase memory request
```

## High availability configuration

For production environments, enable High Availability mode to ensure resilience:

```yaml
controlPlanes:
  ha:
    enabled: true
```

## Best practices for migration scenarios

When migrating from existing control planes into a self-hosted Space:

1. **Pre-scale resources**: Scale up resources before performing the migration
2. **Monitor resource usage**: Watch resource consumption during and after migration with `kubectl top pods`
3. **Scale incrementally**: If issues persist, increase resources incrementally until performance stabilizes
4. **Consider storage performance**: `etcd` is sensitive to storage I/O performance

## Helm values configuration

Apply these settings through your Spaces Helm values file:

```yaml
controlPlanes:
  vcluster:
    resources:
      limits:
        cpu: "4000m"
        memory: "6Gi"
      requests:
        cpu: "500m"
        memory: "2Gi"
  etcd:
    persistence:
      size: "50Gi"
      storageClassName: "gp3" # Use your cloud provider's fast storage class
  uxp:
    resourcesCrossplane:
      limits:
        cpu: "1000m" 
        memory: "1Gi"
      requests:
        cpu: "500m"
        memory: "512Mi"
  ha:
    enabled: true  # For production environments
```

Apply the configuration using Helm:

```bash
helm upgrade --install spaces oci://xpkg.upbound.io/spaces-artifacts/spaces \
  -f values.yaml \
  -n upbound-system
```

## Considerations
<!-- vale Upbound.Spelling = NO -->
- **Provider count**: Each provider adds resource overhead - consider using provider families to optimize resource usage
- **Managed resources**: The number of managed resources impacts CPU usage more than memory
- **Vertical pod autoscaling**: Consider using vertical pod autoscaling in Kubernetes to automatically adjust resources based on usage
- **Storage performance**: Storage performance is as important as capacity for etcd
- **Network latency**: Low-latency connections between components improve performance
<!-- vale Upbound.Spelling = YES -->

