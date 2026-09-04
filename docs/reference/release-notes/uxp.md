---
title: Upbound Crossplane Release Notes
description: Release notes for Upbound Crossplane
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

## v2.4.0-up.1

### Release Date: 2026-09-04

#### What's Changed

Based on Crossplane [v2.4.0](https://github.com/crossplane/crossplane/releases/tag/v2.4.0).

- Backups can now be scoped by namespace. `includedNamespaces` and `excludedNamespaces` were added to the shared `ControlPlaneBackupConfig`, so both `Backup` and `BackupSchedule` can limit which namespaces a backup captures; `excludedNamespaces` merges with the system namespaces that are always excluded. The fields are immutable on `Backup`, mirroring `excludedResources`, and stay mutable on `BackupSchedule` so a schedule's scope can be adjusted over time.
- Fixed restores that could never complete on larger control planes. A two-minute budget capped the whole import and truncated the importer's own longer per-step timeouts, so a restore needing more time restarted from scratch and never got further. The import is no longer bounded that way, failed attempts retry with backoff and keep retrying, and a failing import now reports the import error itself.
- Reduced Upbound Controller Manager memory usage when the secrets proxy webhook is enabled. Replicating the proxy's `Secret` and CA bundle `ConfigMap` made the manager cache every `ConfigMap` and `Secret` in the cluster; both are now cached only for the source and injection namespaces.
- Removed the `upbound.manager.metering.meteringStorage.enabled` chart value. It was documented as a toggle for persistent metering storage but nothing referenced it, so the metering StatefulSet always claimed a `PersistentVolume` — and on a cluster with no default `StorageClass` that claim never bound, leaving `uxp-metering` stuck `Pending`. Metering data can't be ephemeral, so the value is gone and the requirement documented instead: set `storageClass` on clusters without a default. Rendered output is unchanged.
- Security: the Go toolchain updated to 1.26.7 in both Crossplane and the Upbound Controller Manager.
- Security: Crossplane core dependency updates, including `golang.org/x/crypto` v0.56.0 — which addresses two denial-of-service issues in its SSH implementation — and `google.golang.org/grpc` v1.83.1.
- Security: the same `golang.org/x/crypto` v0.56.0 and `google.golang.org/grpc` v1.83.1 updates in the Upbound Controller Manager, along with `golang.org/x/net` v0.55.0, `golang.org/x/text` v0.39.0, `golang.org/x/mod` v0.40.0, `oras.land/oras-go` v2.6.2, and the `sigstore` toolchain — `cosign` v3.0.6, `rekor` v1.5.2, `sigstore-go` v1.2.1 and `timestamp-authority` v2.1.0.
- Security: the bundled Helm library updated to v3.21.4, which removes `containerd` from the Upbound Controller Manager image entirely.
- Security: the `uxp-webui` subchart updated to 1.1.8, rebuilt against Alpine `libssl3` and `libcrypto3` 3.5.8-r0.
- Security: the `uxp-apollo` subchart updated to 0.4.23.
- Security: refreshed the `gcr.io/distroless/static` base image of the Upbound Controller Manager.

## v2.3.5-up.2

### Release Date: 2026-09-04

#### What's Changed

Based on Crossplane [v2.3.5](https://github.com/crossplane/crossplane/releases/tag/v2.3.5).

- Security: the Go toolchain updated to 1.26.7 in both Crossplane and the Upbound Controller Manager.
- Security: `google.golang.org/grpc` v1.83.1 and `golang.org/x/crypto` v0.56.0 in Crossplane and the Upbound Controller Manager.
- Security: the bundled Helm library updated to v3.21.4, which removes `containerd` from the Upbound Controller Manager image entirely.
- Security: the `uxp-webui` subchart updated to 1.1.8, rebuilt against Alpine `libssl3` and `libcrypto3` 3.5.8-r0.
- Security: the `uxp-apollo` subchart updated to 0.4.23, which carries `google.golang.org/grpc` v1.83.1.

## v2.2.5-up.2

### Release Date: 2026-09-04

#### What's Changed

Based on Crossplane [v2.2.5](https://github.com/crossplane/crossplane/releases/tag/v2.2.5).

- Security: the Go toolchain updated to 1.26.7 in both Crossplane and the Upbound Controller Manager.
- Security: `google.golang.org/grpc` v1.83.1 and `golang.org/x/crypto` v0.56.0 in Crossplane and the Upbound Controller Manager.
- Security: the bundled Helm library updated to v3.21.4, which removes `containerd` from the Upbound Controller Manager image entirely.
- Security: the `uxp-webui` subchart updated to 1.1.8, rebuilt against Alpine `libssl3` and `libcrypto3` 3.5.8-r0.
- Security: the `uxp-apollo` subchart updated to 0.4.23, which carries `google.golang.org/grpc` v1.83.1.

## v2.1.8-up.4

### Release Date: 2026-09-04

#### What's Changed

Based on Crossplane [v2.1.8](https://github.com/crossplane/crossplane/releases/tag/v2.1.8), plus Upbound security fixes that have no upstream equivalent — upstream Crossplane no longer publishes patches for the 2.1 line, so the Crossplane fixes below were made by Upbound in its Crossplane distribution.

- Security: the Go toolchain updated to 1.26.7 in both Crossplane and the Upbound Controller Manager.
- Security: `google.golang.org/grpc` v1.83.1 and `golang.org/x/crypto` v0.56.0 in Crossplane and the Upbound Controller Manager.
- Security: the bundled Helm library updated to v3.21.4, which removes `containerd` from the Upbound Controller Manager image entirely.
- Security: the `uxp-webui` subchart updated to 1.0.7, rebuilt against Alpine `libssl3` and `libcrypto3` 3.5.8-r0.
- Security: the `uxp-apollo` subchart updated to 0.2.24, which carries `google.golang.org/grpc` v1.83.1.

## v2.0.8-up.9

### Release Date: 2026-09-04

#### What's Changed

Based on Crossplane [v2.0.8](https://github.com/crossplane/crossplane/releases/tag/v2.0.8), plus Upbound security fixes that have no upstream equivalent — upstream Crossplane no longer publishes patches for the 2.0 line, so the Crossplane fixes below were made by Upbound in its Crossplane distribution.

- Security: the Go toolchain updated to 1.26.7 in both Crossplane and the Upbound Controller Manager.
- Security: `google.golang.org/grpc` v1.83.1 and `golang.org/x/crypto` v0.56.0 in Crossplane and the Upbound Controller Manager.
- Security: the bundled Helm library updated to v3.21.4, which removes `containerd` from the Upbound Controller Manager image entirely.
- Security: the `uxp-webui` subchart updated to 1.0.7, rebuilt against Alpine `libssl3` and `libcrypto3` 3.5.8-r0.
- Security: the `uxp-apollo` subchart updated to 0.2.24, which carries `google.golang.org/grpc` v1.83.1.

## v1.20.12-up.2

### Release Date: 2026-09-04

#### What's Changed

Based on Crossplane [v1.20.12](https://github.com/crossplane/crossplane/releases/tag/v1.20.12).

- Security: the Go toolchain updated to 1.26.7.
- Security: Crossplane core dependency updates — `google.golang.org/grpc` v1.83.1 and `golang.org/x/crypto` v0.56.0.

## v2.3.5-up.1

### Release Date: 2026-08-26

#### What's Changed

Based on Crossplane [v2.3.5](https://github.com/crossplane/crossplane/releases/tag/v2.3.5).

- Corrected the published `crank` checksums for `linux_amd64` binaries. The `.sha256` files hadn't matched the binaries since v2.2.0, so any install script or Dockerfile that verified the amd64 checksum failed.
- Fixed a deletion-protection false positive. The field index that maps a resource to the `Usage` objects protecting it built its key by joining group, kind, name, and namespace with `.`, which is ambiguous because API groups and resource names can contain `.` themselves. Two distinct resources could collapse to the same key, so the webhook could refuse a deletion on the strength of an unrelated resource's `Usage`. The separator is now `/`.
- Fixed the metering pod ignoring a redirected image registry. The metering StatefulSet read `upbound.manager.metering.image`, an independent value that only happened to default to the same reference as the Upbound Controller Manager Deployment. Pointing `upbound.manager.image` at a private mirror moved the Deployment but left the metering pod pulling from `xpkg.upbound.io`, and the only workaround was to repeat the override. Each field of the metering image now defaults to its `upbound.manager.image` counterpart, and `upbound.manager.metering.image` still overrides it.
- The bundled Prometheus `config-reload` sidecar image is now configurable through `upbound.manager.prometheus.reloaderImage.repository` and `upbound.manager.prometheus.reloaderImage.tag`. Previously only the Prometheus server image could be redirected, so the sidecar kept its upstream `quay.io` default. On clusters that enforce a registry allowlist the StatefulSet was rejected, and because Prometheus is installed before `License` status is written, the visible symptom was a valid enterprise license reporting `Unknown` or `community` with nothing pointing at Prometheus. Defaults are unchanged.
- Fixed a valid `License` reporting no status when component provisioning failed. `License` status was written last, after the metering apply and Prometheus sync, both of which stop on error — so a provisioning failure left the `License` with no status and nothing naming the component that failed. Status is now written first on every path, and a provisioning failure records a `ProvisionComponents` warning event.
- A `License` naming a plan the running build doesn't recognize no longer blocks provisioning. Version skew can produce an unknown plan, which previously stopped the reconcile before status was written. Licensed components read none of the plan's features, so they now install and the skew is reported through an `UnknownPlan` warning event.
- Security: Crossplane core dependency updates — `cel-go`, `golang.org/x/mod`, `sigstore-go`, and a broader vulnerable-dependency sweep, plus `crossplane-runtime` v2.3.4, which carries its own updates.
- Security: the Go toolchain updated to 1.25.13, and `golang.org/x/mod` v0.40.0 in the Upbound Controller Manager.
- Security: the `uxp-apollo` subchart updated to v0.4.22.
- Security: refreshed the `gcr.io/distroless/static` base image of the Upbound Controller Manager.

## v2.2.5-up.1

### Release Date: 2026-08-26

#### What's Changed

Based on Crossplane [v2.2.5](https://github.com/crossplane/crossplane/releases/tag/v2.2.5).

- Corrected the published `crank` checksums for `linux_amd64` binaries. The `.sha256` files hadn't matched the binaries since v2.2.0, so any install script or Dockerfile that verified the amd64 checksum failed.
- Fixed a deletion-protection false positive. The field index that maps a resource to the `Usage` objects protecting it built its key by joining group, kind, name, and namespace with `.`, which is ambiguous because API groups and resource names can contain `.` themselves. Two distinct resources could collapse to the same key, so the webhook could refuse a deletion on the strength of an unrelated resource's `Usage`. The separator is now `/`.
- Fixed the metering pod ignoring a redirected image registry. The metering StatefulSet read `upbound.manager.metering.image`, an independent value that only happened to default to the same reference as the Upbound Controller Manager Deployment. Pointing `upbound.manager.image` at a private mirror moved the Deployment but left the metering pod pulling from `xpkg.upbound.io`, and the only workaround was to repeat the override. Each field of the metering image now defaults to its `upbound.manager.image` counterpart, and `upbound.manager.metering.image` still overrides it.
- The bundled Prometheus `config-reload` sidecar image is now configurable through `upbound.manager.prometheus.reloaderImage.repository` and `upbound.manager.prometheus.reloaderImage.tag`. Previously only the Prometheus server image could be redirected, so the sidecar kept its upstream `quay.io` default. On clusters that enforce a registry allowlist the StatefulSet was rejected, and because Prometheus is installed before `License` status is written, the visible symptom was a valid enterprise license reporting `Unknown` or `community` with nothing pointing at Prometheus. Defaults are unchanged.
- Fixed a valid `License` reporting no status when component provisioning failed. `License` status was written last, after the metering apply and Prometheus sync, both of which stop on error — so a provisioning failure left the `License` with no status and nothing naming the component that failed. Status is now written first on every path, and a provisioning failure records a `ProvisionComponents` warning event.
- A `License` naming a plan the running build doesn't recognize no longer blocks provisioning. Version skew can produce an unknown plan, which previously stopped the reconcile before status was written. Licensed components read none of the plan's features, so they now install and the skew is reported through an `UnknownPlan` warning event.
- Security: Crossplane core dependency updates — `cel-go`, `golang.org/x/mod`, `sigstore-go`, `go-git`, and a broader vulnerable-dependency sweep, plus `crossplane-runtime` v2.2.4, which carries its own updates.
- Security: the Go toolchain updated to 1.25.13, and `golang.org/x/mod` v0.40.0 in the Upbound Controller Manager.
- Security: the `uxp-apollo` subchart updated to v0.4.22.
- Security: refreshed the `gcr.io/distroless/static` base image of the Upbound Controller Manager.

## v2.1.8-up.3

### Release Date: 2026-08-26

#### What's Changed

Based on Crossplane [v2.1.8](https://github.com/crossplane/crossplane/releases/tag/v2.1.8).

This is a security re-bundle. The upstream Crossplane release tag is unchanged, but the Upbound fork tracks upstream's `release-2.1` branch, so this ships what upstream merged there after v2.1.8 together with Upbound's own dependency updates.

- Fixed the metering pod ignoring a redirected image registry. The metering StatefulSet read `upbound.manager.metering.image`, an independent value that only happened to default to the same reference as the Upbound Controller Manager Deployment. Pointing `upbound.manager.image` at a private mirror moved the Deployment but left the metering pod pulling from `xpkg.upbound.io`, and the only workaround was to repeat the override. Each field of the metering image now defaults to its `upbound.manager.image` counterpart, and `upbound.manager.metering.image` still overrides it.
- Security: the Go toolchain updated to 1.25.13 in the Upbound Controller Manager.
- Security: the `uxp-apollo` subchart updated to v0.2.23.
- Security: refreshed the `gcr.io/distroless/static` base image of the Upbound Controller Manager.

## v2.0.8-up.8

### Release Date: 2026-08-26

#### What's Changed

Based on Crossplane [v2.0.8](https://github.com/crossplane/crossplane/releases/tag/v2.0.8).

This is a security re-bundle. The upstream Crossplane release tag is unchanged, but the Upbound fork tracks upstream's `release-2.0` branch, so this ships what upstream merged there after v2.0.8 together with Upbound's own dependency updates.

- Fixed the metering pod ignoring a redirected image registry. The metering StatefulSet read `upbound.manager.metering.image`, an independent value that only happened to default to the same reference as the Upbound Controller Manager Deployment. Pointing `upbound.manager.image` at a private mirror moved the Deployment but left the metering pod pulling from `xpkg.upbound.io`, and the only workaround was to repeat the override. Each field of the metering image now defaults to its `upbound.manager.image` counterpart, and `upbound.manager.metering.image` still overrides it.
- Security: the Go toolchain updated to 1.25.13 in the Upbound Controller Manager.
- Security: the `uxp-apollo` subchart updated to v0.2.23.
- Security: refreshed the `gcr.io/distroless/static` base image of the Upbound Controller Manager.

## v1.20.12-up.1

### Release Date: 2026-08-26

#### What's Changed

Based on Crossplane [v1.20.12](https://github.com/crossplane/crossplane/releases/tag/v1.20.12).

- Security: Crossplane core dependency updates — the Go toolchain to 1.25.13, `go-git` v5.19.2, `golang.org/x/mod` v0.40.0, and two combined vulnerable-dependency sweeps, plus `crossplane-runtime` v1.20.11, which carries its own updates.
- Security: `golang.org/x/mod` v0.40.0 in the Upbound Controller Manager.
- Security: refreshed the `gcr.io/distroless/static` base image.

## v2.3.4-up.2

### Release Date: 2026-08-05

#### What's Changed

Based on Crossplane [v2.3.4](https://github.com/crossplane/crossplane/releases/tag/v2.3.4).

- Fixed a deletion-protection false positive. The field index that maps a resource to the `Usage` objects protecting it built its key by joining group, kind, name, and namespace with `.`, which is ambiguous because API groups and resource names can contain `.` themselves. Two distinct resources could collapse to the same key, so the webhook could refuse a deletion on the strength of an unrelated resource's `Usage`. The separator is now `/`.
- Security: Crossplane core and Upbound Controller Manager dependency updates — `github.com/sigstore/sigstore-go` v1.2.1 (CVE-2026-54787), `github.com/klauspost/compress` v1.18.7 (GHSA-259r-337f-4rfw), and `cel-go` (GHSA-gcjh-h69q-9w9g).
- Security: the `uxp-apollo` subchart updated to v0.4.20, bumping `chi` to v5.3.0 (GO-2026-5775, GO-2026-5777) and `golang.org/x/text` to v0.39.0 (CVE-2026-56852).
- Security: refreshed the `gcr.io/distroless/static` base image of the Upbound Controller Manager.

## v2.2.4-up.2

### Release Date: 2026-08-05

#### What's Changed

Based on Crossplane [v2.2.4](https://github.com/crossplane/crossplane/releases/tag/v2.2.4).

- Fixed a deletion-protection false positive. The field index that maps a resource to the `Usage` objects protecting it built its key by joining group, kind, name, and namespace with `.`, which is ambiguous because API groups and resource names can contain `.` themselves. Two distinct resources could collapse to the same key, so the webhook could refuse a deletion on the strength of an unrelated resource's `Usage`. The separator is now `/`.
- Security: Crossplane core and Upbound Controller Manager dependency updates — `github.com/sigstore/sigstore-go` v1.2.1 (CVE-2026-54787), `github.com/klauspost/compress` v1.18.7 (GHSA-259r-337f-4rfw), and `cel-go` (GHSA-gcjh-h69q-9w9g).
- Security: the `uxp-apollo` subchart updated to v0.4.20, bumping `chi` to v5.3.0 (GO-2026-5775, GO-2026-5777) and `golang.org/x/text` to v0.39.0 (CVE-2026-56852).
- Security: refreshed the `gcr.io/distroless/static` base image of the Upbound Controller Manager.

## v2.1.8-up.2

### Release Date: 2026-08-05

#### What's Changed

Based on Crossplane [v2.1.8](https://github.com/crossplane/crossplane/releases/tag/v2.1.8).

- Fixed a deletion-protection false positive. The field index that maps a resource to the `Usage` objects protecting it built its key by joining group, kind, name, and namespace with `.`, which is ambiguous because API groups and resource names can contain `.` themselves. Two distinct resources could collapse to the same key, so the webhook could refuse a deletion on the strength of an unrelated resource's `Usage`. The separator is now `/`.
- Security: Crossplane core dependency updates — `github.com/sigstore/sigstore-go` v1.2.1 (CVE-2026-54787), plus a broader sweep clearing CVE-2026-41178, GHSA-259r-337f-4rfw, GO-2026-5774, GO-2026-5775, GO-2026-5777, and GHSA-gcjh-h69q-9w9g.
- Security: Upbound Controller Manager dependency updates — `github.com/klauspost/compress` v1.18.7 (GHSA-259r-337f-4rfw).
- Security: the `uxp-apollo` subchart updated to v0.2.22, bumping `chi` to v5.3.0 (GO-2026-5775, GO-2026-5777) and `golang.org/x/text` to v0.39.0 (CVE-2026-56852).
- Security: refreshed the `gcr.io/distroless/static` base image of the Upbound Controller Manager.

## v2.0.8-up.7

### Release Date: 2026-08-05

#### What's Changed

Based on Crossplane [v2.0.8](https://github.com/crossplane/crossplane/releases/tag/v2.0.8).

- Security: Crossplane core and Upbound Controller Manager dependency updates — `github.com/sigstore/sigstore-go` v1.2.1 (CVE-2026-54787), `github.com/klauspost/compress` v1.18.7 (GHSA-259r-337f-4rfw), and `cel-go` (GHSA-gcjh-h69q-9w9g).
- Security: the `uxp-apollo` subchart updated to v0.2.22, bumping `chi` to v5.3.0 (GO-2026-5775, GO-2026-5777) and `golang.org/x/text` to v0.39.0 (CVE-2026-56852).
- Security: refreshed the `gcr.io/distroless/static` base image of both the Crossplane core and Upbound Controller Manager images.

## v1.20.11-up.2

### Release Date: 2026-08-05

#### What's Changed

Based on Crossplane [v1.20.11](https://github.com/crossplane/crossplane/releases/tag/v1.20.11).

- Security: Crossplane core dependency updates clearing CVE-2026-54787, CVE-2026-41178, CVE-2026-23991, CVE-2026-23992, CVE-2026-24686, CVE-2026-39984, CVE-2026-49834, CVE-2026-49835, GHSA-259r-337f-4rfw, GO-2026-5774, GO-2026-5775, and GO-2026-5777.
- Security: refreshed the `gcr.io/distroless/static` base image.
- The chart's bundled `ControllerConfig` and `DeploymentRuntimeConfig` CRDs were regenerated from the Crossplane commit this release bundles, so they now match the shipped image. The change is additive — new pod spec schema fields and reworded descriptions from an `apimachinery` update. No existing schema was removed.

## v2.3.4-up.1

### Release Date: 2026-07-24

#### What's Changed

Based on Crossplane [v2.3.4](https://github.com/crossplane/crossplane/releases/tag/v2.3.4).

- Added configurable resource requests and limits for the Upbound Controller Manager init containers, via `upbound.manager.initResources` and `upbound.secretsProxy.caInit.resources`.
- Security: the `uxp-apollo` subchart updated to v0.4.19, bumping `google.golang.org/grpc` to v1.82.1 (GHSA-hrxh-6v49-42gf).
- Security: Upbound Controller Manager dependency updates — `github.com/sigstore/sigstore-go` v1.2.0 (CVE-2026-49834), `google.golang.org/grpc` v1.82.1 (GHSA-hrxh-6v49-42gf), `oras.land/oras-go/v2` v2.6.2 (CVE-2026-50163), and `golang.org/x/text` v0.39.0 (CVE-2026-56852).

## v2.2.4-up.1

### Release Date: 2026-07-24

#### What's Changed

Based on Crossplane [v2.2.4](https://github.com/crossplane/crossplane/releases/tag/v2.2.4).

- Added configurable resource requests and limits for the Upbound Controller Manager init containers, via `upbound.manager.initResources` and `upbound.secretsProxy.caInit.resources`.
- Security: the `uxp-apollo` subchart updated to v0.4.19, bumping `google.golang.org/grpc` to v1.82.1 (GHSA-hrxh-6v49-42gf).
- Security: Upbound Controller Manager dependency updates — `github.com/sigstore/sigstore-go` v1.2.0 (CVE-2026-49834), `google.golang.org/grpc` v1.82.1 (GHSA-hrxh-6v49-42gf), `oras.land/oras-go/v2` v2.6.2 (CVE-2026-50163), `golang.org/x/net` v0.56.0 (CVE-2026-46600), and `golang.org/x/text` v0.39.0 (CVE-2026-56852).

## v2.1.8-up.1

### Release Date: 2026-07-24

#### What's Changed

Based on Crossplane [v2.1.8](https://github.com/crossplane/crossplane/releases/tag/v2.1.8).

- Added configurable resource requests and limits for the Upbound Controller Manager `initialize-crds` init container, via `upbound.manager.initResources`.
- Security: the `uxp-apollo` subchart updated to v0.2.21, bumping `google.golang.org/grpc` to v1.82.1 (GHSA-hrxh-6v49-42gf).
- Security: Upbound Controller Manager dependency updates — `google.golang.org/grpc` v1.82.1 (GHSA-hrxh-6v49-42gf), `oras.land/oras-go/v2` v2.6.2 (CVE-2026-50163), and `golang.org/x/text` v0.39.0 (CVE-2026-56852).

## v2.0.8-up.6

### Release Date: 2026-07-24

#### What's Changed

Based on Crossplane [v2.0.8](https://github.com/crossplane/crossplane/releases/tag/v2.0.8).

- Added configurable resource requests and limits for the Upbound Controller Manager `initialize-crds` init container, via `upbound.manager.initResources`.
- Security: the `uxp-apollo` subchart updated to v0.2.21, bumping `google.golang.org/grpc` to v1.82.1 (GHSA-hrxh-6v49-42gf).
- Security: Upbound Controller Manager dependency updates — `google.golang.org/grpc` v1.82.1 (GHSA-hrxh-6v49-42gf), `oras.land/oras-go/v2` v2.6.2 (CVE-2026-50163), `golang.org/x/net` v0.56.0 (CVE-2026-46600), and `golang.org/x/text` v0.39.0 (CVE-2026-56852).

## v1.20.11-up.1

### Release Date: 2026-07-24

#### What's Changed

Based on Crossplane [v1.20.11](https://github.com/crossplane/crossplane/releases/tag/v1.20.11).

- Security: dependency updates — `golang.org/x/net` v0.56.0 (CVE-2026-46600) and `golang.org/x/text` v0.39.0 (CVE-2026-56852).

## v2.3.3-up.3

### Release Date: 2026-07-14

#### What's Changed

Based on Crossplane [v2.3.3](https://github.com/crossplane/crossplane/releases/tag/v2.3.3). Security patch.

- Security: the `uxp-apollo` subchart updated to v0.4.17, picking up the Go 1.25.12 standard-library fix (CVE-2026-39822) and an earlier CVE-2025-30204 fix in the apollo image.
- Security: the Upbound Controller Manager rebuilt on Go 1.25.12 (CVE-2026-39822).
- Crossplane core container images are now built to expose their full Go dependency list to vulnerability scanners, improving third-party CVE detection.

## v2.2.3-up.3

### Release Date: 2026-07-14

#### What's Changed

Based on Crossplane [v2.2.3](https://github.com/crossplane/crossplane/releases/tag/v2.2.3). Security patch.

- Security: the `uxp-apollo` subchart updated to v0.4.17, picking up the Go 1.25.12 standard-library fix (CVE-2026-39822) and an earlier CVE-2025-30204 fix in the apollo image.
- Security: the Upbound Controller Manager rebuilt on Go 1.25.12 (CVE-2026-39822).
- Crossplane core container images are now built to expose their full Go dependency list to vulnerability scanners, improving third-party CVE detection.

## v2.1.7-up.3

### Release Date: 2026-07-14

#### What's Changed

Based on Crossplane [v2.1.7](https://github.com/crossplane/crossplane/releases/tag/v2.1.7). Security patch.

- Security: Crossplane core rebuilt on Go 1.25.12 (CVE-2026-39822).
- Security: the `uxp-apollo` subchart updated to v0.2.20, picking up the Go 1.25.12 standard-library fix (CVE-2026-39822) and an earlier CVE-2025-30204 fix in the apollo image.
- Security: the Upbound Controller Manager rebuilt on Go 1.25.12 (CVE-2026-39822).

## v2.0.8-up.5

### Release Date: 2026-07-14

#### What's Changed

UXP-only security patch — upstream Crossplane has ended support for the v2.0 line, but UXP continues to support it. Based on Crossplane [v2.0.8](https://github.com/crossplane/crossplane/releases/tag/v2.0.8).

- Security: Crossplane core rebuilt on Go 1.25.12 (CVE-2026-39822).
- Security: the `uxp-apollo` subchart updated to v0.2.20, picking up the Go 1.25.12 standard-library fix (CVE-2026-39822) and an earlier CVE-2025-30204 fix in the apollo image.
- Security: the Upbound Controller Manager rebuilt on Go 1.25.12 (CVE-2026-39822).

## v1.20.10-up.3

### Release Date: 2026-07-14

#### What's Changed

Based on Crossplane [v1.20.10](https://github.com/crossplane/crossplane/releases/tag/v1.20.10). Security patch.

- Security: bundled Crossplane updated to v1.20.10-up.3, rebuilt on Go 1.25.12 (CVE-2026-39822), synced from upstream's `release-1.20`.

## v2.3.3-up.2

### Release Date: 2026-07-06

#### What's Changed

Based on Crossplane [v2.3.3](https://github.com/crossplane/crossplane/releases/tag/v2.3.3). Security patch.

- Security: Crossplane core updated to v2.3.3-up.2, picking up sigstore `rekor` v1.5.2 (CVE-2026-48702), `cosign` v3.0.6 (CVE-2026-39395), and `timestamp-authority` v2.1.0 (CVE-2026-49835).
- Security: updated `oras.land/oras-go/v2` to v2.6.1 (CVE-2026-48978, CVE-2026-50151, CVE-2026-50162, CVE-2026-50163) in the Upbound Controller Manager.

## v2.2.3-up.2

### Release Date: 2026-07-06

#### What's Changed

Based on Crossplane [v2.2.3](https://github.com/crossplane/crossplane/releases/tag/v2.2.3). Security patch.

- Security: Crossplane core updated to v2.2.3-up.2, picking up sigstore `rekor` v1.5.2 (CVE-2026-48702), `cosign` v3.0.6 (CVE-2026-39395), and `timestamp-authority` v2.1.0 (CVE-2026-49835).
- Security: updated `oras.land/oras-go/v2` to v2.6.1 (CVE-2026-48978, CVE-2026-50151, CVE-2026-50162, CVE-2026-50163) in the Upbound Controller Manager.

## v2.1.7-up.2

### Release Date: 2026-07-06

#### What's Changed

Based on Crossplane [v2.1.7](https://github.com/crossplane/crossplane/releases/tag/v2.1.7). Security patch.

- Security: Crossplane core updated to v2.1.7-up.2, picking up sigstore `rekor` v1.5.2 (CVE-2026-48702), `cosign` v2.6.3 (CVE-2026-39395), and `timestamp-authority` v2.1.0 (CVE-2026-49835).
- Security: updated `oras.land/oras-go/v2` to v2.6.1 (CVE-2026-48978, CVE-2026-50151, CVE-2026-50162, CVE-2026-50163) in the Upbound Controller Manager.

## v2.0.8-up.4

### Release Date: 2026-07-06

#### What's Changed

UXP-only security patch — upstream Crossplane has ended support for the v2.0 line, but UXP continues to support it. Based on Crossplane [v2.0.8](https://github.com/crossplane/crossplane/releases/tag/v2.0.8).

- Security: Crossplane core updated to v2.0.8-up.4, picking up sigstore `rekor` v1.5.2 (CVE-2026-48702), `cosign` v2.6.3 (CVE-2026-39395), and `timestamp-authority` v2.1.0 (CVE-2026-49835).
- Security: updated `oras.land/oras-go/v2` to v2.6.1 (CVE-2026-48978, CVE-2026-50151, CVE-2026-50162, CVE-2026-50163) in the Upbound Controller Manager.

## v1.20.10-up.2

### Release Date: 2026-07-06

#### What's Changed

Based on Crossplane [v1.20.10](https://github.com/crossplane/crossplane/releases/tag/v1.20.10). Security patch.

- Security: bundled Crossplane updated to v1.20.10-up.2, picking up sigstore `rekor` v1.5.2 (CVE-2026-48702).
- Security: updated `golang.org/x/net` to v0.55.0 and `golang.org/x/sys` to v0.44.0 in the UXP bootstrapper.

## v2.3.3-up.1

### Release Date: 2026-06-24

#### What's Changed

Based on Crossplane [v2.3.3](https://github.com/crossplane/crossplane/releases/tag/v2.3.3).

- **Fixed package signature verification TOCTOU** (GHSA-mf7q-r4rv-jv94): A time-of-check-to-time-of-use flaw could let a malicious OCI registry pass signature verification with a signed image and then serve unsigned content for installation. Fixed via crossplane-runtime v2.3.3.
- **Fixed `crossplane render` regressions**: Render now honors input XR schema, returns requirements even on fatal errors, and sets the namespace only for cluster-scoped XRs.
- Security dep bumps: Go 1.25.11, `golang.org/x/net`, `golang.org/x/sys`, `containerd` → v1.7.33

## v2.2.3-up.1

### Release Date: 2026-06-24

#### What's Changed

Based on Crossplane [v2.2.3](https://github.com/crossplane/crossplane/releases/tag/v2.2.3).

- **Fixed package signature verification TOCTOU** (GHSA-wfqx-gjrf-g28r): A time-of-check-to-time-of-use flaw could let a malicious OCI registry pass signature verification with a signed image and then serve unsigned content for installation.
- Security dep bumps: Go 1.25.11, `golang.org/x/net` → v0.55.0, `crossplane-runtime` → v2.2.3, `containerd` → v1.7.33

## v2.1.7-up.1

### Release Date: 2026-06-24

#### What's Changed

Based on Crossplane [v2.1.7](https://github.com/crossplane/crossplane/releases/tag/v2.1.7).

- Security dep bumps: Go 1.25.11, `golang.org/x/net` → v0.55.0, `quic-go` → v0.59.1, `crossplane-runtime` → v2.1.7, `containerd` → v1.7.33
- Bumped `uxp-apollo` to v0.2.18 for security fixes in `golang.org/x/crypto`, `x/net`, `x/sys`, `go-chi/chi`

## v2.0.8-up.3

### Release Date: 2026-06-24

#### What's Changed

UXP-only security patch (upstream Crossplane has ended support for the v2.0 line, but UXP continues to support it).

- Bumped Go to 1.25.11 and `golang.org/x/crypto`, `x/net` for CVEs
- Bumped `crossplane-runtime` to v2.0.9 for security fixes in `golang.org/x/net`, `x/sys`, `go.opentelemetry.io/otel`
- Bumped `uxp-apollo` to v0.2.18 for security fixes in `golang.org/x/crypto`, `x/net`, `x/sys`, `go-chi/chi`
- Security: bumped `containerd` → v1.7.33

## v1.20.10-up.1

### Release Date: 2026-06-24

#### What's Changed

Based on Crossplane [v1.20.10](https://github.com/crossplane/crossplane/releases/tag/v1.20.10).

- Security dep bumps: Go 1.25.11, `golang.org/x/net` → v0.55.0, `crossplane-runtime` → v1.20.10, `mongo-driver` → v1.17.7
- Fixed UXP "-up.N" suffix being treated as semver prerelease in the binary's internal version

## v2.3.1-up.1

### Release Date: 2026-06-05

#### Action Required

:::important
If you are running Secrets Proxy with additional namespaces configured: after upgrading to v2.3.1-up.1, delete the existing `secrets-proxy-ca` Kubernetes Secret (containing the CA cert and key) from each additional namespace. The controller will replicate the corrected Secret automatically.
:::

#### What's Changed

Based on Crossplane [v2.3.1](https://github.com/crossplane/crossplane/releases/tag/v2.3.1). This is the first UXP stable release on the v2.3 line — see upstream [v2.3.0](https://github.com/crossplane/crossplane/releases/tag/v2.3.0) and [v2.3.1](https://github.com/crossplane/crossplane/releases/tag/v2.3.1) release notes for the full set of Crossplane changes since the v2.2 line.

- Bumped `crossplane-runtime` to v2.3.1
- Security dep bump: `golang.org/x/crypto` → v0.52.0
- Synced upbound's Crossplane fork up to upstream v2.3.1, including upbound-specific patches
- Updated bundled Crossplane to v2.3.1-up.1
- Bumped `uxp-webui` to v1.1.6
- Secrets Proxy: fixed copying the CA cert and key into additional namespaces

## v2.2.2-up.1

### Release Date: 2026-05-27

#### What's Changed

Based on Crossplane [v2.2.2](https://github.com/crossplane/crossplane/releases/tag/v2.2.2).

- Bumped `crossplane-runtime` to v2.2.2
- Security dep bumps: `golang.org/x/crypto` → v0.52.0, `go-git/v5` → v5.19.1, `go-billy/v5` → v5.9.0, `in-toto-golang` → v0.11.0, `golang.org/x/net` → v0.55.0, `golang.org/x/sys` → v0.44.0, `containerd` → v1.7.32
- Bumped `uxp-webui` to 1.1.5 and `uxp-apollo` to 0.4.13

## v2.1.6-up.1

### Release Date: 2026-05-27

#### What's Changed

Based on Crossplane [v2.1.6](https://github.com/crossplane/crossplane/releases/tag/v2.1.6).

- Bumped `crossplane-runtime` to v2.1.6
- Security dep bumps: `golang.org/x/crypto` → v0.52.0, `go-git/v5` → v5.19.1, `go-billy/v5` → v5.9.0, `golang.org/x/net` → v0.55.0, `otel` → v1.41.0, `containerd` → v1.7.32
- Bumped `uxp-webui` to 1.0.4 and `uxp-apollo` to 0.2.17

## v2.0.8-up.2

### Release Date: 2026-05-27

#### What's Changed

Based on Crossplane [v2.0.8](https://github.com/crossplane/crossplane/releases/tag/v2.0.8).

- Synced security fixes from upstream release-2.0 branch: `in-toto-golang` → v0.11.0, `go-git/v5` → v5.19.1
- Security dep bumps: `go-git/v5` → v5.19.1, `go-billy/v5` → v5.9.0, `golang.org/x/crypto` → v0.52.0, `golang.org/x/net` → v0.55.0, `containerd` → v1.7.32
- Bumped `uxp-webui` to 1.0.4 and `uxp-apollo` to 0.2.17

## v1.20.8-up.1

### Release Date: 2026-05-27

#### What's Changed

Based on Crossplane [v1.20.8](https://github.com/crossplane/crossplane/releases/tag/v1.20.8).

- Bumped `crossplane-runtime` to v1.20.8
- Bumped Go to 1.25.10 to fix stdlib CVEs
- Security dep bumps: `golang.org/x/crypto` → v0.52.0, `go-git/v5` → v5.19.1

## v1.20.6-up.2

### Release Date: 2026-04-22

#### What's Changed

Based on Crossplane [v1.20.6](https://github.com/crossplane/crossplane/releases/tag/v1.20.6).

- Bumped Go to 1.25.9 to cover stdlib CVEs

## v2.2.1-up.1

### Release Date: 2026-04-21

#### What's Changed

Based on Crossplane v2.2.1.

- Correctly handle dependency upgrades with `ImageConfig` prefix rewriting — packages installed via a prefix rewrite are now upgraded when their dependencies change
- Support `ResourceSelector` with no match field — a selector with only `apiVersion` and `kind` set is now interpreted as "all resources of that kind" instead of being rejected
- Bumped Go to 1.25.9 and a range of dependencies (grpc, go-jose, cosign, go-git, cert-manager, containerd, helm, docker/cli, cloudflare/circl, moby/spdystream, sigstore/timestamp-authority, otel) for CVE remediation
- Bumped `uxp-apollo` to 0.4.9 and `uxp-webui` to 1.1.4

## v2.0.8-up.1

### Release Date: 2026-04-21

#### What's Changed

Based on Crossplane v2.0.8.

- Correctly handle dependency upgrades with `ImageConfig` prefix rewriting — packages installed via a prefix rewrite are now upgraded when their dependencies change
- Support `ResourceSelector` with no match field — a selector with only `apiVersion` and `kind` set is now interpreted as "all resources of that kind" instead of being rejected
- Bumped Go to 1.25.9 and a range of dependencies (grpc, go-jose, go-git, cert-manager, containerd, helm, docker/cli, cloudflare/circl, moby/spdystream, sigstore/timestamp-authority, otel) for CVE remediation
- Bumped `uxp-apollo` to 0.2.16

## v2.1.5-up.1

### Release Date: 2026-04-20

#### What's Changed

Based on Crossplane v2.1.5.

- Reset circuit breaker state on XR deletion
- Correctly handle dependency upgrades with `ImageConfig` prefix rewriting — packages installed via a prefix rewrite are now upgraded when their dependencies change
- Support `ResourceSelector` with no match field — a selector with only `apiVersion` and `kind` set is now interpreted as "all resources of that kind" instead of being rejected
- Bumped Go to 1.25.9 and a range of dependencies (grpc, go-git, go-jose, cert-manager, containerd, helm, docker/cli, cloudflare/circl, sigstore/timestamp-authority, otel) for CVE remediation
- Bumped `uxp-apollo` to 0.2.16 for a k8s.io/kubernetes CVE remediation

## v2.2.0-up.5

### Release Date: 2026-04-10

#### What's Changed

Based on Crossplane v2.2.0.

- Fixed internal version reporting that caused the `-up.x` suffix to be treated as a semver prerelease, which could cause package constraint checks (e.g. `>=v1.15.2`) to fail

## v2.2.0-up.4

### Release Date: 2026-04-08

#### What's Changed

Based on Crossplane v2.2.0.

- Added FunctionRunner payload size metrics
- Updated WebUI to v1.1.2

## v2.1.4-up.3

### Release Date: 2026-04-08

#### What's Changed
- Bumped Crossplane to v2.1.4-up.3
- Added FunctionRunner payload size metrics

## v2.2.0-up.3

### Breaking changes

UXP used to hardcode some crossplane core arguments in its helm chart. Now they are moved to helm values under `args`.
Those arguments were:
- `--enable-operations`
- `--package-runtime=External`

For most users nothing will change. But if you are setting different `args` in your installation of UXP, you would be overwriting the default values. In that case, if you want Operations and Add-ons to be available, add the arguments above to your list of `args`.

### Crossplane updates
* bumped Crossplane to [v2.2.0](https://github.com/crossplane/crossplane/releases/tag/v2.2.0)

### Features

* Added a new [Observability View in the WebUI](https://docs.upbound.io/manuals/uxp/concepts/observability-views/) showing dashboards with the state of the UXP installation and managed resources.
  * With a Standard license, a few more dashboards are being shown including initial metrics dashboards. Note that to support metrics, UXP installs (for Enterprise license only) a minimal Prometheus instance to collect needed metrics from UXP. This behavior can be controlled through Helm values under `upbound.prometheus`. If you have your own Prometheus installed, you disable the built-in one and redirect the WebUI to get metrics from your own through `webui.config.metricsApiEndpoint`
* Added a new [Secrets Proxy](https://docs.upbound.io/manuals/uxp/howtos/secrets-proxy/) capability that allows applications to continue using the standard Kubernetes Secrets API without any modifications, while seamlessly routing secret requests to an external secret store behind the scenes. A mutating webhook automatically injects a sidecar proxy into pods matching the criteria defined in the webhook configuration and secret requests will be forwarded to the [Secrets Proxy Add-on](https://marketplace.upbound.io/addons/upbound/secret-store-vault-addon/v0.1.1) service. To use this feature, apply an Enterprise license and install the Secrets Proxy add-on from the Upbound Marketplace.

## v2.1.0-up.2

#### What's Changed
- Bumped controller-manager chart to 0.1.0-rc.0.260.g46def90
- Bumped UXP to 2.1.0-up.1
- Updated controller-manager and apollo to latest versions
- Reverted controller-manager bump

## v2.0.7-up.3

#### What's Changed
- Added FunctionRunner payload size metrics
- Fixed promote workflow
- Fixed xpkg login in promote job
- Fixed marketplace username in promote job

## v2.0.2-up.5

#### What's Changed
- Bumped controller-manager to get metering API
- Bumped uxp-controller-manager for FIPS-140-3 and Go 1.25 fixes
- Bumped query API chart to 0.2.8
- Bumped controller-manager to 0.1.0-rc.0.257.g231312a

## v2.0.2-up.4

#### What's Changed
- Fixed UXP link to website
- Bumped controller-manager to get ClusterRoles
- Reverted UPBOUND_BOT_GITHUB_TOKEN requirement cleanup

## v2.0.2-up.3

#### What's Changed
- Bumped Web UI version to 1.0.0 for release
- Bumped uxp-apollo to 0.1.0
- Bumped UXP to v2.0.1-up.1
- Updated README documentation
- Fixed Helm devel flag notice in README
- Bumped UXP to v2.0.2-up.1
- Bumped controller-manager
- Cleaned up UPBOUND_BOT_GITHUB_TOKEN requirement
- Updated apollo to 0.1.1
- Updated docs link
- Mirrored OCI image to spaces-artifacts
- Bumped uxp-controller-manager to latest

## v2.0.0-rc.5

:::important
Pre-release version
:::

## v2.0.0-rc.4

:::important
Pre-release version
:::

#### What's Changed
- Bumped Web UI version with backup fixes
- Bumped Web UI version with visual tweaks
- Bumped UXP to v2.0.0-up.1.rc.1 (Crossplane v2.0.0-rc.1)
- Bumped Web UI version introducing addons

## v2.0.0-rc.3

:::important
Pre-release version
:::

#### What's Changed
- Packaged components as dependencies and subcharts
- Bumped controller-manager to latest
- Updated build submodule to crossplane/build and gitignore Helm chart dependencies
- Added Chart.lock to gitignore
- Bumped Crossplane to latest main
- Updated Web UI with license fixes
- Bumped upbound-controller-manager to version 0.1.0-rc.0.94.ge3b7735
- Applied controller manager and license changes
- Bumped apollo and webui to latest versions
- Bumped Crossplane to latest
- Moved dependencies from upbound-dev to upbound org
- Pushed OCI image to upbound/crossplane (image with v prefix, chart without)
- Updated apollo chart to 0.0.0-110.g5127447
- Added publishing to charts.upbound.io
- Published for main channel and cleaned up promote step
- Bumped uxp-controller-manager to version 0.1.0-rc.0.209.gfe6962e
- Specified bucket in us-west-2 for chart release
- Bumped Crossplane to v2.0.0-rc.0.302.g1c5774d68
- Avoided newlines in values
