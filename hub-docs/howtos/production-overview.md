---
title: Production hardening
sidebar_position: 10
description: Sizing, high availability, autoscaling, RBAC, and upgrades for production Hub.
---

You have a working self-hosted Hub. This section covers how to configure it with
the necessary scaling and security configuration for production traffic.

The pages in this section aren't a linear install path. They're independent
topics you apply on top of the [self-hosted install][install].
Work through them in any order, but treat the five hardening topics as required
reading before Hub serves production traffic, then set up observability to watch
the result.

## Sizing

Pick replica counts, resource requests, and a Postgres tier that match your
workload before you turn on redundancy or autoscaling. Both depend on a sensible
baseline. Your connector count, the resources tracked per
connector, and the query rate against `hub-core` drive sizing. The sizing page defines small,
medium, and large tiers with concrete numbers for each and a short decision tree
for picking a starting tier. See [Sizing][sizing].

## High availability

Once you have a tier, run `hub-core` and `hub-webui` with more than one replica
and spread them across nodes with anti-affinity. Bound voluntary disruptions
with a PodDisruptionBudget. The HA page walks the Helm values for each
(replicas, PDBs, topology spread) and verifies that a node drain no longer takes
the UI offline. See [High availability][high-availability].

## Autoscaling
<!-- vale write-good.Weasel = NO -->
Static replica counts cover steady-state load. Traffic can vary: daily
peaks, ad-hoc query bursts, or growth that outruns your sizing tier. For that, enable the
HorizontalPodAutoscaler for `hub-core` so Pod count tracks CPU. See
[Autoscaling][autoscaling].
<!-- vale write-good.Weasel = YES -->

## RBAC

The demo bootstraps an organization-level admin binding for a Keycloak group,
which lets you log in immediately. For production, retarget that binding at a
group from your real OIDC provider and add ControlPlane-scoped bindings for the
rest of your users. The RBAC page documents Hub's role model alongside the
mechanics of reading group claims from an OIDC token. It also has the YAML for binding
those groups to organization-level and ControlPlane-level roles. See
[RBAC][rbac].

## Upgrades

Hub bundles `hub-core`, `hub-connector`, and `hub-webui` in a single chart on
one release train, and schema migrations run automatically as part of `helm
upgrade`.That means upgrades are quick to perform and carry real risk if you get
them wrong. Migrations are forward-only, so a chart rollback doesn't undo a
schema change. 

The upgrades page covers how to read release notes, stage
upgrades in a non-production install, run the upgrade, and the boundary on
rollbacks. See [Upgrades][upgrades].

## Observability

<!-- vale write-good.Passive = NO -->
<!-- vale gitlab.Uppercase = NO -->
Once you've hardened hub and it serves traffic, watch its health. On
`hub-core:8085`, hub emits framework metrics (HTTP RED and Go runtime) alongside
its own ingest and query instruments. The observability page catalogs those
metrics. It also covers a turnkey dashboards chart for viewing them and how to
export them to your own monitoring backend. See [Observability][observability].
<!-- vale gitlab.Uppercase = YES -->
<!-- vale write-good.Passive = YES -->

## Next step

Start with [Sizing][sizing]. The other four hardening topics reference the tier
it produces.

[autoscaling]: /hub/howtos/autoscaling
[high-availability]: /hub/howtos/high-availability
[install]: /hub/howtos/install
[observability]: /hub/howtos/observability
[rbac]: /hub/howtos/rbac
[sizing]: /hub/howtos/sizing
[upgrades]: /hub/howtos/upgrades
