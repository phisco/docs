---
title: Package Policies
sidebar_position: 100
description: The Upbound Official package policies.
---

<!-- vale Google.Headings = NO -->
<!-- vale Microsoft.HeadingAcronyms = NO -->
<!-- vale Google.Will = NO -->
<!-- vale gitlab.FutureTense = NO -->
<!-- vale write-good.Passive = NO -->
<!-- vale gitlab.SentenceLength = NO -->
<!-- vale alex.Condescending = NO -->

:::note
**Policy version:** `1.0.0`  
**Effective date:** `14 October 2025`  
:::

This document outlines how Upbound manages, maintains, and supports its Official and Partner packages. Whether you're a community member or an Upbound customer, understanding these policies will help you make informed decisions about package versions and support options.

The following policies govern how you can access, receive support for, and understand the maintenance lifecycle of Upbound Official and Partner packages.

## Scope and Definitions

| Topic                                    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UXP                                      | Upbound Crossplane, or UXP, is Upbound's enterprise distribution of Crossplane which is 100% compatible with OSS Crossplane. You can switch from OSS Crossplane to UXP. [Read more about UXP](/manuals/uxp/overview/).                                                                                                                                                                                                                                                       |
| Upstream vs Downstream                   | **Upstream**: public repositories under `github.com/crossplane-contrib` and main releases published to `xpkg.crossplane.io`. [Browse packages](https://github.com/orgs/crossplane-contrib/packages); all source code changes land here first.<br/> **Downstream**: private repositories under `github.com/upbound` that mirror upstream and produce downstream main and backport releases published to `xpkg.upbound.io`. [Browse packages](https://marketplace.upbound.io). |
| Main vs Backport releases                | **Main**: regular releases from the `main` branch.<br/>**Backport**: patch-only releases from release maintenance branches for a specific minor version; contains cherry-picked fixes only, no new features.                                                                                                                                                                                                                                                                 |
| Community, Official and Partner packages | **Community**: built, maintained and supported by members of the Crossplane community.<br/>**Official**: built, maintained and supported by Upbound.<br/>**Partner**: built and supported jointly by Upbound and the partner; Upbound verifies that the package meets its quality bar.                                                                                                                                                                                       |
| Compatibility                            | Compatibility refers to the runtime the package targets.<br/>**OSS Crossplane**: supports providers, functions and configuration packages by default.<br/>**UXP**: supports all default packages in OSS Crossplane and other package types (for example, Add-ons) that aren't available for OSS Crossplane.                                                                                                                                                                  |
| Availability Window                      | The duration that a release remains pullable from the xpkg.upbound.io registry.<br/>**Main releases**: available for 12 months from the release date. <br/>**Backport releases**: available for 18 months from the release date.                                                                                                                                                                                                                                             |
| Availability vs Support                  | **Availability**: how long a release remains pullable from the registry (12 months for main releases, 18 months for backport releases). **Support**: the duration Upbound provides active support for a release (12 months from the minor version release date). A package may be available after its support window has ended.                                                                                                                                              |
| SBOM                                     | A software bill of materials (SBOM) lists all the software components and their versions used in the published package. Upstream main releases are unsigned and have no SBOM. All downstream releases published to xpkg.upbound.io are signed and include an SBOM.                                                                                                                                                                                                           |
| FIPS                                     | FIPS-compatible artifacts are available for all Upbound Official and Partner packages and require a Business Critical subscription.                                                                                                                                                                                                                                                                                                                                                    |

## At a Glance

- As the original creator of the Crossplane project, Upbound is committed to the long-term health and success of the Crossplane community.
- All OSS Crossplane-compatible packages maintained by Upbound are available to the community under an open source license.
- Upbound publishes packages to both the Crossplane and Upbound registries.
- Official package main releases are available at no cost to all community members.
- Backport releases of past minor versions require paid subscriptions to support extra maintenance costs.
- FIPS-compatible artifact (packages and UXP) versions are available with a Business Critical subscription.

### Which Package Versions Can You Access

- **No subscription?** You can pull all main releases published within the last 12 months.
- **Standard, Enterprise, or Business Critical subscription?** You can pull all main and backport releases (with configured pull secrets for backports).
- **Need FIPS-compatible packages?** Requires a Business Critical subscription.

## Source Code and License

All Upbound authored packages for Crossplane are open source, and the source code is made available under the [Apache 2.0 license](https://www.apache.org/licenses/LICENSE-2.0) regardless of where the source code is located.

Where a package is available to run in OSS Crossplane (for example, providers, functions, and configurations), the source code for these packages is located in the `crossplane-contrib` organization on GitHub and is subject to the [governance](https://github.com/crossplane/crossplane/blob/main/GOVERNANCE.md) of the Crossplane project.

UXP-only packages (for example, Add-ons) are located in the Upbound organization on GitHub.

:::note
All existing OSS Crossplane compatible packages that are currently in the `upbound` organization in GitHub are being migrated to `crossplane-contrib` in due time.
:::

## Official and Partner packages

Upbound builds, maintains, and supports Official packages. Upbound and technology partners jointly build, maintain, and support Partner packages.

Upbound prefers Partner packages when a capable partner exists. Upbound will publish packages as Official when no partner exists or when it's required to meet customer demand, quality, or coverage needs.

Official and Partner packages are subject to Upbound's CVE remediation SLA and support entitlements for eligible customers.

## Compatibility policy

Packages can target one or both Crossplane runtimes:

- Providers, Functions, and Configurations all run on OSS Crossplane or UXP.
- Add-ons and other UXP-only features are available on UXP only.

Where runtime-specific behavior exists, it will be called out in the package documentation and release notes.

## Maintenance, backports and distribution

Understanding how packages flow from development to distribution helps you plan your package management strategy. This section explains how packages are maintained, when backport releases are produced, and where packages are distributed.

### Change flow

- All feature, bug fix, and security work lands in the upstream repository (`crossplane-contrib`) on `main` first and is published to `xpkg.crossplane.io` in alignment with the Crossplane governance policies.
- Downstream mirrors in `github.com/upbound` sync from upstream `main` and produce downstream 'main' releases.
- Bug fix and security work is backported to the downstream release maintenance branches; these branches only exist downstream and don't flow back to upstream. See the [Requesting a fix or backport](#requesting-a-fix-or-backport) section below.

### Backport eligibility

Upbound creates backports when all the following criteria are met:

- The fix addresses a security issue, critical regression, or data-loss risk.
- The change is low risk and scoped (can be cherry-picked) to a specific issue.
- The change doesn't introduce new features, new APIs, or breaking schema or behavioral changes.

Backports aren't used for feature delivery, refactors, or non-critical improvements. Those ship in the next main release.

By default, Upbound backports security fixes to minor releases that were published within the last 6 months. Customers can request a backport to an older, still-supported version.

### Branching and versioning

- Each supported minor release has a maintenance branch, for example `release-X.Y`.
- Backport releases increment only the patch version within that minor line (for example, `X.Y.Z → X.Y.(Z+1)`).
- Maintenance branches accept cherry-picked fixes only; no new features or API surface area.

### Distribution

- Downstream releases of packages compatible with OSS Crossplane are runnable on all Crossplane runtimes (see the [Access and Support](#access-and-support) section).
- Downstream releases are distributed through the [Upbound Marketplace](https://marketplace.upbound.io).
- Downstream main releases are publicly accessible; backport releases require a [Standard+ subscription][pricing-page] and [configured pull secrets][configured-pull-secrets].

### Signing, SBOM, and FIPS

- All downstream releases (main and backport) are signed and include an SBOM.
- Upstream main releases aren't signed and don't include an SBOM.
- FIPS-compatible artifacts are available for all Upbound Official and Partner packages and require an Upbound [Business Critical subscription][pricing-page].

### Requesting a fix or backport

- Upbound customers with [Standard+ subscriptions][pricing-page] can [open a ticket][open-a-ticket] to request a fix and evaluation for creating a backport for a supported release.
- Users without a subscription should file an issue upstream. Fixes ship in a future main release.

:::note
Backports are cautious and patch-only by design. If a safe, targeted fix isn't possible, the change will ship in the next main release instead. For information about how long backport releases remain available, see the [Availability window](#availability-window) section.
:::

## Access and Support

Your Upbound plan subscription level determines the level of access to the versions of each Official package in the
Marketplace.

### Users without a subscription

**Access**: Anyone without an Upbound subscription, including anonymous Crossplane
community members without an account, can access all main releases of a package
within the availability window.  
**Support**: Support is limited to help from the community in the Crossplane community Slack workspace or issues in the upstream repository.

### Standard, Enterprise, and Business Critical subscribers

**Access**: If your organization has a `Standard`, `Enterprise`, or `Business Critical` subscription to Upbound, you can access all available versions within the availability window, including backport releases (backports require configured pull secrets).  
**Support**: Upbound supports Official and Partner packages for 12 months from the release date of the minor version. A minor release version may receive patch releases for up to 12 months after its first release.

:::note
Availability is distinct from Support. Support is provided for 12 months from the release date of a package's minor version. After the Support window ends, artifacts may remain available per the Availability window (for example, backport patch releases).

Upbound customers with an [Enterprise+][pricing-page] subscription can [open a ticket][open-a-ticket] to request support.
:::

:::important
To access backport releases, make sure you've
[configured pull secrets][configured-pull-secrets].
:::

## Availability window

Availability defines how long a release remains pullable in registries and is distinct from Support:

- **Main releases**: available for `12 months` from the release date. **Exception:** The most recent main release will remain available indefinitely, even after its 12-month window expires, until a newer version is published.
- **Backport releases**: available for `18 months` from the release date.

If a main version is found to have a significant security issue, it will be marked or withdrawn as appropriate.

:::important
The availability window is intentionally limited to help ensure you stay up to date with the latest fixes and remain protected from security vulnerabilities.
:::

### Example Timeline

If a package version `v1.5.0` is released on January 1, 2025:

- **Main release**: Available until December 31, 2025 (12 months)
- **Backport release v1.5.1**: If released on March 1, 2025, it remains available until August 31, 2026 (18 months from its release date)

## Publishing

Understanding the different types of releases and how they're published helps you make informed decisions about which package versions to use. Packages have two relevant version numbers:

- Package release version, for example, `provider-aws:v2.1.0`
- Custom Resource Definition (_CRD_) API version, for example `v1beta1`

### Release types

- **Upstream main release**: produced from the upstream `main` branch in `crossplane-contrib`.
- **Downstream main release**: produced from the downstream `main` mirror in `upbound`.
- **Downstream backport release**: produced from a downstream release maintenance branch (patch-only); see "Maintenance, backports and distribution" section.

### Release cadence

- **Upstream main** releases are subject to the Crossplane governance policies and would at least follow the core Crossplane project release schedule.
- The **Upstream main** release cadence may vary by package and a faster release cadence is subject to the package repository maintainers.
  - **Upbound Official** and **Partner** packages target monthly main branch releases if there are new features available.
  - **Upbound Official** and **Partner** packages that are generated with Upjet and leverage Terraform providers are upgraded to the latest version of the Terraform provider every 2 months.
- **Downstream main** releases ship at the same time as the upstream main release.
- **Downstream backport** releases are produced as needed based on eligibility and customer impact.

:::tip
Upbound customers with a [Standard+ subscription][pricing-page] may submit a support request to fast-track a release cadence.
:::

### Testing and release quality gating

- **Upstream main release**: unit and basic integration testing.
- **Downstream (main and backport)**: extended test matrix and validation on Upbound-managed cloud provider accounts; CVE validation to ensure the package is free from CVEs. Releases are gated on these validation steps passing.

### Publish summary matrix
<div class="helm-table">



| Release type        | Crossplane runtime  | Source                     | Distribution         | Signed | SBOM | FIPS-compatible<br/>packages available<br/>(Business Critical) | Availability window | Subscription<br/>required | Requires<br/>pull secrets | Cadence                               | Testing/quality gating                       |
| ------------------- | ------------------- | -------------------------- | -------------------- | ------ | ---- | -------------------------------------------------------- | ------------------- | ------------------------- | ------------------------- | ------------------------------------- | -------------------------------------------- |
| Upstream main       | OSS Crossplane, UXP | `crossplane-contrib/`      | `xpkg.crossplane.io` | No     | No   | No                                                       | Unlimited           | None                      | No                        | Follows Crossplane schedule or faster | Unit + basic integration                     |
| Downstream main     | OSS Crossplane, UXP | `upbound` (private mirror) | `xpkg.upbound.io`    | Yes    | Yes  | Yes                                                      | 12 months           | None                      | No                        | Ships with upstream main              | Extended matrix; cloud validation; CVE-gated |
| Downstream backport | OSS Crossplane, UXP | `upbound` (private mirror) | `xpkg.upbound.io`    | Yes    | Yes  | Yes                                                      | 18 months           | [Standard+][pricing-page] | Yes                       | As needed (eligibility-based)         | Extended matrix; cloud validation; CVE-gated |


</div>

## Package versions

Understanding how package versions work helps you plan upgrades and understand compatibility expectations. Upbound Official and Partner package versions follow the
[semantic versioning (_semver_)][semantic-versioning-semver] standard of `<major>`.`<minor>`.`<patch>` numbering.

#### Major version change

Major version number changes are typically reserved for indicating breaking schema or behavior changes in packages.

For providers, when the `major` version of the underlying Terraform provider (if generated with Upjet)
or Upjet runtime changes, then the provider's `major` version increments. Major version updates reset the `minor` and `patch` to zero.

<!-- vale Microsoft.Contractions = NO -->
<!-- vale write-good.TooWordy = NO -->

:::important
A change in the `major` version number doesn't come with a backward compatibility guarantee and users should evaluate and verify it in non-production environments before upgrading.
:::

The release notes will indicate all breaking changes introduced and provide instructions on adapting to them.

<!-- vale write-good.TooWordy = YES -->
<!-- vale Microsoft.Contractions = YES -->

#### Minor version

The `minor` version number increases when new features, such as new capabilities, resources, or fields, are introduced.
This update resets the `patch` number to zero and may also include bug fixes.

#### Patch version

A `patch` version increases for releases with **only** bug fixes and **no** new features.

### CRD API versions

When CRDs are contained in an Official package, they follow the standard Kubernetes API versioning and deprecation policy.

- `v1alpha1` - CRDs at the `v1alpha1` version haven't yet passed through Upbound's quality assurance process. These CRDs
  are for testing and experimentation and aren't intended for production deployment.
- `v1beta1` - This identifies a qualified and tested CRD under common use cases. Upbound attempts to ensure a stable CRD
  API but may require breaking changes in future versions. `v1beta1` CRDs may be missing endpoints or settings related
  to the provider resource.
- `v1beta2` - Like `v1beta1`, all `v1beta2` CRDs are fully qualified and tested. `v1beta2` CRDs contain more
  features or breaking changes from the `v1beta1` API.
- `v1` - CRDs that reach a `v1` API version have fully defined APIs. Upbound won't make breaking API changes to `v1` CRDs in the
  current `major` version of the provider.

## Compatibility

Understanding compatibility rules helps you plan upgrades and avoid unexpected issues.

### Upgrading

A release that increments the `minor` or `patch` version is backward compatible with the prior release.

<!-- vale write-good.TooWordy = NO -->

Backward compatibility promises that the Crossplane-managed resource APIs,
configurations, and infrastructure aren't impacted when upgrading to a new version with
a higher `minor` or `patch` version number and the same `major`
version number. For example, upgrading from `v1.2.3` to `v1.2.4` or `v1.3.0`
should work without any needed changes.

<!-- vale write-good.TooWordy = YES -->

You can skip `minor` or `patch` releases and upgrade to the latest release within the same `major` version,
such as upgrading from `v1.2.3` to `v1.2.7` or `v1.5.0`.

:::important
Despite the commitment to backward compatibility, you should **always**
simulate upgrades in a non-production
environment before applying to production.
:::

### Downgrading

<!-- vale Microsoft.Contractions = NO -->

Backward compatibility **is not** guaranteed when downgrading to a prior version.

<!-- vale Microsoft.Contractions = YES -->

Downgrading to a previous version may require manual intervention to ensure the package and the resources remain in a
synced/healthy state. In some scenarios, it might be necessary to uninstall the package and reinstall the older desired
version.

:::important
You should **always** simulate downgrades in a non-production environment before
applying to production.
:::

:::tip
Upbound customers with support entitlements should
consult their assigned Solutions Architect or reach out to Upbound Support before a production downgrade.
:::

### Family provider version compatibility

The `major`, `minor` and `patch` versions of all the family providers are updated in unison regardless of whether a
specific provider in the family has changes or not.

A family of providers, like [provider-family-aws][provider-family-aws],
is published with all the providers in the family using the same version number. Using providers from the same family
with different version numbers is technically possible, but this could introduce incompatibility in some situations. Due
to the large number of combinations, testing all compatibility permutations between different family provider versions
isn't possible.

Upbound **strongly recommends** that the family providers are all kept on the same version.

The following constraints apply to ensure version compatibility:

- All family providers must be on the **same** `major` version.
- All family providers must be on the **same or prior** `minor` version as the
  family's configuration provider (for example, the `provider-aws-family` provider).

Examples:

<!-- vale alex.Ablist = NO -->

- Technically valid combination: `provider-family-aws:v1.1.0`, `provider-aws-s3:v1.1.1`, `provider-aws-ec2:v1.0.1`
- Invalid combination: `provider-family-aws:v1.1.0`, `provider-aws-s3:v1.0.0`, `provider-aws-ec2:v0.46.0`
- Invalid combination: `provider-family-aws:v1.0.0`, `provider-aws-s3:v1.0.1`, `provider-aws-ec2:v1.1.0`

<!-- vale alex.Ablist = YES -->

## CVEs

Security is a top priority for Upbound. Upbound actively monitors and addresses security vulnerabilities in its packages. Upbound will make reasonable commercial effort to ensure its Official packages are free
from [Common Vulnerabilities and Exposures][common-vulnerabilities-and-exposures] (CVEs) under the following
conditions:

- Upbound's vulnerability scanners identify a CVE affecting a package
- The CVE is independently fixable of any other bugs. For a CVE to be fixable, either there is
  - an upstream release version available which has been verified to fix the CVE, or
  - an affected provider package can be rebuilt with updated compilers and/or libraries to remediate that CVE.

Upbound will address each CVE meeting this criteria based on its severity score, according to the [Common
Vulnerability Scoring System version 3][common-vulnerability-scoring-system-version-3], as follows:

- **Critical Severity**: Within 7 calendar days from the date an upstream fix is publicly available.
- **High, Medium, and Low severity**: Within 14 calendar days from the date an upstream fix is publicly available.
- **Unknown severity**: Within 30 calendar days from the date an upstream fix is publicly available.

A CVE will be considered addressed when a new version of the provider with the fix is released to the Marketplace.

<!-- vale Google.Headings = YES -->
<!-- vale Microsoft.HeadingAcronyms = YES -->
<!-- vale Google.Will = YES -->
<!-- vale gitlab.FutureTense = YES -->
<!-- vale write-good.Passive = YES -->
<!-- vale gitlab.SentenceLength = YES -->
<!-- vale alex.Condescending = NO -->

[configured-pull-secrets]: /manuals/packages/providers/pull-secrets
[open-a-ticket]: /reference/usage/support
[upbound-marketplace]: https://marketplace.upbound.io/providers?tier=official
[semantic-versioning-semver]: https://semver.org/
[provider-family-aws]: https://marketplace.upbound.io/providers/upbound/provider-family-aws
[common-vulnerabilities-and-exposures]: https://nvd.nist.gov/general/cve-process
[common-vulnerability-scoring-system-version-3]: https://nvd.nist.gov/vuln-metrics/cvss
[pricing-page]: https://www.upbound.io/pricing
