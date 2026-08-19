---
title: Welcome
sidebar_position: 1
slug: "/"
pagination_prev: null
pagination_next: null
---
import CardGrid from '@site/src/components/CardGrid';
import GetUpboundHero from '@site/src/components/GetUpboundHero';

<GetUpboundHero />

<!-- vale gitlab.SentenceLength = NO -->
Welcome to Upbound, the intelligent control plane platform for Crossplane that helps you build
autonomous infrastructure platforms at scale. Whether you're already using Open
Source Crossplane or exploring control planes for the first time, Upbound
provides the tools and services to take your infrastructure automation to the
next level.

<!-- vale Google.We = NO -->
Upbound allows you to expose infrastructure across clouds, vendors, and systems
through a single programmable API surface that works for humans and intelligent
agents alike. Upbound Insights provide a unified fleet-wide API the shared front
end Console for the platform. Upbound powers this with **Upbound Crossplane 2.0
(UXP)**, the enterprise-grade control plane that delivers reliability,
performance, and developer experience.
<!-- vale Microsoft.HeadingPunctuation = NO -->

## Download the CLI
<!-- vale Google.WordList = NO -->
Install the [up][up] CLI to get Upbound's tooling on your machine.

```shell
curl -sL "https://cli.upbound.io" | sh
```

Find more installation methods on the [Up CLI installation guide][up].
<!-- vale Google.WordList = YES -->

## Choose your path

<CardGrid sections={[
  {
    title: 'New to Upbound?',
    description: 'Follow the introduction guide to build your first control plane from scratch.',
    link: '/getstarted/quickstart/install-the-hub'
  },
  {
    title: 'Upgrade existing Crossplane to UXP',
    description: 'Follow the upgrade guide to migrate your existing Crossplane install to Upbound Crossplane.',
    link: 'manuals/uxp/upgrade-qs/'
  }
]} />

<!-- vale Microsoft.Contractions = NO -->
## What is Upbound?
<!-- vale Microsoft.Contractions = YES -->
<!-- vale Microsoft.HeadingPunctuation = YES -->

Upbound is the platform that helps platform engineers automate and build their
platforms.

The power of the Upbound platform is the **control plane**. A control plane is
software that controls other software by exposing custom APIs for your
infrastructure to automatically maintain your desired state. Upbound's control
plane framework lets you manage infrastructure and resources across clouds and
services.

**The value of control planes is building your own custom APIs to provision the
resources your users need.**

The control plane constantly monitors your cloud resources to meet the state you
define in your custom APIs. You define your resources and Upbound parses,
connects with the service, and manages the lifecycle on your behalf.


<!-- vale gitlab.SentenceLength = YES -->
[up]: /manuals/cli/overview
