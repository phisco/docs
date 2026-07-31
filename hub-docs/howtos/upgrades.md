---
title: Upgrades
sidebar_position: 15
description: Upgrade Hub and understand schema migrations and rollbacks.
---

Upgrading a running Hub installation to a newer chart version applies schema
migrations, which constrain how far you can roll back.

## How releases work

<!-- vale Microsoft.Adverbs = NO -->
<!-- vale write-good.Passive = NO -->
Hub releases as a single train. The `hub` umbrella chart pins matching versions
of all three binaries (`hub-core`, `hub-connector`, and `hub-webui`), and they
are released together at the same chart version. You can install and manage each subchart
separately, see the feature compatibility document to understand
compatibility guarantees between versions.
<!-- vale Microsoft.Adverbs = YES -->

Schema migrations are applied automatically as part of every chart upgrade. The
chart runs the embedded migration tool in a dedicated Job, registered as a Helm
`pre-upgrade` hook. Helm blocks on that Job until it succeeds before rolling
out any new `hub-core` Pods. A single Job applies the schema change once,
rather than every replica racing it during a rolling update. Only after the
migration Job succeeds does Helm proceed to roll the new `hub-core` Pods.

Migrations are **forward-only**. The migration tool has no down-migrations. Once
a newer chart version has run its migrations against your database, the schema
reflects the newer version. There's no automated path back to the previous
schema.

## Plan an upgrade

Before running `helm upgrade`, work through the following:

1. **Read the release notes.** Each release publishes notes alongside the chart.
   Check them for breaking changes, required values updates, deprecations, and
   any per-upgrade migration warnings.
2. **Check your current chart version.** Run `helm list -n hub` and confirm the
   version currently installed against the version you intend to install. If you
   are skipping multiple versions, read the notes for every intermediate
   release. Migrations from each are applied in order, and a step you skip may
   include a breaking values change you need to honor.
3. **Diff your values.** If you keep your `values.yaml` in source control,
   compare it against the new chart's defaults. Run `helm show values
   oci://xpkg.upbound.io/upbound/hub --version <new-version>` to see the new
   defaults and check for renamed or removed keys.
4. **Stage the upgrade.** Run the upgrade against a non-production installation
   first, ideally one that mirrors your production values and points at a copy
   of your production schema. Confirm the migration completes, the new Pods come
   up, and your existing connectors continue to register.
5. **Back up Postgres.** Take a fresh backup of the Hub database immediately
   before the upgrade. Migrations are forward-only. If you need to revert to an
   older chart, you may need the backup to restore the previous schema. Use your
   database provider's native snapshot facility, such as an RDS snapshot.
6. **Plan the maintenance window.** `helm upgrade` blocks on the migration Job
   before it rolls any new `hub-core` Pods. Your existing Pods keep serving while
   the migration runs. The window depends on the size of the migration; small
   upgrades typically take seconds, but a migration that rewrites a large table
   can take longer. Notify any clients of `hub-core` of the expected window.

:::warning
Database migrations can't be reversed automatically. Always take a backup of
the Hub database before upgrading.
:::

## Upgrade procedure

The upgrade is a standard `helm upgrade` against the `hub` chart.

1. Run the upgrade with your existing values file:

    ```bash
    helm upgrade hub oci://xpkg.upbound.io/upbound/hub \
      --version <new-version> \
      --namespace hub \
      --values values.yaml
    ```

    Replace `<new-version>` with the chart version you are installing and
    `values.yaml` with the path to the values file you used for the original
    install.

2. Watch the rollout:

    ```bash
    kubectl -n hub rollout status deployment/hub-core
    kubectl -n hub rollout status deployment/hub-webui
    ```

    Because the migration runs as a `pre-upgrade` hook, `helm upgrade` blocks on
    the migration Job before it touches the Deployments, so the migration has
    already finished by the time these commands report. To follow the migration
    while `helm upgrade` is still running, tail the Job from another terminal:

    ```bash
    kubectl -n hub logs -l app.kubernetes.io/component=api-migrate -c sql-migrate --follow
    ```

3. Roll the connectors. Each `hub-connector` install is a separate Helm release
   in its host control plane. Upgrade each one to the same chart version using
   the same `helm upgrade` shape with its own values file.

4. Verify:

    - The migration Job completed successfully and the `hub-core` Pods are
      `Ready`.
    - The Hub UI loads and you can authenticate.
    - Each `hub-connector` reconnects and continues reporting ControlPlane
      state.

## Roll back

Helm supports rolling the chart back with `helm rollback`, but Hub's database
migrations are forward-only and Helm has no awareness of the schema. A naive
rollback can leave your installation with an older binary running against a
newer schema.

Before running `helm rollback`, check the release notes for the version range
you are crossing. Two cases:

- **The release notes state the target version is schema-compatible with the
  schema currently in your database.** This scenario is the common case for minor or
  patch rollbacks where no migration ran, or where the migrations between the
  two versions are additive only. In this case `helm rollback` is safe:

    ```bash
    helm rollback hub <previous-revision> --namespace hub
    ```

    Find `<previous-revision>` with `helm history hub -n hub`.

- **The release notes state the target version isn't schema-compatible with the
  current schema.** A `helm rollback` alone doesn't work. You need to restore
  the database to a backup taken before the offending upgrade, then run `helm
  rollback` to align the chart. Plan for downtime; treat this as a database
  restore operation, not a Helm operation.

If the release notes don't state compatibility explicitly, assume the rollback
is unsafe and contact support before proceeding.

:::warning
`helm rollback` doesn't reverse database migrations. Rolling the chart back
without verifying schema compatibility can leave `hub-core` unable to start. It can
also run with subtly inconsistent behavior against a schema it doesn't
understand.
:::

## Next step

- [Production overview][production-overview]. The rest of the production hardening
  checklist.
<!-- vale write-good.Passive = YES -->

[production-overview]: /hub/howtos/production-overview
