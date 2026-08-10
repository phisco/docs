---
title: Workload identities
sidebar_position: 4
description: Bind Hub roles to machine callers, control-plane ServiceAccounts and OIDC workload identities such as GitHub Actions.
---

:::note[Suggested reading]
Start with the [Access management overview](overview.md). For what a workload
identity is (the username shapes, the claim mappings behind them, and how a
workload gets a Hub token), see [Workload
identities](../identity/workload-identities.md) under Identity.
:::

Machine callers bind to roles the same way people do: as a `User` subject on
an `OrganizationRoleBinding` or `RealmRoleBinding`. Nothing about the binding
changes because the subject happens to be a pipeline. What differs is the
username you put in `subjects[].name`, so the [identity
page](../identity/workload-identities.md) is the prerequisite for this one.

:::warning
Read the workload's username back from Hub with `kubectl auth whoami` rather
than constructing it by hand. See [Verifying your
identity](../identity/verifying-your-identity.md). A subject name that's off
by one character isn't an error. The binding just applies to nobody.
:::

## Bind a control plane ServiceAccount

A ServiceAccount inside a managed control plane reaches Hub under the
`upbound:hub:controlplane:…` username shape described in [Workload
identities](../identity/workload-identities.md#two-kinds). Target it
directly:

```yaml
apiVersion: authorization.hub.upbound.io/v1beta1
kind: RealmRoleBinding
metadata:
  name: my-job-viewer
  namespace: prod
spec:
  roleRef:
    name: realm-viewer
  subjects:
    - kind: User
      name: "upbound:hub:controlplane:acme:prod:system:serviceaccount:apps:my-job"
```

:::note
Special-purpose workloads (connectors and registration agents) get internal
roles automatically when Hub registers the control plane. You don't write
bindings for them.
:::

## Bind an OIDC workload identity

An OIDC workload's username comes from its provider's claim mappings, carrying
that provider's `userInfoPrefix`. With `userInfoPrefix: "github:"` and the
username claim pointed at GitHub's `sub`, a job on the `main` branch of
`acme/infra` is:

```yaml
apiVersion: authorization.hub.upbound.io/v1beta1
kind: RealmRoleBinding
metadata:
  name: infra-pipeline-editor
  namespace: prod
spec:
  roleRef:
    name: realm-editor
  subjects:
    - kind: User
      name: "github:repo:acme/infra:ref:refs/heads/main"
```

The same shape works for any OIDC-issuing platform. Because the subject is just
a string match, how broad or narrow your grant is depends on the claim you
mapped. See [choosing a
claim](../identity/workload-identities.md#two-kinds).

## Scope of these bindings

A `RealmRoleBinding` grants the workload a realm role, which projects into every
control plane in that realm. If a workload needs permissions *inside* a control
plane beyond what the realm role projects, that's control-plane RBAC rather than
a Hub binding. See [Pass Hub identities through to a control
plane](filtering.md#pass-hub-identities-through-to-a-control-plane).

## Related resources

- [Workload identities](../identity/workload-identities.md): username shapes,
  claim mappings, and getting a Hub token.
- [Access management overview](overview.md)
- [Roles reference](roles-reference.md): what each role grants the workload.
- [Filtering and self-review](filtering.md)
