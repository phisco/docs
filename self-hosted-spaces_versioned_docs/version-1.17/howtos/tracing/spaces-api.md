---
title: Spaces API Traces
sidebar_position: 20
description: Distributed tracing details for the Spaces API component.
---

The Spaces API is the API server for managing Spaces resources
(ControlPlanes, SharedBackupConfigs, etc.) on the host cluster.

For common tracing configuration, see the
[distributed tracing overview](overview.md).

## Overview

The Spaces API implements distributed tracing using **service.name**:
`spaces-api`

## Custom tags

The API adds custom tags to every span extracted from request headers. These
are in addition to standard span attributes:

| Tag | Source | Description | Example |
|-----|--------|-------------|---------|
| `request.id` | `x-request-id` header | Request correlation ID | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
