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
subscribe to. Any provider works that offers a stable issuer URL publishing
`.well-known/openid-configuration`, the authorization code flow, and a claim
carrying group membership. Microsoft Entra ID, Amazon Cognito, Google Workspace,
Keycloak, and Okta all qualify.

[Upbound Identity][identity] is the source of truth for how Hub turns provider
tokens into Hub identities, and its per-provider pages carry the
app-registration steps and group-claim quirks for each one. Have a provider
registered and its issuer URL, client ID, client secret, and group claim
recorded before you install; [Installing Hub][installation] turns those into
Helm values.

The redirect URI Hub expects is `https://api.<your-domain>/oidc/callback`,
derived from the `hub-core` hostname you settled on under [DNS](#dns).

## Next step

With every requirement above understood, set up each dependency before you
install:

- [Upbound Identity][identity]. Register your provider and record its values.
- [Databases][overview]. Postgres requirements and provisioning.

Once your provider and database are ready, [install Hub][installation].

[cert-manager]: https://cert-manager.io/
[gateway-api-project]: https://gateway-api.sigs.k8s.io/
[identity]: /hub/iam/identity/overview
[installation]: /hub/howtos/install
[overview]: /hub/howtos/databases/overview
