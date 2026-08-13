---
title: Scanning repositories
sidebar_position: 4
description: Have Hub watch an external OCI repository for new and moved tags, and index what it finds into the catalog.
---

Scanning tells Hub to watch a repository in an external registry and index
what it finds. Without it, the catalog only holds the images your control
planes already install. With it, Hub discovers releases you haven't deployed
yet and notices when a tag moves to a different image.

:::note
Repository scanning is an alpha feature. It's disabled by default, and the
APIs may change in incompatible ways between releases. See the [feature
lifecycle](../../../reference/feature-releases.md).
:::

## Prerequisites

- A `Connection` that can pull from the registry. See [External
  registries](external-registry.md) for how Hub authenticates.
- A realm for the `Repository`, and admin permissions within that realm.
- `kubectl` [configured with a `hub` context](../../../howtos/configure-kubectl.md)
  that targets the Hub. The Console shows registry connection health, but you
  declare repositories through the API.
- The `Catalog`, `Registry`, and `RegistryScan` feature gates. All three default
  to `false`.

```yaml title="values.yaml"
hub-core:
  api:
    featureFlags:
      gates:
        Catalog: true
        Registry: true
        RegistryScan: true
```

`RegistryScan` is separate from `Registry` so you can turn scanning off on its
own, without taking the registry API down.

The gate covers tag discovery and re-checking, not every request Hub makes to a
registry. Hub still pulls the manifest and layers of each image your control
planes install, and the `verify` subresource still probes a `Connection` on
request. If you set `RegistryScan` to false, Hub stops querying the registry for
other existing tags, but maintains connection to the registry.


## Turning on scanning

Declare a `Repository` naming the OCI path you want Hub to watch:

```yaml title="repository.yaml"
apiVersion: registry.hub.upbound.io/v1alpha1
kind: Repository
metadata:
  name: provider-aws
  namespace: my-realm
spec:
  repository: xpkg.upbound.io/upbound/provider-aws
```

Apply it with the `hub` context:

```bash
kubectl --context=hub apply -f repository.yaml
```

Creating the `Repositry` opts it into scanning. Once you create the
`Repository`, Hub scans it every hour from then on even if you remove the
entire `spec.scan` field path. You can create a `Repository` resource without
scanning by setting `spec.scan.suspend` to `true`.

## What a scan does

Each pass over a repository:

1. Lists the tags in the repository.
2. Drops the tags matching the exclusion patterns.
3. Records the remaining tag names in Hub's tag mirror, without digests yet.
4. Resolves digests for tags it hasn't resolved before, up to `maxTagsPerScan`.
5. Re-resolves the tags that have come due for confirmation, up to
   `maxRechecksPerScan`.
6. Hands newly discovered images to the catalog for indexing.

Hub records the tag names before it resolves any digests, so a large repository
becomes queryable on its first pass instead of waiting on every digest. Digests
then fill in over later passes, bounded by the two budgets above.

A tag points at one image per repository. When a publisher pushes a new release
and `latest` moves to it, Hub takes `latest` off the image that used to hold it
and attaches it to the new one. Searching the catalog for `latest` returns the
image the tag names today, not every image that has ever carried it.

## Tuning the scan

Every field under `spec.scan` is optional:

| Field | Default | What it controls |
| --- | --- | --- |
| `interval` | `1h` | How often Hub scans the repository. |
| `suspend` | `false` | Pauses scanning without deleting the `Repository`. |
| `maxTagsPerScan` | `100` | How many newly discovered tags Hub resolves per pass. Bounds the first scan of a large repository. |
| `maxRechecksPerScan` | `20` | How many already-known tags Hub re-checks per pass. |
| `maxRecheckInterval` | `24h` | The longest Hub waits before re-checking a tag. |
| `exclusionList` | Signatures and pre-releases | Regular expressions for tags to skip. |

Durations must resolve to whole seconds.

The spec separates `maxRechecksPerScan` and `maxTagsPerScan` by design. With
separate budgets, a large backlog of undiscovered tags can't crowd out
re-checks, and a large backlog of re-checks can't crowd out new discovery. 

Both budgets must be greater than zero.

## How often Hub re-checks a tag

OCI has no immutable tags. A registry can move any tag to a different image,
including a tag on a released version, so Hub re-checks every tag rather than
trusting its name.

Instead, Hub sets each tag's recheck frequency based on how often it actually changes:

- A tag observed to move is re-checked on every scan.
- A tag that keeps coming back unchanged is re-checked half as often each
  time, up to `maxRecheckInterval`.
- A tag that moves after a quiet stretch resets to the fastest cadence.

This keeps a repository holding thousands of released versions affordable
without ever declaring one of them immune to change.

A tag's name only sets its starting point. A fully version-shaped tag such as
`v1.2.3` starts at the slowest cadence, and anything else, such as `latest` or
`18`, starts one scan interval out. Once Hub sees a tag move, the observed
behavior takes over and the name stops mattering.

### Re-checking everything on every pass

If you control the registry and want Hub to confirm mutable tags on every
pass, set `maxRecheckInterval` equal to `interval` and raise
`maxRechecksPerScan` to cover the repository:

```yaml title="repository.yaml"
apiVersion: registry.hub.upbound.io/v1alpha1
kind: Repository
metadata:
  name: service
  namespace: my-realm
spec:
  repository: registry.example.com/team/service
  scan:
    interval: 1h
    maxRecheckInterval: 1h
    maxRechecksPerScan: 10000
```

Every tag then comes due on every pass. Setting `maxRecheckInterval` below
`interval` has no additional effect, because Hub can't confirm a tag more
often than it scans the repository.

## Excluding tags

`exclusionList` holds Go regular expressions. Hub skips any tag matching one of
them outright, and never mirrors, resolves, or indexes it.

When you omit the field, Hub skips cosign signatures, attestations, and SBOM
artifacts, along with pre-release semantic versions such as `1.2.3-rc.1`.
Setting the field replaces those defaults rather than adding to them. An empty
list excludes nothing, which indexes signature and attestation tags too. Hub
indexes them rather than skipping them, because a cosign artifact is a normal
OCI image manifest: it lands in the catalog carrying only the metadata from its
OCI config, with none of the package metadata a Crossplane package has. The
exclusion list is what keeps them out, so leave the defaults in place unless
you want those entries.

Exclusions apply on every pass, not only to tags Hub hasn't seen. Each pass
reconciles the mirror against the tags it accepted, so adding a pattern drops
the tags it matches from the mirror on the next scan.

:::note
Excluding a pre-release tag decides whether Hub indexes it at all. That's
independent of how often Hub re-checks a tag it has accepted, which comes from
[observed churn](#how-often-hub-re-checks-a-tag) rather than the tag's name.
:::

## Checking scan status

The `Repository` status reports the outcome of the most recent pass:

| Field | What it reports |
| --- | --- |
| `lastScanTime` | When the most recent attempt finished, whether it succeeded or failed. |
| `lastSuccessTime` | When Hub last completed a full successful scan. |
| `lastScanError` | The most recent failure. Empty after a successful pass. |
| `tagCount` | How many tags Hub currently mirrors for the repository. |

The `Ready` condition carries one of these reasons:

| Reason | Meaning |
| --- | --- |
| `ScanSucceeded` | The pass completed and the tag mirror is current. |
| `ScanFailed` | The scan didn't complete. See `lastScanError`. |
| `AuthFailed` | The registry rejected the credentials. |
| `RegistryUnreachable` | Hub couldn't reach the registry. |
| `IngestEnqueuePartial` | Hub listed the tags but couldn't hand every new image on for cataloging. The tags are accurate, and the missing images appear in the catalog later. |

## Automatically created repositories

When a control plane installs a package, Hub records the repository it came
from as provenance. Those `Repository` resources arrive suspended, so
observing an install never starts scanning an upstream registry on its own.

To start scanning one of them, clear `spec.scan.suspend` on the existing
resource:

```bash
kubectl --context=hub -n my-realm edit repositories.registry.hub.upbound.io provider-aws
```

Declaring a new `Repository` for a path Hub already tracks returns a conflict,
so edit the resource that's there.

### Why the pinned connection can't change

Every field under `spec.scan` is editable, but `spec.connectionRef` isn't. An
update has to submit the same value the resource already carries. 

This rules out:
- Pinning a repository that started unpinned 
- Aiming a pinned one at a different `Connection` 
- removing an existing pin. 

Each scenario above returns:

```text
spec.connectionRef is immutable; it cannot be changed on update
(delete and recreate the Repository to repoint it)
```

Hub compares what you sent against what it stored, so applying a manifest that
omits `connectionRef` to a repository that has one reads as an attempt to
remove the pin, and fails even when you meant to change something else. Keep
the existing `connectionRef` in the manifest, or edit the live resource with
`kubectl edit`, which round-trips the field for you.

To aim a repository at a different `Connection`, delete it and recreate it with
the new reference. Deleting discards the mirrored tags for that repository, and
the next scan rebuilds them. Images already in the catalog stay where they are.

Most repositories don't need a pin at all. Without one, Hub resolves credentials
from the realm keychain, picking whichever `Connection` covers the repository
path, so a rotated or replaced credential needs no change to the `Repository`.
Pin one only when policy requires a specific credential.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `404` on the registry API group | Enable the `Registry` gate (`hub-core.api.featureFlags.gates.Registry=true`). |
| The `Repository` exists but never scans | Check that the `RegistryScan` gate is on and `spec.scan.suspend` is `false`. Hub creates provenance repositories suspended. |
| A moved tag takes too long to appear | Lower `maxRecheckInterval`, or raise `maxRechecksPerScan` if the repository has more tags than the per-pass budget covers. |
| A first scan indexes only some tags | Expected. `maxTagsPerScan` bounds each pass, and later passes pick up the rest. Raise it to backfill faster. |
| `Ready` reports `AuthFailed` | The `Connection` `scope` must be a prefix of the repository path, and the `Connection` must be in the same realm. |
| Signature or SBOM tags in the catalog | An explicitly set `exclusionList` replaces the defaults. Restore the default patterns or remove the field. |
| Creating a `Repository` returns a conflict | Hub already tracks that path. Update the existing resource instead. |

## See also

- [External registries](external-registry.md)
- [Catalog overview](overview.md)
- [Feature flags](../../../reference/feature-flags.md)
