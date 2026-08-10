---
title: Google Workspace
sidebar_position: 2
description: Configure Google Workspace as an IdentityProvider for Hub.
---

:::note[Suggested reading]
Read the [Identity overview](overview.md) first to understand the
`IdentityProvider` resource, `userInfoPrefix`, and claim mappings.
:::

Configure Google Workspace as a Hub identity provider. Google is OIDC-
compliant for login but doesn't emit group membership in the ID token.
That means you either bind roles to individual users by email, or inject a
`groups` claim upstream (via Cloud Identity or an identity broker).

## Prerequisites

- A Google Workspace tenant and admin access to a Google Cloud project.
- An OAuth 2.0 client in the Google Cloud Console. See [Setting up OAuth
  2.0][setting-up-oauth-2-0].

## Provider-side setup

1. Create an **OAuth 2.0 Client ID** of type **Web application** in the
   Google Cloud Console under **APIs and Services → Credentials**.
2. Add `https://<hub-url>/oidc/callback` to **Authorized redirect URIs**.
3. Record the client ID and client secret.

Google's ID token doesn't include group memberships. Choose one of:

- **Bind to users.** Skip groups and bind roles to individual users by their
  email address. Works for a handful of admins but doesn't scale further.
- **Custom claim.** Inject a `groups` claim from an upstream source (Cloud
  Identity custom attributes or an identity broker fronting Google), then map
  it under `claimMappings.groups`.

## `IdentityProvider` resource

### User bindings only

```yaml
apiVersion: authentication.hub.upbound.io/v1beta1
kind: IdentityProvider
metadata:
  name: google
spec:
  redirect:
    browserLogin: true
    clientSecret: "<client-secret>"
    scopes:
      - openid
      - email
      - profile
  validation:
    userInfoPrefix: "google:"
    issuer:
      url: https://accounts.google.com
      audiences:
        - <client-id>
    claimMappings:
      username:
        claim: email
    claimValidationRules:
      - expression: "claims.email_verified == true"
        message: "email must be verified"
```

Role bindings then target users by email:
`google:alice@example.com`.

### With custom groups claim

If an upstream broker (or a directly configured custom claim) injects
`groups` into the ID token, add the `groups` mapping:

```yaml
spec:
  validation:
    userInfoPrefix: "google:"
    issuer:
      url: https://accounts.google.com
      audiences:
        - <client-id>
    claimMappings:
      username:
        claim: email
      groups:
        claim: groups
```

## Notes

- The issuer URL is always `https://accounts.google.com`. Hub reads discovery
  at `https://accounts.google.com/.well-known/openid-configuration`.
- Google's ID tokens always carry the `email_verified` claim. Keep the
  `claimValidationRules` requirement above to reject unverified accounts.

## Next step

With the provider registered, decide what its identities may do: [Access
management](../access-management/overview.md) covers binding the prefixed
usernames and groups above to Hub roles.

[setting-up-oauth-2-0]: https://support.google.com/cloud/answer/6158849
