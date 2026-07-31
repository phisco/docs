---
title: Hub
slug: /
sidebar_position: 0
description: Hub is the central cluster in an Upbound Platform deployment, where the platform's central components install.
---

Hub is the central cluster in an Upbound Platform deployment. Hub is where the
Upbound products that operate over your fleet install, and it provides the
authentication, storage, and APIs those products build on. Connect your Spaces,
Crossplane, or generic Kubernetes clusters to Hub, and the state they report
becomes the data those products work with - starting with Insights, which
indexes and queries resources across the whole fleet.

## Operating a fleet of control planes

Each Crossplane control plane answers questions only about itself. Comparing
provider versions, finding recent Composition changes, or checking claim health
across a fleet means querying one cluster's context at a time. Most teams cover
the gap with scripts and dashboards they maintain themselves.

Hub closes that gap by collecting resource state from every control plane you
connect into one place. Each connected cluster reports what it's running, and Hub
keeps a continuously updated picture of the whole fleet. The Upbound products
running on Hub read from that picture, so a question about your fleet gets one
answer from one place instead of one answer per cluster.

## What you can do with Hub

* **Manage a fleet of Crossplane control planes.** Register new control planes,
  deregister ones you no longer want to see, and keep a single inventory across
  teams, regions, and clouds.

* **Query resources across all connected control planes at once.** Sort, filter,
  and search spanning every cluster Hub has connected, from a single query
  instead of one per cluster.

* **Roll resources up into aggregate statistics.** Group them by health, by
  labels and annotations, or by creation and deletion timestamps. Ask "how many
  claims are Ready across the fleet right now?" without writing a query per
  cluster.

* **Track those statistics over time.** Hub keeps time-series state for the same
  aggregations, so resource counts, health, and turnover show up as trends
  instead of point-in-time snapshots.

* **See every type defined across the fleet, and where it varies.** Hub indexes
  the CRDs and XRDs installed in every control plane, so you can compare the
  same type across clusters and spot the one running an older schema or a
  locally patched spec.

* **Track installed Crossplane packages across the fleet.** Hub lists every
  Provider, Configuration, and Function alongside the version each control plane
  runs, so you can spot version drift.
