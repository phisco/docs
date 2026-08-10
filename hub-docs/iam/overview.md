---
title: Identity and access management (IAM)
description: How Upbound IAM defines identity and access across every product and control plane.
---

Upbound Identity and Access Management (IAM) is the core component of the
Upbound Platform. It manages identity and access for the platform and every
product built on it, and you enable it through Upbound Connect. IAM defines a
single tenancy model that spans every control plane in an organization. Its
role-based access control (RBAC) extends down to individual Kubernetes
resources on every connected control plane.

[Identity][identityOverview] answers who is using the system. You register
your own OIDC provider, and Identity resolves every caller into a global,
unified username and set of groups:

- Humans working in the Console or CLI
- Machine identities running CI jobs and automation
- Workloads running inside the control planes

The model doesn't change based on how a caller authenticates.

[Access management][accessOverview] answers what a caller can do. You bind
roles at the organization or realm scope, and those roles carry into every
connected control plane, resolving into Kubernetes RBAC on the resources
themselves. Access granted once applies consistently everywhere the request
lands.

[identityOverview]: identity/overview.md
[accessOverview]: access-management/overview.md
