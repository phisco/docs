---
title: Managed Upbound control planes
description: "Learn about the managed service capabilities of a Space"
sidebar_position: 10
---

Control planes in Upbound are fully isolated [Upbound Crossplane][uxp] instances
that Upbound manages for you. This means:

- the underlying lifecycle of infrastructure (compute, memory, and storage) required to power your instance.
- scaling of the infrastructure.
- the maintenance of the core Upbound Crossplane components that make up a control plane.

This lets users focus on building their APIs and operating their control planes,
while Upbound handles the rest. Each control plane has its own dedicated API
server connecting users to their control plane.

## Learn about Upbound control planes

Read the [concept][ctp-concept] documentation to learn about Upbound control planes.

[uxp]: /manuals/uxp/overview
[ctp-concept]: /self-hosted-spaces/concepts/control-planes