---
title: Agent sessions
sidebar_position: 1
description: Ask questions about the resources across your fleet in a chat session backed by the agent API.
draft: true
---

Agent sessions add a conversational surface to Hub. The feature serves the
`agent.hub.upbound.io/v1alpha1` API group, which exposes session and message
endpoints under `/apis/agent.hub.upbound.io/v1alpha1/`. You ask about the
Crossplane resources in your fleet and the agent answers from the state Hub
already indexes.

:::note
Agent sessions is an alpha feature. It's disabled by default, and its API may
change in incompatible ways between releases. See the [feature
lifecycle](../../../reference/feature-releases.md). Set the `AgentSessions` gate in
your Helm values to turn it on. It also needs an Anthropic API key, or
`hub-core` refuses to start. See [Feature
flags](../../../reference/feature-flags.md).
:::

## Concepts

| Resource | What it declares |
| --- | --- |
| `Session` | A conversation. Cluster-scoped, owned by the user who created it. |
| `sessions/messages` | The subresource you post a message to. The reply streams back on the same request. |

A `Session` has one settable field, `spec.title`. Hub assigns the session name
itself, ignoring any name you supply on create. `status.messages` holds the
conversation history and is only populated on a get, not on a list.

## What the agent can see

The agent answers using two read-only tools against Hub's indexed fleet state:

| Tool | What it returns |
| --- | --- |
| `query_resources` | A filtered list of resources across connected control planes, by kind, group, control plane, realm, space, namespace, health, or free-text search. Capped at 100 results per call. |
| `get_resource` | One resource by name, including its full Kubernetes object with `metadata.managedFields` stripped. |

Both read what the connectors report, so the agent can't see a resource a
connector doesn't sync and can't reach a control plane directly. Neither tool
writes. See [Connect a control
plane](../../../howtos/connect-control-plane.md) for what the connector syncs by
default.

## Access

Sessions are private to the user who created them. Every session endpoint scopes
its lookup by the authenticated user's name, so you can't read or delete another
user's session.

:::warning
The agent doesn't scope the resources it reads to the caller. In this release
both agent tools query with an unconstrained view, so any user who can create a
session can ask it about every resource in the hub, including control planes in
realms they can't otherwise view. Upbound plans to release per-session
authorization scoping in a future release.

Access to the feature is the control mechanism today. Organization admins have
`session` and `sessions/messages` resources access by default. Other users have
no access to the feature.

Don't enable this feature if that grant is wider than the fleet visibility you
intend. See [Access and authorization](../../../howtos/rbac.md).
:::

<!-- vale Google.Headings = NO -->
## The Anthropic API dependency
<!-- vale Google.Headings = YES -->

The agent calls the Anthropic API using the `claude-sonnet-4-6` model and doesn't
start without an API key. Plan for both of these:

- Hub needs network egress to the Anthropic API from the `hub-core` namespace.
- Conversation content leaves your cluster. The Anthropic API receives resource
  names, labels, and status messages as part of the conversation.

## Limits

| Limit | Value |
| --- | --- |
| Request body | 1 MB |
| Tool call timeout | 30 seconds |
| Conversation history loaded per session | 500 events |
| Results per `query_resources` call | 100 |

<!-- vale gitlab.FutureTense = NO -->
Because the message stream has no server write deadline, it won't cut off long
replies. The stream ends when the client disconnects, or when the Anthropic API hits
its own timeout.
<!-- vale gitlab.FutureTense = YES -->

## See also

- [Start a troubleshooting session](troubleshooting-session.md)
- [Feature flags](../../../reference/feature-flags.md)
- [Feature lifecycle](../../../reference/feature-releases.md)
