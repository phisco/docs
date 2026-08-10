---
title: Roles reference
sidebar_position: 2
description: The exact permission set each built-in Hub role grants.
---

:::note[Suggested reading]
Start with the [Access management overview](overview.md) for the tenancy model
and the two binding resources. Identity concepts come from the [Identity
overview](../identity/overview.md).
:::

Hub includes four built-in roles: one organization role (`org-admin`) and
three realm roles (`realm-admin`, `realm-editor`, `realm-viewer`). This page
enumerates the permissions each grants. Custom roles aren't supported.

The tables below group resources by the tier the resource lives on. Columns
are the same in each: one organization role and the three realm roles.

Cells use four values:

| Cell | Meaning |
| --- | --- |
| **RW** | Read and write: `get`, `list`, `create`, `update`, `delete` |
| **R** | Read only: `get`, `list` |
| *Filtered* | Allowed, but only over the rows the caller can see. [`SelfSubjectAccessReview`](filtering.md) returns the exact predicate. |
| — | No access from this role. Access may still flow from another role or from the control plane's own RBAC. |

A `RealmRoleBinding` scopes its realm role to one realm, and the role
applies only there. A subject with `realm-admin` in `prod-east` has no
permissions in `prod-west`.

## Organization-scoped resources

Cluster-scoped resources that model the organization shell.

| Resource | `org-admin` | `realm-admin` | `realm-editor` | `realm-viewer` |
|----------|-------------|---------------|----------------|----------------|
| `realms` | **RW** | *Filtered*+write owned | *Filtered* | *Filtered* |
| `namespaces` (realm façade) | **R** | *Filtered* | *Filtered* | *Filtered* |
| `identityproviders` | **RW** | — | — | — |
| `users` | **R** | — | — | — |
| `groups` | **R** | — | — | — |
| `organizationrolebindings` | **RW** | — | — | — |
| `spaces` | **RW** | **R** [^basicuser] | **R** [^basicuser] | **R** [^basicuser] |
| `spaces/registrationtoken` | `create` | — | — | — |
| `lenses` | *Filtered* | *Filtered* | *Filtered* | *Filtered* |

[^basicuser]: Read access to `spaces` comes from the built-in
    `system:basic-user` role, which every authenticated principal holds,
    not from the realm role.

Lenses are global and carry no realm scoping. Every principal, `org-admin`
included, gets the same shared-or-owner filter: you see lenses you own plus
lenses shared with the organization.

## Realm-scoped resources

Namespaced by realm, or filtered by the realms and control planes the
caller can see.

| Resource | `org-admin` | `realm-admin` | `realm-editor` | `realm-viewer` |
|----------|-------------|---------------|----------------|----------------|
| `realmrolebindings` | **RW** | **RW** | — | — |
| `controlplanes` | — | **RW** | **RW** | **R** |
| `controlplanes/registrationtoken` | — | `create` | `create` | — |
| `resources` | — | *Filtered* | *Filtered* | *Filtered* |
| `resources/events` | — | *Filtered* | *Filtered* | *Filtered* |
| `resourcestats` | — | *Filtered* | *Filtered* | *Filtered* |
| `resourcerelationships` | — | *Filtered* | *Filtered* | *Filtered* |
| `resourcerelationshiptrees` | — | *Filtered* | *Filtered* | *Filtered* |
| `typedefinitions` | — | *Filtered* | *Filtered* | *Filtered* |
| `typedefinitions/distribution` | — | *Filtered* | *Filtered* | *Filtered* |
| `crossplanepackages` | — | *Filtered* [^packages] | *Filtered* [^packages] | *Filtered* [^packages] |
| `crossplanepackages/distribution` | — | *Filtered* [^packages] | *Filtered* [^packages] | *Filtered* [^packages] |
| `queries` (metrics) | — | *Filtered* | *Filtered* | *Filtered* |

[^packages]: A package is visible only through the Provider, Configuration,
    Function, or AddOn resource that installs it. Hub computes its control
    plane and version counts over the installs you can already see, so two
    callers can get different counts for the same package.

For a `realm-admin`, *Filtered* on the resource-aggregation rows means "every
row in the caller's realm." For `realm-editor` and `realm-viewer` it also
narrows to what the control plane grants, per the next table.

`resourcestats` and metrics `queries` are POST-as-read
endpoints: the query arrives in the request body, so authorization is on
the `create` verb even though the operation only reads.

## Resource reads inside a control plane

The rows above say which realms and control planes you can reach.
This table says how much of a reached control plane's contents you see.
`realm-editor` and `realm-viewer` project into an aggregation ClusterRole;
whatever verbs that ClusterRole grants is what the role can perform on
resources synced from that control plane.

| | `org-admin` | `realm-admin` | `realm-editor` | `realm-viewer` |
|---|-------------|---------------|----------------|----------------|
| Reads scoped to | — | Everything synced [^adminbound] | `crossplane-edit` and `controlplane-edit` | `crossplane-view` and `controlplane-view` |

[^adminbound]: Unlike the other two roles, `realm-admin` isn't scoped by an
    aggregation ClusterRole. It reads every resource the `hub-connector`
    synced, so the connector's sync scope is the bound. That's
    `--limit-to-cluster-roles` (set through
    `connector.sync.limitToClusterRoles`), defaulting to `crossplane-admin`
    on every control plane regardless of type. In demo mode the chart
    substitutes `cluster-admin`. See [the connector-side sync
    bound](overview.md#the-connector-side-sync-bound).

`org-admin` gets nothing here. It's an organization-tier role and doesn't
cascade into any realm. Bind a realm role to reach control plane contents.

One row, because the mapping doesn't vary by control-plane type. Hub passes
both names and takes whichever the control plane has. [What a realm role gets
inside a control
plane](overview.md#what-a-realm-role-gets-inside-a-control-plane) covers that,
along with how the aggregation labels widen it and why per-control-plane RBAC
only ever adds.

## Grants every principal holds

Independent of any role binding, every authenticated principal may:

- `create` `selfsubjectreviews`: see [`kubectl auth
  whoami`](../identity/verifying-your-identity.md).
- `create` `selfsubjectaccessreviews`: check what the caller can do.
- Read the discovery, docs and OpenAPI endpoints.

## Related resources

- [Access management overview](overview.md)
- [Filtering and self-review](filtering.md): how Hub computes `realm-editor`
  / `realm-viewer` visibility inside a control plane.
- [Workload identities](workload-identities.md)
