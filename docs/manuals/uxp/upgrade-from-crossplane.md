---
title: Upgrade from Crossplane
sidebar_position: 3
pagination_prev: null
pagination_next: null
---

<!-- vale gitlab.FutureTense = NO -->
Already running Crossplane? In this guide, you'll rehearse an upgrade on a
throwaway cluster: stand up Crossplane with one resource, export its state,
import it into a new Upbound control plane, activate it, and watch it reconcile
in the Upbound hub.
<!-- vale gitlab.FutureTense = YES -->

## Why upgrade to Upbound

Upbound Crossplane (UXP) adds operational features useful for Crossplane
operators. UXP gives you a secrets proxy, backup and restore, and control plane insights.
This tutorial's upgrade path allows you to keep your existing compositions and managed
resources.


## Prerequisites:

Before you begin, make sure you have:

* `kind` (for the disposable "before" cluster)
* `kubectl`
* `helm`
* [up CLI][upCli]
* An Upbound account

## Step 1: Log in to Upbound

```shell
up login
```

## Step 2: Stand up a throwaway Crossplane control plane

The setup script creates a kind cluster, installs Crossplane and the
`provider-nop` provider, creates a single composite resource so
there's something real to migrate.

<details>

    <summary> Crossplane setup script </summary>
    ```shell title="setup-crossplane.sh" manifest="/manifests/getstarted/migration/setup-crossplane.sh"
    ```
</details>

Download and run it:

```shell
curl -fsSL "https://docs.upbound.io/manifests/getstarted/migration/setup-crossplane.sh" -o setup-crossplane.sh
bash setup-crossplane.sh
```

Confirm the composite resource reaches a ready state before you continue:

```shell
kubectl get xapp sample-app
```

## Step 3: Export your control plane's state

Export the source cluster's Crossplane state into a single archive.

:::warning
Point `--kubeconfig` at the throwaway cluster, not whatever context happens to
be active. Exporting the wrong cluster is the first place this goes sideways.
:::

```shell
up controlplane migration export \
  --kubeconfig ~/.kube/config \
  --output crossplane-export.tar.gz
```

The command reports the types it found, the resources it exported, and the
archive it wrote:

```shell
Exporting control plane state...
  Found 4 resource types
  Exported 6 resources
Wrote archive to crossplane-export.tar.gz
```

## Step 4: Create your Upbound control plane

Create the destination control plane and switch your context to it.

```shell
up controlplane create <name>
up ctx "<org>/<space>/<group>/<name>"
```

:::warning
`up ctx` points your active context to the new control plane. Confirm you're
targeting the destination before continuing, so the import lands where you
expect.
:::

## Step 5: Import the archive

```shell
up controlplane migration import --input crossplane-export.tar.gz
```

Imported resources land **paused** by default, so nothing reconciles yet. This
is deliberate: it gives you a chance to review before anything acts on external
infrastructure.

```shell
Importing control plane state...
  Imported 6 resources (paused)
Import complete
```

## Step 6: Review before activating

Spot-check that the imported resources and claims look right:

```shell
kubectl get managed
kubectl get composite
```
<!-- vale Upbound.Spelling = NO -->
:::warning
This step is the highest-stakes moment in the migration. Before you unpause,
confirm you're pointed at the **new** control plane, not the source cluster.
Activating on the wrong cluster leaves two control planes reconciling the same
external resources at once.
:::
<!-- vale Upbound.Spelling = YES -->

## Step 7: Activate

Remove the paused annotation to let the new control plane take over
reconciliation:

```shell
kubectl annotate managed --all crossplane.io/paused-
```

The resources move to a synced and ready state as the new control plane
reconciles them:

```shell
kubectl get managed
```

## Step 8: See it in the Console

Open the [Upbound Console][console], select your new control plane, and find the
migrated `sample-app` resource. 

## Clean up

When you're done with this quickstart, tear down the resources created:

```shell
kind delete cluster --name crossplane-source
```

:::note
Your real source cluster isn't disposable the way this one is. When you migrate
production, decommission the original cluster only after you've confirmed the
new control plane is healthy and reconciling.
:::

## Next steps

- [Migrate a production control plane][migrate] when you're ready for the real
  thing.
- [Hub overview][hub] for the full-fleet story.

[upCli]: /manuals/cli/overview
[console]: https://console.upbound.io
[hub]: /hub/
[migrate]: /manuals/uxp/howtos/upgrade-to-uxp
