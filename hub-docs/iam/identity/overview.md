---
title: Upbound Identity
sidebar_position: 1
description: How Hub authenticates humans, machines, and control plane workloads.
---

Upbound Identity is how the Hub knows *who* is calling any of its APIs. Every
request to Hub includes a bearer token. Identity turns the claims in that
token into a Hub identity that authorization can then reason about.

This page is the concepts entry point. If you want to deploy your first
identity provider end-to-end, see [Installing Hub](../../howtos/install.md),
which walks through the provider registration and the Helm values it
produces. If you want to authorize what each identity can do, see [Access
management](../access-management/overview.md). Identity is a prerequisite for
that page.

<!-- vale Google.Headings = NO -->
## What Hub identifies
<!-- vale Google.Headings = YES -->

Hub recognizes three kinds of callers:

- **Human users.** Authenticated through an OIDC identity provider you
  register. After signing in with your IdP (Entra ID, Google Workspace,
  Keycloak, Okta, Amazon Cognito, or any OIDC-compliant issuer),
  humans carry a Hub-issued bearer token whose username and group claims come
  from that IdP.
- **OIDC workload identities.** CI jobs, scripts, and agents that already hold
  an OIDC token from a trusted IdP, like a GitHub Actions job, a GitLab CI
  pipeline, or a cloud workload-identity-federated service. They trade that
  token for a Hub one through [token exchange](#how-tokens-reach-hub) and get
  a Hub identity the same way a human does.
- **Control plane workloads.** Every control plane connected to Hub has its
  own credentials and Hub identity. A Kubernetes
  ServiceAccount inside a managed control plane calls Hub as itself, not as
  whoever deployed it.

Role bindings can target human identities and OIDC or control plane workload
identities directly. See [Workload
identities](../access-management/workload-identities.md).

<!-- vale write-good.Passive = NO -->
Once a request is authenticated, Hub knows three things about the caller: a
**username**, a list of **groups**, and a set of **extras** (provider-supplied
attributes like the verified email address). All three are visible through
the `SelfSubjectReview` endpoint or `kubectl auth whoami` (see [Verifying your
identity](verifying-your-identity.md)).
<!-- vale write-good.Passive = YES -->

<!-- vale Google.Headings = NO -->
## How tokens reach Hub
<!-- vale Google.Headings = YES -->

<!-- vale write-good.TooWordy = NO -->
You can get a Hub bearer token through any of the flows below. Each gives you
a JWT that Hub signs. Every subsequent authorization decision is identical no
matter which flow you use.
<!-- vale write-good.TooWordy = YES -->


<!-- vale Upbound.Spelling = NO -->
| Flow | Used by | What happens |
|------|---------|--------------|
| **OIDC browser redirect** | Humans logging into the Hub UI | Click **Log in** and Hub directs you to your IdP. After you authenticate, Hub sets a session cookie. Refresh is automatic while the IdP session is alive. |
| **Device authorization grant** | CLIs and terminal-only clients | The CLI asks Hub for a user code and prints a short code plus a URL. You approve in a browser, and the CLI receives a Hub access token plus a long-lived refresh token. See [CLI and AI agent login](cli-agent-login.md). |
| **Token exchange** | Machines that already hold an IdP token | The client POSTs its IdP-issued JWT to Hub's token exchange endpoint (RFC 8693). Hub validates the token against the registered IdP and returns a Hub access token. Used by CI/CD systems and any service integrated with SSO. |
<!-- vale Upbound.Spelling = YES -->

You never send an IdP token directly to Hub's data APIs. You always trade it
for a Hub token first, either explicitly (token exchange) or implicitly
(the browser redirect does it for you behind the cookie).

## The `IdentityProvider` resource

An `IdentityProvider` resource represents each OIDC issuer you trust, in
the `authentication.hub.upbound.io` API group. It holds both the OAuth2
redirect parameters for the login flow and the token-validation rules Hub
applies to every bearer token, chiefly `userInfoPrefix`, which namespaces
every username and group the provider contributes, and `claimMappings`, which
choose the claims those values come from.

See [Configure an IdentityProvider](identityprovider.md) for the full resource,
the fields you can't change later, and what browser login does end to end.
Complete worked examples live under [Sample identity
providers](identityprovider.md#sample-identity-providers): [Amazon
Cognito](amazon-cognito.md), [Google Workspace](google-workspace.md),
[Keycloak](keycloak.md), [Microsoft Entra ID](entra-id.md), and
[Okta](okta.md).

## Logging in

Different access methods require different login paths and each path receives a
Hub-issued JWT. Every authorization decision downstream is identical regardless
of how you got it.

| What's calling | How it logs in |
|----------------|----------------|
| The Hub UI in a browser | Hub redirects you to whichever `IdentityProvider` sets `redirect.browserLogin: true`, then sets a session cookie when the provider sends you back. |
| `kubectl` against the Hub API | [Configure kubectl](../../howtos/configure-kubectl.md) |
| A human principal through CLI, `curl`, or an AI agent | [CLI and AI agent login](cli-agent-login.md) |
| A CI job, a pipeline, or a ServiceAccount | [Workload identities](workload-identities.md) |

:::note
Browser login needs one provider holding `browserLogin: true`. If none
does, the UI shows an error. If you're moving the flag between providers, see
[Multiple providers](multiple-providers.md).
:::

## Verifying your identity

The settings above decide what Hub resolves a caller to. Read the result back
rather than deriving it. Role bindings match on exact strings, and a subject
name that's off by one character grants nothing:

```console
$ kubectl auth whoami
ATTRIBUTE   VALUE
Username    entra:alice@example.com
Groups      [entra:platform-eng system:authenticated]
```

That posts a `SelfSubjectReview`, which also returns the provider, issuer, and
other attributes Hub derived while minting the token. See [Verifying your
identity](verifying-your-identity.md).

## Directory sync

JWT claims tell Hub who a user is. Directory Sync lets Hub discover groups and
users in your IdP, so it can auto-complete the list of subjects when you set
permissions in the UI. It's a discovery aid only. An authenticated caller's
username and groups still come from their token.

Add a `directory` block to an `IdentityProvider` to enable it. See [Directory
sync](directory-sync.md).

## Token lifecycle

Hub tokens are short-lived, so most of what keeps a session usable happens
behind the scenes between requests. This section covers what refreshes
automatically, what takes effect without a new token, and what doesn't.

- **Hub refreshes your session against the IdP.** At login Hub asks your
  provider for an OIDC refresh token (`access_type=offline` with
  `prompt=consent`, so providers that only issue one on first authorization
  still return it) and stores it server-side on the session row. It never
  reaches the browser, which holds only an opaque session cookie. Once the
  cached ID token expires, Hub exchanges that refresh token at the provider's
  token endpoint for a fresh ID token, re-derives your identity from it, and
  updates the session, rotating the stored refresh token whenever the provider
  returns a replacement. See [Revocation and session
  lifetime](#revocation-and-session-lifetime) for what happens when the IdP
  refuses that exchange.
- **Role-binding changes apply immediately.** Hub resolves role bindings from
  the database on every request, so granting or revoking an
  `OrganizationRoleBinding` or `RealmRoleBinding` takes effect on the caller's
  next request. They don't need a new token.
- **Identity changes need a new token.** The username and groups Hub matches
  bindings against travel *inside* the token. Changing a user's group membership
  in your IdP has no effect until they get a fresh Hub token.
- **A server-side record backs CLI sessions.** A device-flow refresh
  token is only usable while Hub still holds the matching session record, so a
  refresh token copied off a client's disk is inert on its own.

## Revocation and session lifetime

Hub has no session lifetime of its own to configure. A credential that has to
stay valid at your identity provider anchors every browser and CLI session.
That leaves the IdP authoritative over how long someone can keep using Hub.

The chain is short:

1. A caller's Hub token is short-lived. When it expires, the client mints
   another one from its session rather than signing in again.
2. Minting one requires the session's cached ID token to still be valid. When
   it isn't, Hub redeems the stored refresh token at the IdP's token endpoint
   and re-derives the caller's identity from the ID token it gets back.
3. If the IdP refuses that exchange (the user's session expired, an
   administrator ended it or turned off the account, or the IdP revoked the
   refresh token), Hub deletes the session row. The next attempt fails with
   `login_required`, and Hub sends the caller back through login.

Ending someone's session at your IdP ends it in Hub too, with no action on
the Hub side. The remaining lifetime of the cached ID token bounds the
window between the two, and ID token lifetime is IdP configuration.

**Your IdP owns the audit trail.** Hub keeps a session alive by redeeming
refresh tokens instead of issuing a long-lived credential of its own, so
every extension of a session is a request to the IdP's token endpoint. That
means the IdP's own logs show how long each person was actually active in
Hub, not just when they first signed in.

**You pick the trade-off.** A short ID token lifetime shortens the worst-case
delay before Hub forces out a revoked user and produces a finer-grained record
of activity, at the cost of more traffic between Hub and the IdP. A longer one
does the reverse. You don't need to change any settings in the Hub to control
the lifetime. Set the ID
token lifetime on the provider to whatever balance you want.

### Ending a session immediately

Waiting for the next refresh isn't the only option:

- **Logging out.** `/oidc/logout` deletes the session, clears both Hub cookies,
  and redirects through the IdP's `end_session_endpoint` (when it advertises
  one) so the IdP clears its own SSO cookies too.
- **Deleting the session server-side.** Removing the session row invalidates
  the browser cookie and any CLI refresh token pointing at it, regardless of
  whether the IdP credential behind it's still good.

:::note
Hub tokens already issued stay valid until they expire. Deleting a session
blocks new ones, but it doesn't recall the ones already in flight. Their
lifetime is the upper bound on that window. Hub also doesn't yet expose an API
for listing or revoking sessions. Doing it before the next refresh is an
operator-side database operation today.
:::

## Related resources

**How-to guides**

- [Installing Hub](../../howtos/install.md): register a provider and turn its
  values into a running `IdentityProvider`.
- [Multiple providers](multiple-providers.md): uniqueness rules and moving
  browser login between providers.
- [Workload identities](workload-identities.md): how CI jobs and
  ServiceAccounts get a Hub identity and a token.
- [Configure kubectl](../../howtos/configure-kubectl.md) and [CLI and AI agent
  login](cli-agent-login.md): the two human-facing login paths.

**Feature pages**

- [Access management](../access-management/overview.md): bind roles to the
  identities defined here.

**Reference**

- [Feature flags](../../reference/feature-flags.md)
- [Feature lifecycle](../../reference/feature-releases.md)
