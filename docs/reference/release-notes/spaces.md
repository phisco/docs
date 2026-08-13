---
title: Spaces Release Notes
description: Release notes for the Spaces
---

<!-- vale off -->

<!-- Release notes template/Copy&Paste
## vX.Y.Z

### Release Date: YYYY-MM-DD

#### Breaking Changes

:::important
Any important warnings or necessary information
:::

#### What's Changed

- User-facing changes

-->

## v1.18.0

### Release Date: 2026-08-xx

#### Important Changes

- New control planes are created on Kubernetes 1.36. Existing control planes keep
  their current version and are not changed by this upgrade.

#### Deprecations

- **Query API (Apollo) is deprecated.** The Query API
  (`query.spaces.upbound.io`), backed by Apollo, is deprecated as of Spaces 1.18
  and will be removed in a future release. It remains an alpha feature gated by
  `features.alpha.apollo.enabled` (off by default).

#### Features

- Added support for Crossplane (UXP) 2.3. The Rapid channel now moves to 2.3 and
  Stable to 2.2.
- Added `networkPolicies.enabled` (default `true`) to the Spaces chart, which
  installs or removes every NetworkPolicy Spaces ships. Some NetworkPolicy
  selectors now use minimal identifying labels.

#### What's Changed

- Control plane images updated (VCluster, CoreDNS, etcd, external-secrets-operator).
- Resolved CVEs in `opentelemetry-collector-spaces` and `hyperspace` images.
- Bumped Apollo (Query API) to v0.4.20:
  - Adds functionality to automatically reload Root CAs when they change.
- Bumped the Spaces Router Envoy image to distroless-v1.38.3.
- Re-enabled the vCluster syncer liveness probe so a control plane that fails to
  come up after a restart is restarted automatically. It is on by default and
  configurable via `controlPlanes.vcluster.probes.livenessProbe.enabled`.
- Added configurable resources for the following components:
  - Spaces internal charts pod:
    - Helm value: `controlPlanes.container.mxpCharts.resources`
  - Control Plane etcd defrag job:
    - Helm value: `controlPlanes.etcd.defrag.resources`
  - Control Planes mxp-controller pod init container
    - Helm value: `controlPlanes.mxpController.apisInitResources`
  - Spaces Controller init containers:
    - Helm value: `controller.mxeInit.resources`
    - Helm value: `controller.webhookInit.resources`
  - Spaces Chart pre-upgrade job:
    - Helm value: `controller.preUpgradeHook.resources`
- The default limit range for a control plane now supports configuring
  the memory limit via `controlPlanes.policies.limitRange.default.memory`.
- Adjusted Spaces Router `RoleBinding` creation to match enabled features.

#### Bug Fixes

- Fixed a bug that could cause Helm releases to be uninstalled during retry.
- Fixed `space.labels` so labels are now set on all pods managed by Spaces.

## v1.17.2

### Release Date: 2026-08-05

#### What's Changed

- Control plane images updated (VCluster, CoreDNS, etcd, external-secrets-operator).
- Bumped Apollo (Query API) to v0.4.20.
- Bumped supported Crossplane versions to latest patches.
- Resolved CVEs in `opentelemetry-collector-spaces` and `hyperspace` images.

## v1.17.1

### Release Date: 2026-07-09

:::info
**Up CLI:** The `up space mirror` command in up CLI was updated with new images for this Spaces version. Use up CLI v0.49.0 or later.
:::

#### What's Changed

- Control plane images updated (VCluster, CoreDNS, etcd, external-secrets-operator).
- Resolved CVEs in `opentelemetry-collector-spaces` and `hyperspace` images.
- Bumped Apollo (Query API) to v0.4.15:
  - Adds functionality to automatically reload Root CAs when they change.
  - Removed a `RoleBinding` that is no longer required.
- Bumped the Spaces Router Envoy image to distroless-v1.38.3.
- Added configurable resources for the following components:
  - Spaces internal charts pod:
    - Helm value: `controlPlanes.container.mxpCharts.resources`
  - Control Plane etcd defrag job:
    - Helm value: `controlPlanes.etcd.defrag.resources`
  - Control Planes mxp-controller pod init container
    - Helm value: `controlPlanes.mxpController.apisInitResources`
  - Spaces Controller init containers:
    - Helm value: `controller.mxeInit.resources`
    - Helm value: `controller.webhookInit.resources`
  - Spaces Chart pre-upgrade job:
    - Helm value: `controller.preUpgradeHook.resources`
- The default limit range for a control plane now supports configuring
  the memory limit via `controlPlanes.policies.limitRange.default.memory`.
- Adjusted Spaces Router `RoleBinding` creation to match enabled features.

#### Bug Fixes

- Fixed an issue that could cause Helm releases to be uninstalled/reinstalled on Spaces upgrades.

## v1.17.0

### Release Date: 2026-05-18

:::info
**Up CLI:** The `up space mirror` command in up CLI was updated with new images for this Spaces version. Use up CLI v0.48.2 or later.
:::

#### Important Changes

- New control planes now default to UXP v2. If you create a ControlPlane and
  do not set spec.crossplane.version, Spaces picks the latest stable v2 release
  and uses the Stable channel for future auto-upgrades.

  What stays the same: Control planes that are already on UXP v1 remain on v1.
  Release channels do not move you across major versions—v1 control planes only
  get v1 updates, and v2 control planes only get v2 updates.

  If you need v1 for a new control plane: Set spec.crossplane.version to a
  supported v1 release from your environment’s allowed list (full version
  string, e.g. 1.20.5-up.1).

  See the Upbound Knowledge Base article
  [New control planes default to UXP v2][kb-uxp-v2-default]
  for what to do in each scenario.

- We have retired UXP 1.18.x from Spaces and new control planes targeting 1.18.x
  will be rejected. Any existing 1.18 control plane will continue to run
  but will be marked as unsupported. Control Planes should be upgraded to
  1.19.x.

<!-- markdownlint-disable-next-line MD013 -->
[kb-uxp-v2-default]: https://help.upbound.io/articles/2836516227-new-control-planes-in-upbound-spaces-now-default-to-uxp-v2?lang=en#what-you-need-to-do

#### Features

- Added support for UXP 2.2.x
- Added affinity and tolerations support for mxp-controller, UXP crossplane
  core, UXP RBAC manager, and UXP controller-manager. In Spaces Helm values,
  configure scheduling under `controlPlanes.mxpController`,
  `controlPlanes.crossplane`, `controlPlanes.rbacManager`, and
  `controlPlanes.v2.controllerManager` when `controlPlanes.v2.enabled` is true
  for UXP v2. Each block supports standard pod `affinity` and `tolerations`
  fields — for example:

  ```yaml
  controlPlanes:
    mxpController:
      affinity: {}
      tolerations: []
    crossplane:
      affinity: {}
      tolerations: []
    rbacManager:
      affinity: {}
      tolerations: []
    v2:
      enabled: true
      controllerManager:
        affinity: {}
        tolerations: []
  ```

  Replace `{}` and `[]` with your `nodeAffinity`, `tolerations`, and related
  scheduling rules.
- Added validation for UXP version upgrades: Spaces enforces moving
  minor-by-minor through supported releases (version skips are rejected), and
  requires UXP 1.20 before upgrading a control plane to UXP 2.0.
- Spaces controller Vertical Pod Autoscaler: you can
  enable a `VerticalPodAutoscaler` for the Spaces controller when the
  [Kubernetes Vertical Pod Autoscaler][vpa] is installed on the host cluster.
  Set
  `controller.controller.verticalPodAutoscaler.enabled` to `true` and optional
  `controller.controller.verticalPodAutoscaler.updateMode` (defaults to
  `Auto`). The VerticalPodAutoscaler only adjusts memory for the Spaces
  controller right now. See [Spaces Helm reference][spaces-helm] for more
  configuration options.

<!-- markdownlint-disable-next-line MD013 -->
[vpa]: https://github.com/kubernetes/autoscaler/tree/master/vertical-pod-autoscaler
[spaces-helm]: /reference/spaces-helm-reference/

#### Bug Fixes

- Pausing and resuming now works correctly for UXP v2 control planes.

#### Other Changes

- Bumped control plane Kubernetes version to v1.32.13
- Control plane images updated (VCluster, CoreDNS, etcd,
  external-secrets-operator).
- Updated the Spaces Router Envoy image.
- Kube-state-metrics and Vector are not installed unless legacy loop-based
  billing is enabled (`billing.enabled`); on upgrade, existing deployments are
  uninstalled under the same condition.
- Bumped Apollo (Query API) to v0.4.12
- XGQL is fully removed from control planes and no longer required for connected
  Spaces.
- Upgraded OTEL Collector images to v0.152.0.

## v1.16.3

### Release Date: 2026-08-05

#### What's Changed

- Control plane images updated (VCluster, CoreDNS, etcd, external-secrets-operator).
- Bumped Apollo (Query API) to v0.4.20.
- Bumped supported Crossplane versions to latest patches.
- Resolved CVEs in `opentelemetry-collector-spaces` and `hyperspace` images.

## v1.16.2

### Release Date: 2026-07-08

:::info
**Up CLI:** The `up space mirror` command in up CLI was updated with new images for this Spaces version. Use up CLI v0.49.0 or later.
:::

#### What's Changed

- Control plane images updated (VCluster, CoreDNS, etcd, external-secrets-operator).
- Resolved CVEs in `opentelemetry-collector-spaces` and `hyperspace` images.
- Bumped Apollo (Query API) to v0.4.14:
  - Adds functionality to automatically reload Root CAs when they change.
- Bumped the Spaces Router Envoy image to distroless-v1.38.3.

#### Bug Fixes

- Fixed an issue that could cause Helm releases to be uninstalled/reinstalled on Spaces upgrades.

## v1.16.1

### Release Date: 2026-05-22

:::info
**Up CLI:** The `up space mirror` command in up CLI was updated with new images for this Spaces version. Use up CLI v0.48.3 or later.
:::

#### Important Changes

- Upgrade the OpenTelemetry Operator to v0.139.0 or later before you upgrade
  Spaces. This release updates OpenTelemetry dependencies in the
  `opentelemetry-collector-spaces` image, which require that operator version.

#### What's Changed

- Bumped control plane Kubernetes version to v1.31.14
- Control plane images updated (VCluster, CoreDNS, etcd, external-secrets-operator).
- Updated the Spaces Router Envoy image and mxp-charts.
- Kube-state-metrics and Vector are not installed unless legacy loop-based
  billing is enabled (`billing.enabled`); on upgrade, existing deployments are
  uninstalled under the same condition.
- XGQL is disabled by default and is no longer required to connect a Space
  (`controlPlanes.uxp.xgql.enabled`).
- Resolved CVEs in `opentelemetry-collector-spaces` and `hyperspace` images.
- Bumped Apollo (Query API) to v0.4.12

#### Bug Fixes

- Pausing and resuming now works correctly for UXP v2 control planes.

## v1.16.0

### Release Date: 2026-03-13

:::info
**Up CLI:** The `up space mirror` command in up CLI was updated with new images for this Spaces version. Use up CLI v0.45.0 or later.
:::

#### Breaking Changes

:::important

- **Ingress is no longer provisioned by default.** The Ingress resource is now
  controller-agnostic. All ingress-nginx specific annotations, labels, and the
  hardcoded `ingressClassName: nginx` have been removed. To keep existing
  ingress-nginx working, add the following to your spaces Helm values:

  ```yaml
  ingress:
    provision: true
    host: proxy.example.com  # Replace with your existing hostname
    ingressClassName: nginx
    annotations:
      nginx.ingress.kubernetes.io/ssl-passthrough: "true"
      nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
    podLabels:
      app.kubernetes.io/name: ingress-nginx
      app.kubernetes.io/component: controller
    namespaceLabels:
      kubernetes.io/metadata.name: ingress-nginx
  ```

  For other controllers, set `ingress.provision: true`,
  `ingress.ingressClassName: "<your-class>"`, and add controller-specific
  `ingress.annotations`, `ingress.podLabels`, and `ingress.namespaceLabels` as
  needed. ingress-nginx is deprecated upstream (EOL March 2026). See the
  [ingress-nginx migration guide](/self-hosted-spaces/howtos/ingress-nginx-migration/)
  for details. Recommended alternatives: LoadBalancer Service (simplest),
  Gateway API, or any Ingress controller with TLS passthrough support.

- **LogCollector tolerations:** Tolerations for the LogCollector daemonset have been
  moved from `observability.collectors.tolerations` to
  `observability.collectors.logCollector.tolerations`. Update your Helm values if
  you use custom tolerations for the LogCollector.

:::

#### Important Changes

- Spaces Apollo (Query API) was updated to v0.4.7 with stability fixes for ensuring
  data is properly synced.
- Control plane images updated (XGQL, VCluster, CoreDNS, etcd, kube-state-metrics).

#### Features

- **Spaces Router via LoadBalancer:** You can expose the Spaces Router directly
  with a LoadBalancer Service, without an ingress controller or gateway.
  Use `externalTLS.host` for the externally routable hostname for TLS.
- **Ingress and Gateway API together:** Run both at once for zero-downtime
  migration from ingress-nginx. See the [migration
  guide](/self-hosted-spaces/howtos/ingress-nginx-migration/).
- **Observability:**
  - Added support for `prometheus.io/path` annotation in the control plane telemetry
    collector (custom metrics paths with fallback to `/metrics`).
  - Added support for `observability.spacesCollector.env` for injecting environment variables
    into the Spaces OpenTelemetry Collector pods.
  - Added support for the OTEL Filter Processor in SharedTelemetryConfigs to drop
    metrics, logs, or traces.
  - [Tracing can be enabled in Apollo](/self-hosted-spaces/howtos/tracing/query-api/).
  - [Spaces API is now instrumented with tracing](/self-hosted-spaces/howtos/tracing/spaces-api/).
  - Resources for the LogCollector daemonset are configurable via
    `observability.collectors.logCollector.resources`.
  - Added support for the Splunk HEC exporter in SharedTelemetryConfigs.
- **Certificate automation:** Services reload the Spaces CA automatically; leaf
  certificates renew when the Spaces CA is renewed. The `spaces-ca-bundle`
  includes both old and new CAs for seamless rotation. For zero downtime with
  webhooks during CA renewal, use cert-manager v1.19+ or enable the
  CAInjectorMerging feature flag in cert-manager 1.17+.
- **UXP v2 is now enabled by default.** Users can create UXP v2 ControlPlanes
  without additional configuration. This can be disabled by explicitly setting
  `controlPlanes.uxp.v2.enabled` to `false` if needed.
- Controllers are automatically upgraded when a ControllerRuntimeConfig is updated.
- Added `gatewayAPI.gateway.namespace` Helm value to support referencing a Gateway
  in a different namespace via `parentRefs`.

#### Bug Fixes

- SharedTelemetry now properly cleans up its `status.provisioned`,
  `status.failed`, and `status.selected` after a control plane is deleted.
- ProviderConfig, ProviderConfigUsage, and ClusterProviderConfig are no longer
  counted as Managed Resources by the UXP metering controller.

#### Other Changes

- Default resource requests added to `external-secrets-operator` Deployments.
- Spaces Apollo image registry updated to `xpkg.upbound.io/spaces-artifacts`.

## v1.15.6

### Release Date: 2026-08-05

#### What's Changed

- Control plane images updated (VCluster, CoreDNS, etcd, external-secrets-operator).
- Bumped Apollo (Query API) to v0.4.20.
- Bumped supported Crossplane versions to latest patches.
- Resolved CVEs in `opentelemetry-collector-spaces` and `hyperspace` images.

## v1.15.5

### Release Date: 2026-07-07

:::info
**Up CLI:** The `up space mirror` command in up CLI was updated with new images for this Spaces version. Use up CLI v0.49.0 or later.
:::

#### What's Changed

- Control plane images updated (VCluster, CoreDNS, etcd, external-secrets-operator).
- Resolved CVEs in `opentelemetry-collector-spaces` and `hyperspace` images.
- Bumped Apollo (Query API) to v0.4.14:
  - Adds functionality to automatically reload Root CAs when they change.
- Bumped the Spaces Router Envoy image to distroless-v1.38.3.

#### Bug Fixes

- Fixed an issue that could cause Helm releases to be uninstalled/reinstalled on Spaces upgrades.

## v1.15.4

### Release Date: 2026-05-22

:::info
**Up CLI:** The `up space mirror` command in up CLI was updated with new images for this Spaces version. Use up CLI v0.48.3 or later.
:::

#### Important Changes

- Upgrade the OpenTelemetry Operator to v0.139.0 or later before you upgrade
  Spaces. This release updates OpenTelemetry dependencies in the
  `opentelemetry-collector-spaces` image, which require that operator version.

#### What's Changed

- Bumped control plane Kubernetes version to v1.31.14
- Control plane images updated (VCluster, CoreDNS, etcd, external-secrets-operator).
- Updated the Spaces Router Envoy image and mxp-charts.
- Kube-state-metrics and Vector are not installed unless legacy loop-based
  billing is enabled (`billing.enabled`); on upgrade, existing deployments are
  uninstalled under the same condition.
- XGQL is disabled by default and is no longer required to connect a Space
  (`controlPlanes.uxp.xgql.enabled`).
- Resolved CVEs in `opentelemetry-collector-spaces` and `hyperspace` images.
- Bumped Apollo (Query API) to v0.4.12

#### Bug Fixes

- Pausing and resuming now works correctly for UXP v2 control planes.

## v1.15.3

### Release Date: 2026-3-16

:::info
**Up CLI:** The `up space mirror` command in up CLI was updated with new images for this Spaces version. Use up CLI v0.45.0 or later.
:::

#### What's Changed

- Control plane images updated (XGQL, VCluster, CoreDNS, etcd, kube-state-metrics).

## v1.15.2

### Release Date: 2026-1-16

#### What's Changed

- Added observability.spacesCollector.env field to support injecting environment variables into the Spaces OpenTelemetry Collector pods.
- Fix: SharedTelemetry now properly cleans up its status.provisioned/failed/selected after a control plane is deleted.

## v1.15.1

### Release Date: 2025-11-18

#### Breaking Changes

:::important
Upgrading from 1.14 to 1.15 moves Apollo into its own Helm subchart and ships an
Apollo schema that isn't compatible with 1.14. You must move your Apollo values
and drop the Apollo schema tables before you upgrade. Follow the
[Upgrade to Spaces 1.15 guide](/self-hosted-spaces/1.15/howtos/upgrade-to-1.15/)
before you run `helm upgrade`.
:::

#### Important Changes

- **UXP v2 is now enabled by default.** Users can create UXP v2 ControlPlanes without additional configuration. This can be disabled by explicitly setting `controlPlanes.uxp.v2.enabled` to `false` if needed.
- **Query API v1alpha1 has been removed.** The query API has been updated with breaking changes including removal of v1alpha1 and Freshness support. Database user permissions required for apollo have changed; please see the [documentation](/self-hosted-spaces/howtos/query-api/) for details.
- UXP v2 [AddOns](https://docs.upbound.io/manuals/uxp/concepts/add-ons/) are disabled by default. They can be enabled via `controlPlanes.uxp.enableAddons`.
- VCluster has been upgraded from v0.24.1 to v0.24.2 to support Kubernetes 1.33.
- Bumped supported cert-manager version to v1.18.2.

#### Features

- **Spaces Metering:** Added a new metering collector with PostgreSQL storage for measurements and aggregations. This enables tracking of control plane resource usage over time.
- **Enhanced Observability**, see [docs](/self-hosted-spaces/howtos/space-observability/) for details:
  - Added Envoy metrics for spaces-router to improve observability.
  - Added distributed tracing support to spaces-router for space-level observability.
- Allow disabling default ManagedResourceActivationPolicy for UXP v2 control planes, `controlPlanes.uxp.disableDefaultManagedResourceActivationPolicy: True` through the Spaces helm chart values.
- Scale down functions too for paused control planes, `spec.crossplane.state: Paused`.

#### Bug Fixes

- Fixed a bug where SharedTelemetry collector could only collect telemetry from Crossplane and provider pods due to network policies. Now it can collect from all pods in the control plane.
- Reactively reconcile legacy connection Secrets and ingress-ca ConfigMap upon root CA changes.
- Added default resource requests to external-secrets-operator deployments.

## v1.14.7

### Release Date: 2026-05-22

:::info
**Up CLI:** The `up space mirror` command in up CLI was updated with new images for this Spaces version. Use up CLI v0.48.3 or later.
:::

#### What's Changed

- Control plane images updated (VCluster, etcd, external-secrets-operator).
- Resolved CVEs in `hyperspace` and `mxp-charts` images.
- Bumped control plane Kubernetes version to v1.31.14

## v1.14.6

### Release Date: 2026-05-04

:::info
**Up CLI:** The `up space mirror` command in up CLI was updated with new images for this Spaces version. Use up CLI v0.48.1 or later.
:::

#### Important Changes

- Upgrade the OpenTelemetry Operator to v0.139.0 or later before you upgrade
  Spaces. This release updates OpenTelemetry dependencies in the
  `opentelemetry-collector-spaces` image, which require that operator version.

#### What's Changed

- Control plane images updated (VCluster, CoreDNS, etcd, external-secrets-operator).
- Updated the Spaces Router Envoy image and mxp-charts.
- Kube-state-metrics and Vector are not installed unless legacy loop-based
  billing is enabled (`billing.enabled`); on upgrade, existing deployments are
  uninstalled under the same condition.
- XGQL is disabled by default and is no longer required to connect a Space
  (`controlPlanes.uxp.xgql.enabled`).
- Resolved CVEs in `opentelemetry-collector-spaces` and `hyperspace` images.

## v1.14.4

### Release Date: 2026-03-16

:::info
**Up CLI:** The `up space mirror` command in up CLI was updated with new images for this Spaces version. Use up CLI v0.45.0 or later.
:::

#### What's Changed

- Control plane images updated (XGQL, VCluster, CoreDNS, etcd, kube-state-metrics).

## v1.14.3

### Release Date: 2026-01-20

#### What's Changed

- Added observability.spacesCollector.env field to support injecting environment variables into the Spaces OpenTelemetry Collector pods.
- Fix: SharedTelemetry now properly cleans up its status.provisioned/failed/selected after a control plane is deleted.

## v1.14.2

### Release Date: 2026-11-24

#### What's Changed

- Bump vcluster from 0.24.1 to 0.24.2 to support k8s 1.33.

## v1.14.1

### Release Date: 2025-09-24

#### Important Changes

- Reactively reconcile legacy connection Secrets and ingress-ca ConfigMap upon root ca changes.

## v1.14.0

### Release Date: 2025-09-16

#### Breaking Changes

- The deprecated alpha InControlPlaneOverride API has been completely removed. Any existing InControlPlaneOverride resources will no longer be processed, and the API is no longer available. Users relying on this functionality should migrate to alternative configuration management approaches before upgrading.

#### Important Changes

- Enable SharedSecrets by default.
- SharedBackups are now GA and can't be disabled anymore.
- SharedTelemetry is GA. It's still disabled by default, as it requires careful configuration from administrators.
- SpaceBackups are now enabled by default.
- Disabled realtime compositions by default, set `controlPlanes.uxp.disableRealtimeCompositions=false` to enable it.
- External Secrets Operator (ESO) was bumped to v0.17.0-up.1.

#### VCluster Changes

Control Plane vCluster memory limits are now unset. In v1.12 release, we bumped the vCluster version and that caused the 3 vcluster system pods (syncer, api-server, and controller) to merge into just one pod. Previously, we used to not memory limit the api-server and use the autoscaler to manage its memory requests. With 1.12, as all the vCluster components were running in 1 pod, 1 container, we limited the memory and had the autoscaler also manage the memory limits, based on the number of CRDs in the control plane.

In the meantime, we noticed that if there is a sudden surge of CRDs, the vCluster pod can run out of memory(including the api-server) before the autoscaler can react to the rise of CRDs, thus making it unable to get the CRD number and autoscale.

This is why we are now unsetting the vCluster memory limits and will monitor further vCluster improvements.

#### Features

- Added configuration options for setting tolerations on vcluster and vcluster etcd pods.
- Audit logs from the ControlPlane API servers can now be enabled using the new `spec.apiServer.audit.enabled` API in the SharedTelemetryConfig objects. The collected audit logs are available from the ControlPlane OTEL log service named "controlplane-audit".
- Emit events for SpaceBackups.
- SpaceBackups will now wait for ControlPlanes to be ready and healthy, but try backing them up even if they are not instead of failing directly.
- Allow setting spaces-controller hostnetwork to true, to improve compatibility with CNI plugins such as Cilium.
- Restore ImageConfigs too before restoring packages (Providers, Functions...).
- Try requeuing control planes on SpaceBackups and SharedBackups and make failure rate configurable through `spec.failures.controlplanes` on all backup resources.

#### Bug Fixes

- Allow setting CNPG cluster's resources requests and limits, added sane default requests. Also adding the ability to switch to dedicated PVC for WAL files, disabled by default.
- Fixed a bug where the last Subject listed in an ObjectRoleBinding would be the only one with bound permissions.
- Fixed mxp-controller crashes on Crossplane versions < v1.16.4 by implementing conditional ImageConfig CRD watching based on version compatibility.
- Allow SharedTelemetry to scrape all vcluster managed pods.

## v1.13.6

### Release Date: 2026-3-16

:::info
**Up CLI:** The `up space mirror` command in up CLI was updated with new images for this Spaces version. Use up CLI v0.45.0 or later.
:::

#### What's Changed

- Control plane images updated (XGQL, VCluster, CoreDNS, etcd, kube-state-metrics).

## v1.13.5

### Release Date: 2026-02-04

### What's Changed

- Fixed an issue where upgrading from Spaces 1.12.x to 1.13.x could leave vCluster with incorrect memory limits. vCluster now receives the intended 12Gi memory limit after upgrade.

## v1.13.4

### Release Date: 2026-01-20

### What's Changed

- Added observability.spacesCollector.env field to support injecting environment variables into the Spaces OpenTelemetry Collector pods.

## v1.13.3

### Release Date: 2025-11-25

### What's Changed

- Bump vcluster from 0.24.1 to 0.24.2 to support k8s 1.33.
- Fixed a bug where the last Subject listed in an ObjectRoleBinding would be the only one with bound permissions.

## v1.13.2

### Release Date: 2025-09-16

#### What's Changed

- Health: don't mark control planes as degraded for unsupported versions
- SpaceBackup: try backing up controlplanes even if not ready/healthy
- Apollo/CNPG: allow configuring resources and separate wal volume
- Make sharedbackups and spacebackups less brittle
- Watch image configs only if available
- Allow telemetry scrape to all vcluster managed pods

## v1.13.1

### Release Date: 2025-06-11

#### What's Changed

**Warning - Breaking changes**

- This release contains breaking changes related to the Universal Crossplane version support. The latest supported Crossplane version is now `1.20`, which means the oldest supported version is `1.18`. If you have control planes pinned to `1.17.x`, please update them before upgrading, otherwise they'll be set as degraded.
- The ESO version used for SharedSecretStore feature is updated to `v0.16.2` and with this version bumps the `ExternalSecret`, `ClusterSecretStore` and all External Secrets provider versions to `v1`.
- `controlPlanes.api`, `controlPlanes.controller` and `controlPlanes.syncer` parameter trees have been dropped from the Helm chart interface. The `controlPlanes.vcluster` parameter tree should be used instead to align with the latest vcluster version's combined pod architecture.
- Control plane vCluster memory limits are now set to a high value for safety rather than being dynamically managed. Previously, memory limits were initially set to a low value and managed by the autoscaler, but sudden surges of CRDs could cause the vCluster pod to run out of memory before the autoscaler could react.

#### Features and Enhancements

Spaces `v1.13.1` contains important bug fixes, security improvements, dependency updates and architectural simplifications. The latest supported Crossplane version is bumped to `1.20` and SharedSecrets is now considered GA and enabled by default. Several components including CoreDNS, mxp-gateway, and xgql have been moved out of the control plane and onto the host cluster for improved performance and reliability.

This release bumps the vcluster dependency to `v0.24.1` with no API changes introduced through this upgrade. The vCluster memory management approach has been revised to prevent out-of-memory issues during CRD surges by unsetting memory limits while continuing to monitor vCluster improvements.

**Universal Crossplane**:
- Bumped the latest supported Universal Crossplane minor version to v1.20.

**SharedSecrets**:
- SharedSecrets is now considered GA and enabled by default.
- ESO version updated to `v0.16.2` with provider versions bumped to `v1`.

**Upbound Controllers**:
- Upbound controllers package metadata and the ControllerRuntimeConfig spec now support Go text templating. The "ingressHost" template variable is substituted with the Spaces ingress hostname, "controlPlaneName" and "controlPlaneNamespace" are substituted with the associated control plane's name and group name, respectively.

**Observability**:
- SharedTelemetry - removed control plane system components (Spaces internals, etcd...) telemetry from SharedTelemetry. Self-hosted Spaces admins can still turn it back on by setting the `observability.collectors.includeSystemTelemetry` flag to true.

**Architecture Improvements**:
- Moved CoreDNS and xgql out of the control plane and onto the host cluster.
- Removed the mxp-gateway and mxp-bootstrapper to simplify the communication architecture.

**Other**:
- Added the `externalTLS` Helm parameter tree to facilitate easier configuration for a custom external certificate.
- Allow control-plane editors and admins to delete pods.
- Expose runtime latest versions information in crossplane-versions-public configmap.

**Bug Fixes**:
- Added validation to ensure the control plane name does not exceed 63 characters.
- Fixed a bug in how the envoy within spaces-router was configured that could result in non-deterministic behavior. Now envoy will allocate workers based on the CPU limits it is provided.
- Spaces-controller now runs with leader-election enabled even if it's not configured in HA mode with multiple replicas.

## v1.12.3

### Release Date: 2026-01-20

#### What's Changed

- Added observability.spacesCollector.env field to support injecting environment variables into the Spaces OpenTelemetry Collector pods.

## v1.12.2

### Release Date: 2025-12-09

#### What's Changed

- Fixed a bug where the last Subject listed in an ObjectRoleBinding would be the only one with bound permissions.

## v1.12.1

### Release Date: 2025-09-16

#### What's Changed

- Health: don't mark control planes as degraded for unsupported versions
- SpaceBackup: try backing up controlplanes even if not ready/healthy
- Apollo/CNPG: allow configuring resources and separate wal volume
- Make sharedbackups and spacebackups less brittle
- Watch image configs only if available
- Allow telemetry scrape to all vcluster managed pods

## v1.12.0

### Release Date: 2025-04-07

#### What's Changed

**Warning - Breaking changes**

- This release contains breaking changes related to the vcluster dependency upgrade from v0.15.7 to v0.22.3.
  `controlPlanes.syncer` parameter tree has been renamed as `controlPlanes.vcluster`. The `controlPlanes.api` and
  `controlPlanes.controller` Helm parameter trees have been removed from the `spaces` Helm chart. Customers relying on
  these parameters can now use the `controlPlanes.vcluster` parameter tree.
- The control plane memory auto-scaler for the vcluster API server now sets memory limits on the vcluster `syncer` container
  where `kube-api-server` is now colocated. It sets a limit of 3 times the proposed memory request for the `syncer` container.

Upgrades to Spaces v1.12.0 should be performed from v1.11.3. Spaces v1.11.2 and prior versions do not include
a synchronization mechanism for `spaces-controller`, potentially leading to upgrade issues.

#### Features and Enhancements
Spaces `v1.12.0` contains important bug fixes, security improvements, dependency updates and introduces support
for Upbound controller packages in private preview. The latest supported Crossplane version is bumped to `1.19.0-up.1`
and the shared backups feature is now enabled by default. Spaces OpenTelemetry collectors for metrics and logs now use
TLS server sockets to secure communications. It's now possible to configure the tolerations for the SharedTelemetry
log collector pods using the `observability.collector.tolerations` Helm parameter.

In order to be able to install Upbound controllers in a control plane, the private preview feature must have been enabled
with the `features.alpha.upboundControllers.enabled=true` Helm parameter and the control plane's Crossplane version must
support controller packages. We currently don't support routing requests to the services installed by
the Upbound controller packages. Support for service routing is planned for future releases.

This release bumps the vcluster dependency to `v0.22.3` which introduces the following breaking changes:
- vcluster's `kube-apiserver` & `kube-controller-manager` now run inside the `vcluster` pod's `syncer` container.
  Their deployments (`vcluster-api` and `vcluster-controller`) no longer exist.
- vcluster `syncer` has behavior changes, notably it now syncs resources from the host cluster back to the virtual cluster.
- `controlPlanes.api` and `controlPlanes.controller` Helm parameter trees have been removed from the `spaces` Helm chart.
  `controlPlanes.syncer` has been renamed as `controlPlanes.vcluster`. `controlPlanes.vcluster` parameter tree should be used instead.
- `vcluster-api` & `vcluster-controller` PDBs are removed (also from existing ControlPlanes).


**Upbound Controllers**:
- Added support for installing Upbound Controller packages as an alpha feature.

**Universal Crossplane**:
- Bumped the latest supported Universal Crossplane minor version to v1.19.

**Observability**:
- Spaces OpenTelemetry collectors for metrics and logs now use TLS server sockets.
- The Helm parameter `observability.collector.tolerations` has been introduced to be able to configure the tolerations
  for the SharedTelemetry log collector pods.

**Shared Backups**:
- Shared backups feature is now enabled by default.

**Other**:
- VCluster Helm chart is now pulled from the OCI registry `xpkg.upbound.io`.
- Added a validation to ensure the control plane name does not exceed 63 characters.

**Bug Fixes**:
- Fixed an issue causing x509 certificate validation errors while connecting a control plane using the ArgoCD plugin.
- Fixed an issue with `up alpha query` working with kinds, properly detecting cycles and setting counts for relationships queries.
- Fixed an issue in Space level telemetry where the collector pod would restart due to the healthcheck extension not being updated to the v0.116.0 configuration.
- Fixed an issue with setting annotations on groups via the Spaces API. Previously setting annotations on groups via the Spaces API were not allowed. Now there is a Spaces Helm parameter to allow setting the desired annotation keys.
- Fixed an issue with control plane restoration where a resource being deleted during backup might cause restoration to fail.
- Fixed an issue that prevents reconciliation of control planes with more than one deprecated finalizer.
- Missing HTTP metrics for internal components are restored.

## v1.11.3

### Release Date: 2025-04-02

**Warning - Action Required**

Please upgrade to Spaces `v1.11.3` before upgrading to the upcoming `v1.12.0`.

#### What's Changed

- Unconditionally enable leader election for `spaces-controller` even if the high-availability mode is not configured.
- Security fixes for Go dependencies.

## v1.11.2

### Release Date: 2025-03-12

#### What's Changed

- fix(apollo): typos and count column handling on relationships.
- fix(eso): disable conversion webhook as service is unreachable.

## v1.11.1

### Release Date: 2025-02-13

#### What's Changed

- Restored missing http metrics for internal components.
- Fixed an issue in Space level telemetry where the collector pod would restart due to the healthcheck extension not
  being updated to the v0.116.0 configuration.

## v1.11.0

### Release Date: 2025-02-04

#### What's Changed

**Warning - Action Required**

If you are running Spaces with observability enabled; ensure the host cluster's `opentelemetry-operator` is updated to
**v0.110.0 or later** to maintain compatibility with new Collector flags.

#### Overview

This release enhances backup/restore workflows and telemetry customization, while addressing critical stability issues. Key highlights include:
- **Backup/Restore Improvements**:
  - Selective restoration of control planes using the `--controlplanes` flag via Space Backup API.
  - Backup jobs now fail explicitly if target control planes are missing.
- **Observability Enhancements**: Added support for OpenTelemetry **transform processors** in SharedTelemetry API, enabling advanced data manipulation (e.g., adding labels) before exporting metrics/logs/traces.
  -  Upgraded OTEL Collector images to **v0.116.0**.
- **Query API**: Helm chart now supports tuning PostgreSQL instance parameters and connection pooler settings for in-cluster deployments.
- **Bug Fixes**:
  - Resolved label selector matching issues in Shared Backups, Policies, and Telemetry APIs.
  - Fixed certificate renewal parameters causing synchronization issues in ArgoCD.
  - Ensured correct image pull secret usage for Crossplane version detection.

#### Features and Improvements

- Added `--controlplanes` flag to the SpaceBackup restore command that allows specifying the control planes to be restored.
- Allow customising postgres parameters for the in-chart cluster, and tune connection pooler parameters.
- Mark Backup as failed if target control plane can't be found after a few retries.
- SharedTelemetry: adds an option to configure telemetry OTEL processors similarly as the existing exporters. Currently supports the [transform](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/processor/transformprocessor/README) processor which allows for transforming telemetry data(adding labels, modificatons...) before being sent by the exporters to your defined observability backend.

#### Bug fixes

- Fix matching of multiple label selectors in backups, policies, telemetry and external secrets.
- Fixed the renewBefore and duration values in the certificates that were causing Argo to go out of sync.
- Fixes an issue where SharedTelemetryConfig would not get reconciled when a secret from its `spec.configPatchSecretRefs` would be modified.
- Using right image pull secret for automated crossplane versions detection.
- Fixed a regression causing x509 certificate validation errors while connecting a control using ArgoCD plugin.
- Adds missing network policies for space level telemetry.
- Fixed an issue where groups have not been able to be managed through the Spaces API through means which set an annotation, due to Spaces API disallowing setting any annotation for security reasons. Now there is an Spaces Helm allowlist knob through which select annotation keys can be configured to be allowed.

#### Chore

- **Breaking change**
  Upgraded OTEL Collector images to v0.116.0. The opentelemetry-operator on the host cluster needs to run versions =>0.110.0 due to a change in OTEL Collector flags.

## v1.10.4

### Release Date: 2025-03-12

#### What's Changed

- fix(apollo): typos and count column handling on relationships.
- fix(eso): disable conversion webhook as service is unreachable.

## v1.10.3

### Release Date: 2025-02-13

#### What's Changed

- Fixed the renewBefore and duration values in the certificates that were causing Argo to go out of sync.

## v1.10.2

### Release Date: 2025-02-13

#### What's Changed

- Fixed an issue where SharedTelemetryConfig would not get reconciled when a secret from its spec.configPatchSecretRefs
  would be modified.
- Added missing network policies for space level telemetry
- Fixed a regression causing x509 certificate validation errors while connecting a control using ArgoCD plugin.

## v1.10.1

### Release Date: 2025-01-13

#### What's Changed

- Fix label selectors in backups, policies, telemetry, eso
- fix: missing wiring for controlplanes uxp metrics flag
- Revert "fix(apollo): specify schema creating indexes to get ready for pg17"

## v1.10.0

### Release Date: 2025-01-07

#### What's Changed

**Warning - Breaking changes**

Please be aware of the following changes:

- `ClientCertFromHeader` authenticator at `spaces-router` has been removed and it can no longer authenticate requests from a client certificate it finds in the `Ssl-Client-Cert` HTTP request header. `spaces-router` now requires SSL-passthrough to be enabled for the ingress-nginx controller if:
    - The Spaces `v1.10.0` installation is still using the Ingress API (this is still the default although we now support the [Gateway API](https://gateway-api.sigs.k8s.io/)) and,
    - `spaces-router` is running in secure mode (the default) and,
    - Hub identities are enabled via the `authentication.hubIdentities` Spaces Helm chart parameter (the default) and,
    - You would like to be able to authenticate Spaces clients using the client certificates issued by the host cluster's signer.

  You can enable the SSL-passthrough mode for the ingress-nginx controller by passing the `--enable-ssl-passthrough=true` command-line option to it. Please also see the official [self-hosted Spaces deployment guides](/self-hosted-spaces/overview/).
- If you are using the Gateway API with Spaces and your chosen Gateway API implementation is [Envoy Gateway](https://gateway.envoyproxy.io), please note that the short name `ctp` now belongs to the `clienttrafficpolicies.gateway.envoyproxy.io` custom resources. If you have any scripts that use this short name for `controlplanes.spaces.upbound.io`, you will need to update them to use the long name `controlplane` if you are using Envoy Gateway.

#### Features and Enhancements

- **Observability**:
    - Added an option to reference sensitive data in SharedTelemetryConfig
      configuration through a secret.

- **Query API**:
    - Pin in-chart PostgreSQL cluster to 16 and wire down image pull secrets to it too.

- **Security**:
    - Spaces chart now installs a network policy that allows ingress traffic to the `spaces-router` pod's port 8443 only from the `ingress-nginx` controller pod or the connect agent pod. The namespace and the pod labels of the `ingress-nginx` controller can be specified using the `ingress.namespaceLabels` and the `ingress.podLabels` Helm chart parameters, respectively. The pod labels for the connect agent can be specified using the `connect.agent.podLabels` Helm chart parameter.
    - Spaces now supports the Kubernetes Gateway API in addition to the Ingress API. The ClientCertFromHeader authenticator has been removed and when using a secured spaces-router with client certificate authentication, TLS traffic needs to be terminated at spaces-router.

- **Other**:
    - Add schema validation for helm chart values.
    - ControlPlanes now expose the time at which they first became Available.
    - Bumped latest supported Crossplane minor version to v1.18.
    - ClusterType is removed from the Spaces helm chart values

#### Fixed Bugs

- Fixed storage class parameter visibility for control plane etcd and vector in values.yaml
- Avoid noisy restarts of apollo-syncer by retrying with backoff before erroring out.
- Avoid resetting apollo syncers' passwords on every reconciliation, preventing frequent syncers restarts.
-  Drop controlPlanes.uxp.repository from values, always use registry.
- Fix an issue preventing to pull xpkg.upbound.io/spaces-artifacts/external-secrets-chart when Shared Secrets was enabled.
- Fixed a security issue with how the internal tokens are validated by mxp-gateway.
- Fixed a timeout issue in spaces-router while doing authorization checks against the host cluster for ControlPlane requests when hub RBAC is enabled via the `authorization.hubRBAC` Helm parameter.
- Fixed duplicate probe definitions in spaces controller deployment.
- Move to domain-qualified finalizer for controlplane provisioner reconciler, while dropping old ones allowing ControlPlanes deletion after Spaces upgrade.
- Properly handle and validate imagePullSecrets passed to the helm chart.
- Revert in-cluster host port used from 9091 to 8443. This led Argo to not be able to reach controlplanes.
- SpaceBackups now will only skip just created controlplanes instead of the ones not ready.
- Spaces-router can now reload without a restart renewed spaces-ca certificate which it uses to validate the upstream server certificates.

## v1.9.8

### Release Date: 2025-03-12

#### What's Changed

- fix(apollo): typos and count column handling on relationships.
- fix(eso): disable conversion webhook as service is unreachable.

## v1.9.7

### Release Date: 2025-02-13

#### What's Changed

- Fixed the renewBefore and duration values in the certificates that were causing Argo to go out of sync.

## v1.9.6

### Release Date: 2025-02-13

#### What's Changed

- Fixed matching of multiple label selectors in backups, policies, telemetry and external secrets.
- Fixed a security issue with how the internal tokens are validated by mxp-gateway.

## v1.9.5

### Release Date: 2024-12-09

#### Bugs fixed
* Fixed a timeout issue in spaces-router while doing authorization checks against the host cluster for `ControlPlane` requests when hub RBAC is enabled via the `authorization.hubRBAC` Helm parameter
* Fixed an issue causing frequent syncers restarts in `Apollo` due to password resets
* Reduced the unnecessary restarts of `Apollo` syncers in case of transient errors
* Pin in-chart PostgreSQL cluster to version 16 and pass image pull secrets, if specified.

#### Security
* Spaces chart now installs a network policy that allows ingress traffic to the spaces-router pod's port `8443` only from the ingress-nginx controller pod or the connect agent pod. The namespace and the pod labels of the ingress-nginx controller can be specified using the `ingress.namespaceLabels` and the `ingress.podLabels` Helm chart parameters, respectively. The pod labels for the connect agent can be specified using the connect.agent.podLabels Helm chart parameter

#### Enhancements
* `ControlPlane`s now expose the time at which they first became `Available` at `.status.firstAvailableAt`
* `SpaceBackups` now will only skip just created controlplanes instead of the ones not ready
* UXP images and associated registry actions are now configured with registry authentication for Spaces deployments using private registries, where the public UXP image is behind auth in the private registry.

## v1.9.4

### Release Date: 2024-11-14

#### What's Changed

* Revert in-cluster host port used from 9091 to 8443. This led Argo to not be able to reach controlplanes.

## v1.9.3

### Release Date: 2024-11-12

#### What's Changed
- Fixed duplicate probe definitions in spaces controller deployment.

## v1.9.2

### Release Date: 2024-11-08

#### What's Changed
- Fixed an issue preventing to pull xpkg.upbound.io/spaces-artifacts/external-secrets-chart when Shared Secrets was enabled.

## v1.9.1

### Release Date: 2024-11-07

#### What's Changed

:::note
Due to a technical glitch there was no 1.9.0 release image, and the first one available in the 1.9.x series is 1.9.1.
:::

:::warning
<!-- Starting with Spaces 1.9.x, Spaces with an  Argo CD Gitops integration must update their Argo CD ConfigMap to include `resource.respectRBAC: normal` instead of explicit `resource.exclusions`. Please check [Configure Argo CD]({{<ref "connect/gitops#configure-argo-cd" >}}) section for instructions and details. -->
:::

#### Features and Enhancements

- Added optional insecure mode for all Spaces endpoints to allow finer grain control around mTLS policies.
- Added class dimension to all control plane metrics.
- Added new alpha feature, Space Backup, to allow backing up and restoring a Space in case of DR.
- Added a configuration option for enabling Control Plane Crossplane dependency version upgrades.
- Bumped latest supported Crossplane minor version to v1.18.
- External-secrets operator Helm chart is bumped to version 0.10.4.

#### Fixed Bugs

- Added the `controlPlanes.syncer.extraSyncLabels` spaces Helm chart parameter so that any extra labels that you specify
  with a `DeploymentRuntimeConfig` for a Crossplane provider/function can be configured to properly sync in the host
  cluster for the ControlPlane. You may need this for certain workload identity-based authentication schemes for
  authenticating Crossplane provider/function workloads.
- Drop `controlPlanes.uxp.repository` from values, always use registry.
- Fixed Query API failing to define necessary custom functions due to inconsistent ordering.
- Fixed a race when restarting spaces-controller admission webhooks fail with a certificate error.
- Fixed control plane and namespace listing on the ingress if additional non-RBAC authorization is configured on the host
  Kubernetes.
- Fixed the Spaces API endpoint for namespace to make `kubectl get namespaces` work.
- Fixed an issue where SharedTelemetryConfig would endlessly reconcile.
- Fixed an issue with SharedTelemetryConfig datadog exporter failing with 413 error code.
- Move to domain-qualified finalizer for control plane provisioner reconciler, while dropping old ones allowing
  ControlPlanes deletion after Spaces upgrade.
- Respect disabled features for discovery, avoiding unnecessary noise when using kubectl.

## v1.8.0

### Release Date: 2024-10-08

#### What's Changed

**Warning**

Please be aware of the following changes:

- Spaces is no longer published to Google Artifact Registry and can only be accessed via xpkg.upbound.io.
- We've removed the following unused fields from the ControlPlane CRD:
    - spec.managementPolicies
    - spec.deletionPolicy
    - spec.publishConnectionDetailsTo
- User name, groups, uid and extra keys of `user.Info` originating from the host cluster (i.e. any host cluster
  identity) are all now prefixed with `upbound:spaces:host:` when that identity is used within a control plane. In
  Spaces v1.7 and below, no such prefix was added to groups from host cluster client certificates and tokens, so **any
  RBAC rules within a control plane that refers to a user group from a host cluster identity need to be updated to add
  that prefix.**

#### Features and Enhancements

- **MCPs**:
    - Crossplane v1.17 is added to the list of supported MCP versions.
    - Dropped the HEALTHY and added more details to MESSAGE column in the control plane get/list output to better
      communicate the status of the control planes.

- **Query API**:
    - Added ability to deploy and wire a CloudNativePG-powered Postgres Cluster for Query API directly from the helm
      chart.

- **IAM**:
    - The `controlPlanes.mxpController.pod.customLabels` Helm parameter was added to help configure workload identities
      for shared secrets on EKS, AKS & GKE clusters.
    - The `controlPlanes.sharedSecrets.serviceAccount.customAnnotations` and
      `controlPlanes.sharedSecrets.pod.customLabels`  Helm parameters was added to help configure workload identities
      for shared secrets on EKS, AKS & GKE clusters.
    - Support was added for workload identity-based authentication schemes for Spaces billing on EKS, AKS & GKE
      clusters.
    - Added support for authenticating Host Kubernetes ServiceAccounts in Spaces API and Control Planes
    - Filter lists of namespaces and controlplanes in Spaces API to those the user has access to.
    - Mxp-gateway now uses the original user of the request being forwarded to a ControlPlane or xgql.
    - There is no more any need to populate the `upbound.io/aud` userinfo extra in structured auth config for OIDC.

- **Backup & restore**:
    - Deletion policy `Delete` for `Backups` using `Secrets` for credentials will now be respected.

- **Shared Secrets**:
    - External-secrets operator Helm chart is bumped to version 0.9.20.

- **Administration**:
    - Health checks were added to the spaces-controller pods.
    - Added control plane state metrics to track the number of all / synced / ready / healthy / deleting / degraded and
      stuck in provisioning or deleting control planes.

#### Fixed Bugs

- Added missing priorityClass for telemetry-spaces-logs daemonset.
- Fixed an issue where SharedTelemetryConfig would endlessly reconcile.
- Fixed an issue with SharedTelemetryConfig Datadog exporter failing with 413. The issue is not fully fixed but has been
  remediated by removing the metrics that were too big for Datadog to handle.

## v1.7.2

### Release Date: 2024-09-13

#### What's Changed

- Fixed a bug in Spaces Chart's pre-upgrade hook where the backOffLimit was incorrectly declared.

## v1.7.1

### Release Date: 2024-09-12

#### What's Changed

- Fixed a bug in Apollo where the right column for owners query was not displayed correctly.
- Fixed a bug in Apollo to ensure that requests do not fail when debug output encounters an issue.
- Fixed a bug in MXP-Gateway to prevent logging of PII, and granted admins & editors the privilege to view logs for
  controlplane pods.
- Fixed a bug in Spaces Chart related to the pre-upgrade hook.
- Fixed a bug in Crossplane-Versions-Public configmap to allow public querying.

## v1.7.0

### Release Date: 2024-09-02

#### API Changes

- Added v1alpha2 of the Query API, which supports a richer set of filters.

#### What's New

- **OCI Artifact Support in Upbound Registry**: We are excited to announce that the Spaces Helm Chart and images are now
  shipped as OCI artifacts by default, hosted in the Upbound central registry. You can access these at
  `xpkg.upbound.io/spaces/artifacts`.

  **Important**: To pull the Helm Chart and images from the new OCI location, you will need to obtain a new pull token
  from your Upbound account representative.

  To update your pull secret, follow these steps:

    1. **Delete the existing pull secret**:
       ```bash
       kubectl delete -n upbound-system upbound-pull-secret
       ```
    2. **Re-create the upbound-pull-secret**:
       ```bash
       kubectl -n upbound-system create secret docker-registry upbound-pull-secret \
       --docker-server=https://xpkg.upbound.io \
       --docker-username="$(jq -r .accessId $SPACES_TOKEN_PATH)" \
       --docker-password="$(jq -r .token $SPACES_TOKEN_PATH)"
       ```

  **Start the Helm-Chart upgrade**:

    1. **Log in to the OCI Registry**:
       ```bash
       jq -r .token $SPACES_TOKEN_PATH | helm registry login xpkg.upbound.io -u $(jq -r .accessId $SPACES_TOKEN_PATH) --password-stdin
       ```
    2. **Upgrade Spaces software from the new location**:
       ```bash
       helm -n upbound-system upgrade --install spaces \
         oci://xpkg.upbound.io/spaces-artifacts/spaces \
         --version "${SPACES_VERSION}" \
         --set "ingress.host=${SPACES_ROUTER_HOST}" \
         --set "clusterType=${SPACES_CLUSTER_TYPE}" \
         --set "account=${UPBOUND_ACCOUNT}" \
         --set "authentication.hubIdentities=true" \
         --set "authorization.hubRBAC=true"
       ```

- **Helm Repository Deprecation**: This release marks the final time the Spaces Helm Chart will be published to the
  Upbound Helm repository. All users are encouraged to migrate to the new OCI artifact format to ensure uninterrupted
  access to future updates.

  If you need additional time to prepare for this transition, you can still use the old registry with this release. To
  do so, you must explicitly set the registry:

  ```bash
  helm -n upbound-system upgrade --install spaces \
    oci://us-west1-docker.pkg.dev/orchestration-build/upbound-environments/spaces \
    --version "${SPACES_VERSION}" \
    --set "registry=us-west1-docker.pkg.dev/orchestration-build/upbound-environments" \
    --set "ingress.host=${SPACES_ROUTER_HOST}" \
    --set "clusterType=${SPACES_CLUSTER_TYPE}" \
    --set "account=${UPBOUND_ACCOUNT}" \
    --set "authentication.hubIdentities=true" \
    --set "authorization.hubRBAC=true"
  ```

  **Note**: This will be the last version that supports the old registry. We will discontinue publishing updates to it
  after Spaces 1.8.0.

---

We appreciate your cooperation and understanding during this transition. Should you have any questions or require
further assistance, please reach out to your Upbound account representative.

- **Simplified Installation Requirements**: This release simplifies the installation process for the Spaces Helm Chart.
  You no longer need to have Crossplane installed with the provider-helm and provider-kubernetes on your HostCluster. If
  you were only using this Crossplane setup for Spaces, you can safely remove the remaining artifacts by running the
  following commands:

  ```bash
  kubectl delete xhostclusters.internal.spaces.upbound.io space-hub
  kubectl patch xhostclusters.internal.spaces.upbound.io space-hub --type=json -p='[{"op": "remove", "path": "/metadata/finalizers"}]'
  ```

  Once these steps are completed, you may proceed to uninstall Crossplane, provider-kubernetes, and provider-helm
  according to your original installation method.

  **Note**: The `upbound-system` namespace must not be removed, as it is still required for Spaces operations.

#### Other Improvements

- ControlPlane viewers can now list `events.events.k8s.io` resources and can get secrets.
- ControlPlane editors can no longer write ESO and kyverno resources.
- ControlPlane admins can now write kyverno `cleanuppolicies`, `clustercleanuppolicies`, `policyexceptions` and
  `events.events.k8s.io`.
- ControlPlane Admins can now also update CRDs.

#### Fixed Bugs

- Add priorityClass for telemetry-spaces-logs daemonset
- Cleanup control plane resources out of the system namespace when a control plane is deleted.
- Fix Backup's expired TTL resulting in deadlock.
- Fixed a bug preventing scraping control plane etcd metrics
- Fixed duplicate port warning printed during installation of the Spaces helm chart.
- Observability: fixed an issue where network policies didn't allow the OTEL Collector's Prometheus to scrape some pods
  for metrics.
- We have optimized our controllers and tested hosting up to 500 control planes with a single Spaces installation.

## v1.6.1

### Release Date: 2024-08-14

#### What's Changed

- We fixed a bug with SharedTelemetryConfig that caused panics in the Spaces controller.
- We fixed Backup's expired TTL resulting in deadlock.
- We fixed a bug preventing scraping of metrics from the control plane etcd pods.
- We've added a configuration option to enable
  Crossplane [SSA Claims alpha feature](https://docs.crossplane.io/v1.20/concepts/server-side-apply/) in managed
  control planes.

## v1.6.0

### Release Date: 2024-08-06

#### API Changes

- The alpha `spec.source` ControlPlane field has been removed. It's no longer supported.

#### Highlights

- It is now possible to pause and resume control planes through the `spec.crossplane.state` field.
- We optimized control plane provisioning, reducing time to readiness significantly and supporting up to 500 control
  planes with a single Spaces installation
- We've added alpha support for Query API, allowing performant querying of resources across multiple control planes.
- We've added a new feature that allows you to configure the OpenTelemetry Collector to collect logs from control
  planes.

#### What's Changed

- We upgraded Kubernetes used internally in spaces components to v1.30. v1beta1 of Structured Authentication
  Configuration can now be used.
- Starting from Spaces v1.6, users must upgrade sequentially all the minor versions. A pre-upgrade job is added to
  enforce this requirement.
- Various bug fixes and performance improvements.

## v1.5.0

### Release Date: 2024-07-01

#### Highlights

- We've expanded the observability feature by adding Spaces-level logs collection configurable through helm values. We
  also added the healthcheck extension and liveness probe to the OpenTelemetry Collector.
- We have a new feature enabled by default that updates the ConfigMap `crossplane-versions-public` in the
  `upbound-system` namespace. Whenever a new security or fix release is published, the ConfigMap will be updated. You
  can disable this feature with `controller.crossplane.versionsController.enabled.false` when running in disconnected
  self-hosted Spaces.

#### What's Changed

- We now expose a metrics port on vcluster-etcd containers.
- We removed network policies that block egress from a control plane's functions.
- We removed the legacy OIDC flags authenticator deprecated in Spaces v1.3.0.

## v1.4.2

### Release Date: 2024-06-26

#### What's Changed

- We updated the configuration of memory limits on a Space core component to avoid OOMs.
- We updated Kubernetes API, Controller and Manager to `v1.28.6`.

## v1.4.1

### Release Date: 2024-06-20

#### What's Changed

- We added missing RBAC permissions for `up migration import` to work against a Spaces MCP.
- We improved the reliability of group creation in a connected self-hosted space.
- We fixed a bug impacting hub authorization when a Space is deployed on a Google Kubernetes Engine (GKE) cluster.

## v1.4.0

### Release Date: 2024-06-07

#### Highlights

- We've introduced a new alpha feature of Upbound IAM: Upbound RBAC. Upbound RBAC allows for a unified authentication
  and authorization model across Upbound. Users who operate single-tenant Cloud or Disconnected Spaces can continue to
  use the Kubernetes-native RBAC. Upbound RBAC allows users to control access in the Upbound Console down to the local
  Space. The new `ObjectRoleBinding` API type represents these Upbound RBAC role bindings in the Space locally.
- We've extended the alpha observability feature which shipped in Spaces `v1.3.0`. Observability is now also available
  at the Space level, which lets users observe Spaces machinery. To enable this feature, set the
  `features.alpha.observability.enabled` flag to `true` when installing Spaces.

#### What's Changed

- We enabled the Crossplane [Usages](https://docs.crossplane.io/latest/managed-resources/usages/) alpha feature in managed
  control planes.
- Space admins can now pass custom service account annotations to Crossplane service account.
- We fixed some bugs related to authentication and single-tenant Spaces when in Disconnected mode.
- We now allow scaling up core control plane components via helm values.
- The latest supported Crossplane minor version in Spaces was bumped to 1.16.
- Spaces prereq providers have had version bumps to allow for incorporating new metrics emissions from these providers.
  Provider-kubernetes is bumped to `v0.18.1` and provider-helm to `v0.21.1`.
- Kube-native Hub authentication and authorization has been enabled by default.

## v1.3.1

### Release Date: 2024-05-07

#### Highlights

- This release fixes some Identity and Access Management related issues.

## v1.3.0

### Release Date: 2024-04-30

#### Highlights

- Control Plane Groups: Introducing Control Plane groups and Shared APIs for managing multiple control planes and
  related resource types, streamlining operations across environments.
- Automated Crossplane Upgrades: Implementing release channels for automated upgrades of Crossplane versions, ensuring
  Control planes remains up-to-date by getting latest patches automatically.
- Unified IAM: Unified identity and access management experience to manage access controls to everything within Spaces.
- Performance and Stability Improvements: Enhancements to system performance and stability to ensure a smoother and more
  reliable experience.

#### Alpha Features

- Aggregate Query API: Enchanced experience for querying one or more Control Planes with Aggregate Query API.
- External Secret Stores: Introducing the SharedSecretStore API, supporting external secret management.
- Upbound Policy: Introducing SharedUpboundPolicy API for centralized policy management across control planes.
- Observability: ShareTelemetryConfig API enabling exporting one or more telemetry for one or more control planes to the
  desired observability backends.
- Backup and Restore: Implementing SharedBackup and SharedBackupSchedule APIs to provide robust backup and restore
  functionality control planes.
- Importing/Exporting Control Planes: Enabling migrating in or out from Spaces control planes.

## v1.2.4

### Release Date: 2024-03-13

#### What's Changed

- Tweaked the control plane API autoscaler configuration per recent performance testing.
- Fixed an issue causing the kube-state-metrics pods being restarted per CRD deployed in the control plane.
- Optimized the control plane deletion process to reduce the time it takes to delete a control plane.
- Fixed an issue breaking `kubectl logs` command against the control plane API.

## v1.2.3

### Release Date: 2024-03-01

#### What's Changed

- This release fixes an issue that affected control planes' ability to provision in non-kind cluster environments.

## v1.2.2

### Release Date: 2024-03-01

#### What's Changed

- This release contains several improvements to improve control plane orchestration performance. It addresses an issue
  where control plane provisioning time degraded when multiple control planes were provisioned in parallel.
- The latest supported minor Crossplane version is now `v1.15`.

## v1.2.1

### Release Date: 2024-02-08

#### What's Changed

- Fixed an issue causing the `controlplane` resources having a benign `crossplane.io/external-create-failed` annotation.
- Fixed an issue causing hotlooping version controller when a `controlplane` is deleted.
- Other stability and performance improvements.

## v1.2.0

### Release Date: 2024-02-01

#### What's Changed

- We introduced a new concept called `control plane groups` within a Space. Technically, all `kind: controlplane`
  resources are now namespace-scoped objects (as opposed to previously being cluster-scoped).
- Control planes now offer auto-upgrade channels (`rapid`, `stable`, `patch`, and `none`), giving users control over
  what pace their control plane's Crossplane version automatically upgrades to. `None` gives users total control over
  when to upgrade the Crossplane version in a control plane.
- Alpha suppport for a new aggregate query API that can be used to query state across one or more control planes in a
  group.
- Alpha support for built-in multi-control plane secrets management. Define new `SharedSecrets` and `SharedSecretStores`
  within a control plane group to selectively provision secrets from an external store--such as Vault--into the control
  planes in the group.
- Support for OIDC auhentication flows when interacting directly with a control plane in a Space.
- new `up` CLI commands to migrate open soure Crossplane or UXP instances into a control plane in a Space.

## v1.1.0

### Release Date: 2023-10-10

#### What's Changed

- Alpha support for enabling External Secrets Operator in a control plane.
- Control plane api-server autoscaling based on CRD count.
- Universal Crossplane was bumped from `v1.13.2-up.1` to `v.1.13.2-up.2` for all control planes.
- new `up` CLI commands to interact with control planes in a Space.

## v1.0.1

### Release Date: 2023-08-31

#### What's Changed

- Export mxp-gateway metrics via otlp-collector

## v1.0.0

### Release Date: 2023-08-28

#### What's Changed

- controllers: patch against original object
- Promote APIs to v1beta1
- apis: clarify resource descriptions
- apis/mxp: minimize unused xr fields
- Stop routing internal traffic in the hub hostcluster through the ingress-controller
- XManagedControlPlane and hub XHostCluster XRs to v1beta1
- Introduce CRD lifecycle management through mxe-apis
- Add external-name to xhostclusterservices composed resource
- Stop logging bearer token at debug
- Clean up misc items
- Update XHostClusterServices resource
- Minor adjustments to destroy process
- Enable git source by default and keep it optional
- kube-control-plane: bump to kube 1.28
- ArgoCD controller to register ControlPlane as target
- vcluster: bump memory limit to 400Mi after seeing 270Mi in reality
- mxp-gateway: use client-go's transport cache
- Bring vcluster-k8s in tree
- Return error instead of panic if ctp connection secret ref is unset
- vcluster: disable its liveness probe pointing to kube-apiserver
- Observability networkpolicy fixes
- Fix ssh auth with known_hosts and sub-directory discovery
- git: fix commit ref bugs
- git: run through cleanup even if controlplane is not ready
- Fix otlp-collector networkpolicy ports

<!-- vale on -->
