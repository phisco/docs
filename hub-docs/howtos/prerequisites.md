---
title: Prerequisites
sidebar_position: 1
description: All requirements for installing and maintaining self-hosted Hub.
---

Before you start the process for installing a self-hosted version of the Hub,
this page helps you understand each of the necessary requirements.

<!-- vale write-good.Passive = NO -->
This pre-flight checklist is required before you move to the [installation]
step.
<!-- vale write-good.Passive = YES -->

## Cluster requirements

First, you need a Kubernetes cluster.

The cluster must:

- Run Kubernetes 1.29 or later. The chart relies on stable Gateway API
  CRDs and on Pod security primitives available in 1.29+. Earlier versions are
  not tested and may render templates that the API server rejects.
- Allow you `cluster-admin` access. The install creates a Namespace, ServiceAccounts,
  RBAC, Deployments, Services, Secrets, and (optionally) Gateway API resources.
  You can scope the install RBAC down after first install. See the chart's
  generated manifests for the bound roles.

:::note
Hub doesn't require any cluster-scoped operators beyond what you choose to use
for ingress, TLS, or Postgres. The chart installs into a single Namespace.
:::

<!-- vale Microsoft.HeadingAcronyms = NO -->
## Ingress and TLS
<!-- vale Microsoft.HeadingAcronyms = YES -->

Hub serves the API and UI services over HTTPS on operator-provided hostnames.
You can use any conformant controller for outside traffic to reach them.

<!-- vale Microsoft.Adverbs = NO -->
The chart can render Kubernetes Gateway API resources for you when you set
`global.gateway.enabled=true`. In that mode you point it at a pre-existing
`Gateway` (recommended) or have the chart create one. The chart never installs
the Gateway controller itself, so you must install that separately.
<!-- vale Microsoft.Adverbs = YES -->

You need:
<!-- vale Google.We = NO -->
<!-- vale write-good.TooWordy = NO -->
<!-- vale Google.WordList = NO -->
- **A Gateway controller or Ingress controller already installed in the
  cluster.** Any conformant option works (Envoy Gateway, Istio, Cilium, Contour,
  NGINX Ingress, and similar). The chart's Gateway API templates are agnostic,
  targeting whichever controller you nominate via
  `global.gateway.gatewayClassName` or via the `parentRef` of an existing
  `Gateway`.
- **A real TLS certificate** covering the hostnames you publish (see DNS below).
  [cert-manager][cert-manager] configured against an ACME issuer
  (Let's Encrypt, ZeroSSL, an internal ACME server) is the common pattern. You
  can also terminate TLS upstream (at an AWS load balancer using ACM, or at a
  cloud provider's Gateway) and leave
  `global.gateway.listeners.https.tls.certificateRefs` empty.
- **A LoadBalancer or external Service IP** that your DNS records can point at.
  The chart doesn't manage external IP allocation.
<!-- vale Google.We = YES -->
<!-- vale write-good.TooWordy = YES -->
<!-- vale Google.WordList = YES -->

For Gateway API documentation, see the upstream [Gateway API
project][gateway-api-project].
<!-- vale Google.Headings = NO -->
## DNS
<!-- vale Google.Headings = YES -->
<!-- vale write-good.Passive = NO -->
Hub is designed to span multiple subdomains, but can optionally be served from a
single domain. The defaults the chart composes are `<subdomain>.<your-domain>`
for each. You control the apex domain, and the subdomain prefixes are
configurable.
<!-- vale write-good.Passive = YES -->

| Default Hostname | Serves |
|--------------------|--------|
| `api.<your-domain>` | `hub-core` HTTP API |
| `ui.<your-domain>` | `hub-webui` browser UI |

Substitute `<your-domain>` with the apex domain you control (such as
`hub.example.com`, giving you `api.hub.example.com` and `ui.hub.example.com`).
The subdomain prefixes default to `api` and `ui`. Override them per service via
`global.gateway.subdomains.*` if your conventions differ.

For each hostname you publish, you need:

- A DNS A or CNAME record pointing at the external IP, hostname, or load
  balancer fronting your Gateway / Ingress.
- TLS certificate coverage. A single wildcard certificate (`*.<your-domain>`) is
  the simplest. Per-host certificates also work.

<!-- vale write-good.Weasel = NO -->
The hostname you choose for `hub-core` is the value you set as
`hub-core.api.externalURL` at install time. `hub-core` uses it to construct the
OIDC callback URI it registers with your provider. The value must be
reachable from end-user browsers exactly as configured.
<!-- vale write-good.Weasel = YES -->

<!-- vale Google.Headings = NO -->
## External PostgreSQL
<!-- vale Google.Headings = YES -->

Hub stores all resource state in PostgreSQL. Provision the database before
install. The chart only consumes a connection for an existing PostgreSQL
instance, and will not deploy PostgreSQL.

You need a PostgreSQL 18 (or later) instance reachable from the cluster, with a
dedicated database and a role Hub can use. [The databases
overview][overview] and the provider sub-guides it links to cover
the version, required extensions, authentication modes, TLS settings, and
per-cloud provisioning steps. That page is the source of truth.

## External OIDC Provider

Hub doesn't include its own identity provider in the self-hosted path.
Configure Hub against an OIDC-compliant provider you already operate or
subscribe to.

The provider needs OIDC discovery, plus `email` and group claims. It also has to
accept a redirect URI Hub computes from your `hub-core` hostname. Common
providers (Amazon Cognito, Microsoft Entra ID, Google Workspace, Okta, Auth0,
Keycloak) all qualify. The full contract, the staged setup order, and the
per-provider walkthroughs are on [the OIDC overview][oidc-configuration]. That
page is the source of truth.

## Next step

With every requirement above understood, set up each dependency before you
install. Start with your identity provider:

- [OIDC configuration][oidc-configuration]. The provider contract and
  per-provider setup.
- [Databases][overview]. Postgres requirements and provisioning.

Once your provider and database are ready, [install Hub][installation].

[cert-manager]: https://cert-manager.io/
[cert-manager-docs]: https://cert-manager.io/docs/
[gateway-api-project]: https://gateway-api.sigs.k8s.io/
[installation]: /hub/howtos/install
[oidc-configuration]: /hub/howtos/oidc-configuration
[overview]: /hub/howtos/databases/overview
