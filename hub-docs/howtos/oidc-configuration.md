---
title: OIDC configuration
sidebar_position: 3
description: Configure Hub against an external OIDC provider.
---

Hub delegates all human authentication to an external OIDC provider. The
provider issues ID tokens to users logging in to the Hub UI. Hub trusts those
tokens and reads identity and group claims to drive authorization.

## What Hub requires from your OIDC provider

Any [OIDC-compliant][oidc-compliant] provider that meets the
following criteria works with Hub:
<!-- vale Google.WordList = NO -->
- **OIDC discovery.** The provider publishes a
  `.well-known/openid-configuration` document at a stable issuer URL. Hub
  fetches this document at startup to learn the authorization, token, and JWKS
  endpoints.
- **Authorization code flow.** Hub uses the redirect-based authorization code
  flow for browser sign-in. You register Hub as a client (sometimes called an
  "application" or "app registration") and receive a client ID and client
  secret.
- **Email claim.** The ID token must include an `email` claim and an
  `email_verified` claim. Hub uses the email as the canonical username and
  rejects logins where `email_verified` isn't `true`.
- **Group claim.** The ID token must include a claim that lists the user's group
  memberships. The claim name is configurable through `groupsClaim`. The default
  is `groups`. Group values are what you bind to Hub roles to grant privileges
  within the system.
- **Redirect URI.** The provider must accept Hub's callback URL as a registered
  redirect URI. The callback is always `<externalURL>/oidc/callback`, where
  `<externalURL>` is the public base URL of `hub-core` (set through
  `hub-core.api.externalURL`).
<!-- vale Google.WordList = YES -->

:::note
If your provider emits groups under a non-standard claim name, see
[Provider-specific configuration](#provider-specific-configuration) for the
Hub-side deviation. Entra ID emits `groups` only when explicitly configured, and
Google Workspace doesn't emit groups in the ID token at all.
:::

## Choosing how to configure the provider

`sampleEmailBasedOIDCConfig` is a convenience layer over the `IdentityProvider`
resource. It generates a single provider, uses email as the username, and reads
groups from one claim. Most deployments need nothing else, and the rest of this
page assumes it.

Write the `IdentityProvider` yourself when you need any of:

- **More than one provider.** The sample block generates a single one.
- **A username that isn't the email claim**, or a CEL expression that builds it.
- **Directory search.** `spec.directory` backs the groups and users APIs, so
  administrators can search the provider's directory instead of typing each
  group name verbatim. The sample block omits it.
- **Validation beyond `email_verified` and `allowedDomain`**, through
  `claimValidationRules` or `userValidationRules`.
- **Issuer plumbing.** A private CA bundle, an in-cluster `backendIssuerURL`,
  inline JWKS, or more than one audience.

Supply your own provider in one of two ways:

- **`hub-core.bootstrap.files`.** Declarative, and travels with the Helm
  release. Hub applies the bootstrap directory at startup and again every five
  minutes, so these files stay the source of truth: each pass reverts changes
  anyone makes to the same resource through the API. Name your file
  `oidc-idp.yaml` to replace the generated one, or use any other name to add a
  provider alongside it.
- **The `identityproviders` endpoints.** Change providers at runtime without a
  redeploy. Use this only for providers that no bootstrap file defines, since
  the next pass over the bootstrap directory overwrites those. See
  [Replacing the browser-login provider](#replacing-the-browser-login-provider)
  for the lockout risk this path carries.

One field to decide up front either way: `userInfoPrefix` is immutable. Changing
it later means deleting and recreating the provider, which orphans every role
binding that references the old prefix.

## Setup order

Configure OIDC in three stages, in this order. Skipping ahead leaves you
debugging across systems that can't yet see each other.

### 1. Provider-side

Done in your OIDC provider's console or API, before touching Hub.

- Create the users and groups you want to grant access to. At minimum, create
  the group you plan to bind to the Hub `org-admin` role.
- Configure the provider to emit group memberships in the ID token under a claim
  you control. Note the claim name.
- Register Hub as a client application. Record the client ID and client secret.
- Configure the redirect URI as `<externalURL>/oidc/callback`. You must know the
  public hostname of `hub-core` before this step.
- Look up the well-known discovery URL (the issuer URL) for the provider. This
  is the value you give to Hub.

### 2. Hub-side

Record the values below once your provider is configured. You don't write any
`values.yaml` on this page. [The install guide][install] owns that file, and you
paste these values into it in step 4.
<!-- vale write-good.Passive = NO -->
<!-- vale write-good.Weasel = NO -->
- `hub-core.api.externalURL`. The public base URL of `hub-core`. The redirect URI
  you registered in stage 1 must match this exactly.
- The OIDC values under `hub-core.api.sampleEmailBasedOIDCConfig`:
  - `providerName`. A short identifier used as a prefix on usernames and group
    names (such as `entra`, `google`, `cognito`). Defaults to `oidc`.
  - `issuerURL`. The issuer URL from stage 1.
  - `clientID`. The client ID from stage 1.
  - `clientSecret`. The client secret from stage 1. Don't commit this to
    `values.yaml`. The install guide passes it on the `helm install` command
    line, and for production you supply it through your secret management
    workflow.
  - `allowedDomain`. Optional. If set, Hub rejects logins whose email doesn't
    end in `@<allowedDomain>`.
  - `groupsClaim`. The token claim carrying group membership. Defaults to
    `groups`. Set it to your provider's claim name if it differs (Cognito uses
    `cognito:groups`), or to `""` to omit the mapping, which leaves only
    per-user email bindings working.
- The first administrators, for `hub-core.bootstrap.admins`. Each entry is a
  `kind` and `name` pair, where `kind` is `Group` or `User` and `name` carries
  the `<providerName>:` prefix. Hub renders both an `OrganizationRoleBinding`
  bound to `org-admin` and a `RealmRoleBinding` bound to `realm-admin` on the
  `default` realm from this one list:

  ```yaml
  hub-core:
    bootstrap:
      admins:
        - kind: Group
          name: "oidc:platform-admins"
        - kind: User
          name: "oidc:alice@example.com"
  ```

  Group names come from the `groupsClaim` value, prefixed with
  `<providerName>:`. User names are the user's email, prefixed the same way.
  With Entra ID emitting group object IDs, the subject is
  `<providerName>:<group-object-id>`.

:::warning
Without at least one entry in `hub-core.bootstrap.admins`, the first user to log
in has no permissions and no way to grant themselves any. Set it before the
first install.
:::
<!-- vale write-good.Weasel  = YES -->
<!-- vale write-good.Passive = YES -->

### 3. End-user login

Done from the browser, after you install the chart. [The install
guide][install] covers this step in place, once the values above are in
`values.yaml`.

- Navigate to the Hub UI at the URL you configured.
- Sign in. The provider authenticates you and redirects back to Hub.
- Confirm Hub recognizes your identity and group memberships. A user in
  `hub-core.bootstrap.admins` sees the full UI. A user without any bound group
  sees an empty workspace.

## Provider-specific configuration

Register the Hub application in your provider following that provider's own
documentation. Hub needs no special setup beyond a confidential
authorization-code client with the `openid`, `email`, and `profile` scopes and
the redirect URI from [Setup Order](#setup-order).

Once the application exists, the only Hub-side settings that differ between
providers are the `issuerURL` and how group memberships reach the ID token.
Every other value from stage 2 stays the same. The deviations for each provider
are below. The YAML fragments in this section show only the keys that deviate.
Merge them into the OIDC block in step 4 of [the install guide][install].

### Standards-compliant providers

Providers that emit a `groups` claim out of the box (Keycloak, Auth0, Okta,
Dex, and similar) need no deviation.

- `issuerURL`: the `issuer` value published in the provider's
  `.well-known/openid-configuration`.
- Groups: emitted by default under the claim name `groups`. No override needed.

The values you recorded in stage 2 need no changes.

<!-- vale Google.Headings = NO -->
### Amazon Cognito
<!-- vale Google.Headings = YES -->

See the [Amazon Cognito Developer Guide][amazon-cognito-developer-guide]
for user pool and app client setup.
<!-- vale write-good.Passive = NO -->
- `issuerURL`: `https://cognito-idp.<region>.amazonaws.com/<user-pool-id>`.
- Groups: membership is published under `cognito:groups`, not `groups`. Point
  `groupsClaim` at it:
<!-- vale write-good.Passive = YES -->

  ```yaml
  hub-core:
    api:
      sampleEmailBasedOIDCConfig:
        providerName: cognito
        groupsClaim: "cognito:groups"
  ```

  With `providerName: cognito`, a Cognito group `admin` becomes the Hub subject
  `cognito:admin`.

<!-- vale Google.Headings = NO -->
### Microsoft Entra ID
<!-- vale Google.Headings = YES -->

See [Register an application with Microsoft Entra ID][register-an-application-with-microsoft-entra-id].
<!-- vale write-good.Passive = NO -->
- `issuerURL`: `https://login.microsoftonline.com/<tenant-id>/v2.0`. The `/v2.0`
  suffix is required, since Hub expects the v2.0 token format.
- Groups: the `groups` claim is omitted unless you add a groups optional
  claim under the app registration's **Token configuration**. Emit **Group ID**,
  so groups arrive as object IDs (UUIDs); bind role bindings to
  `<providerName>:<group-object-id>`. Once emitted, the claim is named `groups`,
  so no claim-mapping override is needed. Users belonging to more than ~150
  groups exceed the token overage limit and receive no `groups` claim at all.
  Prefer narrow security groups dedicated to Hub.
<!-- vale write-good.Passive = YES -->

<!-- vale Google.Headings = NO -->
### Google Workspace
<!-- vale Google.Headings = YES -->

See [Setting up OAuth 2.0][setting-up-oauth-2-0] for
OAuth client setup.

- `issuerURL`: `https://accounts.google.com` (fixed).
- Groups: group membership from Workspace never appears in the ID token.
  Choose one of:
  - **Bind to users.** Set `groupsClaim: ""` and list each administrator as a
    `User` in `hub-core.bootstrap.admins`, using their email with the
    `<providerName>:` prefix (`google:alice@example.com`).
  - **Custom claim.** Inject a groups claim upstream (Cloud Identity custom
    attribute or an identity broker), then point `groupsClaim` at that claim
    name.

## Replacing the browser-login provider

A single provider drives the browser redirect login at any time. A unique index
in the database enforces it: Hub rejects `spec.redirect.browserLogin` on a
second provider while the first holds it, and refuses to delete the provider
that holds it.

:::note
Moving browser login from one provider to another in a single step is a roadmap
item for a future release. Until then, follow the sequence below.
:::

Two details make this more than a flag swap:

- `userInfoPrefix` is immutable and prefixes every username and group value, so
  role bindings written against the old provider (`old:admins`) don't match the
  new one (`new:admins`).
- No provider drives browser login between clearing the flag and setting it, so
  new sign-ins fail for that window. Sessions already issued keep working until
  you delete the old provider.

To migrate:

1. Create the new provider with `browserLogin` unset. Choose a `providerName`
   where neither prefix starts with the other. `okta` and `entra` coexist;
   `oidc` and `oidc2` collide.
2. Duplicate your role bindings under the new prefix. An
   `OrganizationRoleBinding` on `old:admins` needs a counterpart on
   `new:admins`. Leave the old bindings alone for now.
3. Clear `browserLogin` on the old provider.
4. Set `browserLogin` on the new provider. Browser login works again here.
5. Sign in through the new provider and confirm your group memberships resolve.
6. Delete the old provider, then the role bindings that referenced its prefix.

:::warning
Apply step 3 and step 4 as separate changes, in that order. Hub walks the
bootstrap directory in filename order and stops at the first error, so a single
upgrade carrying both edits can reach the new provider first and reject it while
the old one still holds the flag.
:::

A provider that exists only in the database has no safety net. Changing its
`issuerURL` locks out everyone it authenticates, and nothing restores the old
value. Role bindings survive by name, so recreating the provider with the same
`userInfoPrefix` restores access, but that takes a working login. Define
anything you depend on for administrator access in `bootstrap.files`, where the
five-minute reconcile repairs it.

## Values to record

Carry these into step 4 of [the install guide][install]:

| Value | Where it came from |
| --- | --- |
| `externalURL` | The public base URL of `hub-core` |
| `providerName` | Your choice of prefix, defaulting to `oidc` |
| `issuerURL` | Stage 1, adjusted per your provider above |
| `clientID` | Stage 1 |
| Client secret | Stage 1. Passed on the command line, not committed |
| `allowedDomain` | Optional email-domain restriction |
| `groupsClaim` | Only if your provider deviates from `groups` |
| Admin groups or users | Stage 2, prefixed with `<providerName>:` |

## Next step

With your provider configured, set up the database Hub stores its state in:

- [Databases][overview]. Postgres requirements and per-provider
  provisioning.

Once your database is ready, [install Hub][install].

[amazon-cognito-developer-guide]: https://docs.aws.amazon.com/cognito/latest/developerguide/
[install]: /hub/howtos/install
[oidc-compliant]: https://openid.net/connect/
[overview]: /hub/howtos/databases/overview
[register-an-application-with-microsoft-entra-id]: https://learn.microsoft.com/entra/identity-platform/quickstart-register-app
[setting-up-oauth-2-0]: https://support.google.com/cloud/answer/6158849
