---
title: External registries
sidebar_position: 3
description: Connect Hub to private or public OCI registries so the catalog can authenticate and enrich the packages your control planes install.
---

Connect Hub to your own OCI registries, such as private Artifactory
instances, public registries, or air-gapped mirrors. This allows Hub to
authenticate to them and index images you declare or observe on connected
control planes into the Catalog.

:::note
External registry connection is an alpha feature. It's
disabled by default, and the APIs may change in incompatible ways between
releases. See the [feature lifecycle](../../../reference/feature-releases.md).
:::

## Concepts

Two resources describe how Hub reaches a registry.

| Resource | What it declares |
| --- | --- |
| `Connection` | How Hub authenticates to a registry: a host, an optional path scope, and credentials. |
| `Repository` | What to index: the full OCI path of a repository, and optionally which `Connection` to use for it. Hub can also [scan](scanning.md) a `Repository` for new and moved tags. |

Both resources belong to a [realm](../../../iam/access-management/overview.md). For example,
credentials declared in one realm are never used to pull for another implicitly.

## How the catalog uses connections

<!-- vale gitlab.SentenceLength = NO -->
When a connected control plane installs a Crossplane package,
Hub records its data in the catalog by pulling
the package's manifest and content layers from the registry.
<!-- vale gitlab.SentenceLength = YES -->

Cataloging is independent of whether the control plane's own image pull
succeeds. A connected control plane uses its own `packagePullSecrets`, whereas
Hub pulls with the set of `Connection` resources that make up the keychain in
the realm.

### The realm keychain

Within a realm, all `Connection` resources form a keychain. When Hub needs to
pull an image, for cataloging or independently verifying a `Connection`, it
selects the `Connection` whose `scope` is the longest prefix of the image path.
One realm can hold multiple credentials for the same host, each scoped to a
different path.

<!-- vale write-good.Passive = NO -->
A `Repository` can opt out of keychain resolution by pinning a single
`Connection` with `spec.connectionRef`. Pin a connection when policy requires
that a repository's credentials can't be resolved via the keychain.
<!-- vale write-good.Passive = YES -->

## Prerequisites

- `kubectl` [configured with a `hub` context](../../../howtos/configure-kubectl.md)
  that targets the Hub. The Console shows connection health, but you declare
  connections through the API.
- A realm for the connection, and admin permissions within that realm.
- The `Registry` feature gate, plus `Catalog` to index what the credentials
  reach. Both default to `false`. See [Feature
  flags](../../../reference/feature-flags.md).

## Connect a registry

Declare a `Connection` naming the host, the credential, and the path prefix the
credential covers:

```yaml title="connection.yaml"
apiVersion: registry.hub.upbound.io/v1alpha1
kind: Connection
metadata:
  name: artifactory-team-a
  namespace: my-realm
spec:
  host: artifactory.corp.example.com
  scope: artifactory.corp.example.com/team-a
  authMethod: Static
  displayName: Artifactory team A
  static:
    username: hub-reader
    password: <access-token>
```

Apply it with the `hub` context:

```bash
kubectl --context=hub apply -f connection.yaml
```

`metadata.namespace` is the realm. `spec.scope` defaults to `spec.host`, so set
it only to narrow a credential to part of a host.

For a registry that needs no credentials, use `Anonymous` and omit
`spec.static`:

```yaml title="connection.yaml"
apiVersion: registry.hub.upbound.io/v1alpha1
kind: Connection
metadata:
  name: upbound-public
  namespace: my-realm
spec:
  host: xpkg.upbound.io
  authMethod: Anonymous
```

Two behaviors are worth knowing before you apply either one:

- Hub redacts the secret fields as `***` on read. Send `***` back on an update
  to keep the stored value, or send a new value to replace it.
- Set `insecure: true` only for a registry that serves the distribution API
  over plain HTTP. Every active connection for the same realm and host must
  agree on it.

## Verify a connection

`verify` is a subresource, so send it as a `POST` with `kubectl create --raw`:

```bash
echo '{"apiVersion":"registry.hub.upbound.io/v1alpha1","kind":"ConnectionVerification","spec":{"testImage":"team-a/provider-aws:v1.18.0"}}' \
  | kubectl --context=hub create --raw \
  "/apis/registry.hub.upbound.io/v1alpha1/namespaces/my-realm/connections/artifactory-team-a/verify" \
  -f -
```

Verify runs in two tiers, and the response reports each one:

| Field | What it reports |
| --- | --- |
| `reachable` | The registry answered the `/v2/` check. |
| `authenticated` | The credential completed the token exchange. An `Anonymous` connection passes when `/v2/` returns `200`. |
| `authorized` | Present only when you send `spec.testImage`. Carries a `result` of `ok`, `forbidden`, `not_found`, or `transient`. |
| `message` | A summary of the outcome. |

Omit `spec.testImage` to check reachability and authentication alone. Send it
to confirm the credential can pull a specific image, which is the tier that
catches a credential that authenticates but lacks read access.

Hub records the outcome on the `Connection` as `status.lastVerifiedAt` and
`status.lastVerificationError`. The Console badge colors read from those
fields.

## Index a repository

A `Connection` supplies credentials, and a `Repository` names what to index:

```yaml title="repository.yaml"
apiVersion: registry.hub.upbound.io/v1alpha1
kind: Repository
metadata:
  name: provider-aws
  namespace: my-realm
spec:
  repository: artifactory.corp.example.com/team-a/provider-aws
```

Hub resolves credentials for it from the realm keychain. Pin a single
connection with `spec.connectionRef` when policy requires it.

Declaring a `Repository` also opts it into periodic scanning for new and moved
tags, once you enable the `RegistryScan` gate. See [Scanning
repositories](scanning.md) for the cadence and the per-pass budgets.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `404` on the registry API group | Enable the `Registry` gate (`hub-core.api.featureFlags.gates.Registry=true`). |
| `401` on Hub API calls | The bearer token expired. Create a fresh one. |
| Verify succeeds but enrichment fails with an auth error | The `Connection` `scope` must be a prefix of the image path, and the `Connection` must be in the same realm as the control plane. |
| Verify tier-2 returns `forbidden` | The credential authenticates but isn't authorized to pull that image. Grant read on the repository. |
| `connection refused` from Hub | The registry host must be reachable from Hub's network. |
| Static auth rejected at create | `authMethod: Static` requires `spec.static` with a username and a secret. `Anonymous` must omit `spec.static`. |

## See also

- [Scanning repositories](scanning.md)
- [Catalog overview](overview.md)
- [Feature flags](../../../reference/feature-flags.md)
