---
title: "Design the platform"
sidebar_position: 10
description: "A guide to designing the parts of your platform powered by Upbound"
---

<!-- vale write-good.TooWordy = NO -->
<!-- vale Google.Will = NO -->
<!-- vale Google.We = NO -->
<!-- vale gitlab.FutureTense = NO -->
To get started on your journey designing an IDP on Upbound, zoom out and think
about the big picture of what you want to accomplish. 

## Parts of a platform

At a high level, all platforms on Upbound are usually composed of the following parts:

- **Interfaces.** Your platform will offer one or more modes to interact with it. A common interface is a GUI, such as a web app. 
- **Your platform's API.** You will define what APIs your platform offers and is responsible for managing. These APIs represent resource types offered on your platform, and they range from things like a Bucket abstraction to a complex multi-cloud serverless experience. The power is in your hands and the sky's the limit. 
- **Your control planes.** These form the core of your platform and they're responsible for handling the resource requests made to your API. 
- **Connectivity to underlying services.** The next generation of the cloud use platforms that provide streamlined experiences on top of existing infrastructure and cloud services, such as AWS, Azure, GitHub, VMWare, and more.

Here's a visual depiction of the high-level shape of a platform powered by Upbound:

![platformParts][platformParts]

## Chart your journey

<!-- vale write-good.Passive = NO -->
Most cloud services follow the same pattern: a managed experience that abstracts
a resource and handles its lifecycle. GCP's Kubernetes Engine and BigQuery both
work this way. Upbound is designed around the same idea. You define what your
platform offers, and Upbound handles the lifecycle management behind it. Your
IDP builds on top of existing cloud infrastructure, so you can focus on the your
business needs.
<!-- vale write-good.Passive = YES -->

### Examples of common offerings

In Upbound, an offering maps to a group of one or more composite resource APIs built with Crossplane. Some common offerings customers build are:

- AI Platforms
- Databases and Storage
- Networking
- API management
- Compute (virtual machines, serverless, and more)

<!-- vale write-good.Passive = NO -->
Because Upbound control planes are built on Crossplane, you can build beyond
these offerings. Any Crossplane provider or Kubernetes Custom Resource can serve
as the foundation for a new composite resource API.
<!-- vale write-good.Passive = YES -->

## Prioritizing your first use cases


Upbound recommends prioritizing a subset of the total offerings you want to
provide. Pick one or two offerings, or use any of the available [Configurations from Upbound][configurations]. 

<!-- vale Google.Will = YES -->
<!-- vale gitlab.FutureTense = YES -->
<!-- vale Google.We = YES -->
<!-- vale write-good.TooWordy = YES -->
[configurations]: https://marketplace.upbound.io/configurations

[platformParts]: /img/solutions/platform-on-upbound.png
