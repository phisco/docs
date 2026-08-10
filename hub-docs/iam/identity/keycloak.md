---
title: Keycloak
sidebar_position: 3
description: Configure Keycloak as an IdentityProvider for Hub.
---

:::note[Suggested reading]
Read the [Identity overview](overview.md) first to understand the
`IdentityProvider` resource, `userInfoPrefix`, and claim mappings.
:::

Configure a Keycloak realm as a Hub identity provider. Keycloak is
standards-compliant out of the box: it emits a `groups` claim once you enable
the group mapper, so you don't need claim-mapping overrides.

## Prerequisites

- A Keycloak realm.
- Admin access to the realm to add a client and configure protocol mappers.

## Provider-side setup

1. **Client.** In the Keycloak admin console, create a new confidential
   client for Hub. Set:
   - **Client authentication:** on.
   - **Standard flow (authorization code):** enabled.
   - **Valid redirect URIs:** `https://<hub-url>/oidc/callback`.
   - Record the client ID and client secret (Credentials tab).
2. **Groups mapper.** Under the client's **Client scopes** → dedicated scope
   → **Add mapper > By configured type > Group Membership**:
   - **Token Claim Name:** `groups`.
   - **Full group path:** off (unless you want paths like `/eng/backend`).
   - **Add to ID token:** on.
   - **Add to access token:** on.
   - **Add to userinfo:** on.

## `IdentityProvider` resource

```yaml
apiVersion: authentication.hub.upbound.io/v1beta1
kind: IdentityProvider
metadata:
  name: keycloak
spec:
  redirect:
    browserLogin: true
    clientSecret: "<client-secret>"
    scopes:
      - openid
      - email
      - profile
  validation:
    userInfoPrefix: "keycloak:"
    issuer:
      # Take from the realm's .well-known/openid-configuration issuer field.
      url: https://sso.example.com/realms/<realm-name>
      audiences:
        - <client-id>
    claimMappings:
      username:
        claim: email
      groups:
        claim: groups
    claimValidationRules:
      - expression: "claims.email_verified == true"
        message: "email must be verified"
```

Role bindings then reference groups as `keycloak:<group-name>` and users as
`keycloak:<email>`.

## Notes

- Take the `issuer.url` value from the realm's discovery document at
  `https://sso.example.com/realms/<realm-name>/.well-known/openid-configuration`.
  It must match the `issuer` field there.
- If your Keycloak deployment uses a self-signed or private CA, add the CA
  certificate under `spec.validation.issuer.certificateAuthority` (PEM).

## Next step

With the provider registered, decide what its identities may do: [Access
management](../access-management/overview.md) covers binding the prefixed
usernames and groups above to Hub roles.
