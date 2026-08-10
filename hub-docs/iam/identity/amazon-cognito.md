---
title: Amazon Cognito
sidebar_position: 1
description: Configure Amazon Cognito as an IdentityProvider for Hub.
---

:::note[Suggested reading]
Read the [Identity overview](overview.md) first to understand the
`IdentityProvider` resource, `userInfoPrefix`, and claim mappings.
:::

Configure an Amazon Cognito user pool as a Hub identity provider. Cognito is
OIDC-compliant apart from one quirk: it emits group memberships under
`cognito:groups`, not `groups`.

## Prerequisites

- An Amazon Cognito user pool. See the [Amazon Cognito Developer
  Guide][amazon-cognito-developer-guide].
- An app client on the user pool with the OIDC authorization code flow
  enabled and the redirect URI set to
  `https://<hub-url>/oidc/callback`.

## Provider-side setup

1. **User pool.** In the AWS Console, create or select a user pool. Record
   the pool ID (`us-east-1_XXXXXXXXX`) and the region.
2. **App client.** Add an app client to the pool with:
   - Client credentials generated (record the client ID and client secret).
   - The `openid`, `email`, and `profile` scopes enabled.
   - Callback URL set to `https://<hub-url>/oidc/callback`.
   - Authorization code grant enabled.
3. **Groups.** Create the user pool groups you want to bind to Hub roles.
   Every group value emitted by Cognito arrives under the `cognito:groups`
   claim.

## `IdentityProvider` resource

```yaml
apiVersion: authentication.hub.upbound.io/v1beta1
kind: IdentityProvider
metadata:
  name: cognito
spec:
  redirect:
    browserLogin: true
    clientSecret: "<client-secret>"
    scopes:
      - openid
      - email
      - profile
  validation:
    userInfoPrefix: "cognito:"
    issuer:
      url: https://cognito-idp.<region>.amazonaws.com/<user-pool-id>
      audiences:
        - <client-id>
    claimMappings:
      username:
        claim: email
      groups:
        # Cognito emits group membership under this non-standard claim name.
        claim: "cognito:groups"
```

With `userInfoPrefix: cognito:`, a Cognito group `admin` becomes the Hub
group `cognito:admin`. Role bindings reference groups as
`cognito:<group-name>`.

## Notes

- The issuer URL follows the pattern
  `https://cognito-idp.<region>.amazonaws.com/<user-pool-id>` (no path suffix
  beyond the pool ID). Hub reads the discovery document at
  `<issuer>/.well-known/openid-configuration`.
- What gates whether `email` reaches the token has nothing to do with
  verification status. The `email` scope grants the `email` and
  `email_verified` claims together, and you can only request it alongside
  `openid`. The app client's **attribute read permissions** also matter: an ID
  token only carries claims for attributes the app client may read. A new app
  client can read every attribute by default, so this usually bites only after
  someone narrows the list.
- Verification doesn't decide whether `email` appears. `email_verified`
  reports it as a separate claim. An unverified address still arrives, with
  `email_verified` set to `false`.
- **Grant read access to `email_verified`, not just `email`.** Hub's generated
  provider includes a validation rule requiring `claims.email_verified ==
  true`, so an app client that can read `email` but not `email_verified`
  rejects every login with `email must be verified`, including users with a
  verified email address. If sign-in fails that way for everyone, check the
  read permissions before touching the user records.
- If tokens arrive with no `email` claim at all, add a rule requiring
  `has(claims.email)` so the failure names itself instead of surfacing as an
  empty username:

  ```yaml
  claimValidationRules:
    - expression: "has(claims.email)"
      message: "cognito returned no email claim: check the email scope and the app client's attribute read permissions"
  ```

## Next step

With the provider registered, decide what its identities may do: [Access
management](../access-management/overview.md) covers binding these prefixed
usernames and groups to Hub roles.

[amazon-cognito-developer-guide]: https://docs.aws.amazon.com/cognito/latest/developerguide/
