---
title: Automation and GitOps Overview
sidebar_label: Overview
sidebar_position: 1
description: Guide to automating control plane deployments with GitOps and Argo CD
plan: "business"
---

Automating control plane deployments with GitOps enables declarative, version-controlled infrastructure management. This section covers integrating GitOps workflows with Upbound control planes using Argo CD and related tools.


## What is GitOps?

GitOps is an approach for managing infrastructure by:
- **Declaratively describing** desired system state in Git
- **Using controllers** to continuously reconcile actual state with desired state
- **Treating Git as the source of truth** for all configuration and deployments

Upbound control planes are fully compatible with GitOps patterns and we strongly recommend integrating GitOps in the platforms you build on Upbound.

## Key Concepts

### Argo CD
[Argo CD](https://argo-cd.readthedocs.io/) is a popular Kubernetes-native GitOps controller. It continuously monitors Git repositories and automatically applies changes to your infrastructure when commits are detected.

### Deployment Models

The way you configure GitOps depends on your deployment model:

| Aspect | Cloud Spaces | Self-Hosted Spaces |
|--------|--------------|-------------------|
| **Access Method** | Upbound API with tokens | Kubernetes native (secrets/kubeconfig) |
| **Configuration** | Kubeconfig via `up` CLI | Control plane connection secrets |
| **Setup Complexity** | More involved (API integration) | Simpler (native Kubernetes) |
| **Typical Use Case** | Managing Upbound resources | Managing workloads on control planes |

## Getting Started

**Choose your path based on your deployment model:**

### Cloud Spaces
If you're using Upbound Cloud Spaces (Dedicated or Managed):
1. Start with [GitOps with Upbound Control Planes](/cloud-spaces/howtos/gitops-on-upbound/)
2. Learn how to integrate Argo CD with Cloud Spaces
3. Manage both control plane infrastructure and Upbound resources declaratively

### Self-Hosted Spaces
If you're running self-hosted Spaces:
1. Start with [GitOps with ArgoCD in Self-Hosted Spaces](../gitops.md)
2. Learn how to configure control plane connection secrets
3. Manage workloads deployed to your control planes

## Common Workflows

### Workflow 1: Managing Control Planes with GitOps
Create and manage control planes themselves declaratively using provider-kubernetes:

```yaml
apiVersion: kubernetes.crossplane.io/v1alpha2
kind: Object
metadata:
  name: my-controlplane
spec:
  forProvider:
    manifest:
      apiVersion: spaces.upbound.io/v1beta1
      kind: ControlPlane
      # ... control plane configuration
```

### Workflow 2: Managing Workloads on Control Planes
Deploy applications and resources to control planes using standard Kubernetes GitOps patterns:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: my-app
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: my-app
# ... deployment configuration
```

### Workflow 3: Managing Upbound Resources
Use provider-upbound to manage Upbound IAM and repository resources:

- Teams
- Robots and their team memberships
- Repositories and permissions

## Advanced Topics

### Argo CD Plugin for Upbound
Learn more in the [ArgoCD Plugin guide](../use-argo.md) for enhanced integration with self-hosted Spaces.

### Declarative Control Plane Creation
See [Declaratively create control planes](../declarative-ctps.md) for advanced automation patterns.

### Consuming Control Plane APIs
Understand how to [consume control plane APIs in your app cluster](../mcp-connector-guide.md) with Argo CD.

## Prerequisites

Before implementing GitOps with control planes, ensure you have:

**For Cloud Spaces:**
- Access to Upbound Cloud Spaces
- `up` CLI installed and configured
- API token with appropriate permissions
- Argo CD or similar GitOps controller running
- Familiarity with Kubernetes RBAC

**For Self-Hosted Spaces:**
- Self-hosted Spaces deployed and running
- Argo CD deployed in your infrastructure
- Kubectl access to the cluster hosting Spaces
- Understanding of control plane architecture

## Next Steps

1. **Choose your deployment model** above
2. **Review the relevant getting started guide**
3. **Set up your GitOps controller** (Argo CD)
4. **Deploy your first automated control plane**
5. **Explore advanced topics** as needed

:::tip
Start with simple deployments to test your GitOps workflow before moving to production. Use [simulations](../simulations.md) to preview changes before applying them.
:::
