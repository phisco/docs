---
title: Self-Hosted Spaces
sidebar_position: 0
---

Upbound Spaces is the platform for running managed Crossplane control planes at
scale. Spaces handles the lifecycle, networking, and operations of your control
planes so you can focus on building your platform.

Crossplane is the open-source foundation that enables infrastructure 
provisioning and management through Kubernetes APIs. The Crossplane control
plane is a Kubernetes cluster running Crossplane that can provision and manage
resources across multiple providers.

Upbound can run as a hosted service in our Cloud Space or you can host your own
Upbound instance as a Self-Hosted Space.

## Cloud Spaces

Upbound hosts and manages the Spaces infrastructure for you. Cloud Spaces offers
two forms of tenancy:

- **Cloud Spaces**: Multi-tenant, Upbound-hosted and Upbound-managed environment.
- **Dedicated Spaces**: Single-tenant, Upbound-hosted and Upbound-managed
  environment with additional isolation guarantees.

Use Cloud Spaces if you want a fully managed SaaS experience with no cluster to
maintain. See the [Cloud Spaces documentation](/cloud-spaces/overview/).

## Self-Hosted Spaces (you are here)

You run the Spaces software on your own Kubernetes cluster. You deploy and manage Spaces on your own cluster.

Use Self-Hosted Spaces if you need control over your infrastructure or data
residency.

## Get Started with Self-Hosted Spaces

- **[Concepts](/self-hosted-spaces/concepts/control-planes/)** — Core concepts for Spaces
- **[How-To Guides](/self-hosted-spaces/howtos/auto-upgrade/)** — Step-by-step guides for operating Spaces
- **[API Reference](/self-hosted-spaces/reference/)** — API specifications and resources
