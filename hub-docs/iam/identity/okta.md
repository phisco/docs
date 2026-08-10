---
title: Okta
sidebar_position: 5
description: Configure Okta as an IdentityProvider for OIDC login and directory group discovery.
---

:::note[Suggested reading]
Read the [Identity overview](overview.md) first to understand the
`IdentityProvider` resource, `userInfoPrefix`, and claim mappings.
:::

Configure an Okta organization as a Hub identity provider, either for OIDC
login alone or with [directory sync](directory-sync.md)
through the Okta Management API. Okta is standards-compliant once you attach a
groups claim to the authorization server.

## Prerequisites

- An Okta org and admin access to it.
- The base URL of your Okta org (`https://<org>.okta.com` or a custom
  domain).
- For directory access, `hub-core` needs network access to that org URL.

## Set up the login app

1. **App integration.** In the Okta admin console, go to **Applications >
   Create App Integration** and choose **OIDC (OpenID Connect)** with
   application type **Web Application**.
2. **Redirect URI.** Set the sign-in redirect URI to
   `https://<hub-url>/oidc/callback`.
3. **Grant types.** Enable **Authorization Code**.
4. **Credentials.** Record the client ID and client secret from the
   application's General tab.
5. **Groups claim.** Under **Security > API > Authorization Servers**, select
   your authorization server (usually `default`) and open the **Claims** tab.
   Add a claim:
   - **Name:** `groups`
   - **Include in token type:** ID Token, Always
   - **Value type:** Groups
   - **Filter:** Regex `.*` (or a narrower pattern scoping which Okta groups
     Hub sees).
6. **Assign users.** Assign the application to the users and groups you want
   to allow into Hub.

## Configure OIDC login

```yaml
apiVersion: authentication.hub.upbound.io/v1beta1
kind: IdentityProvider
metadata:
  name: okta
spec:
  redirect:
    browserLogin: true
    clientSecret: "<client-secret>"
    scopes:
      - openid
      - email
      - profile
  validation:
    userInfoPrefix: "okta:"
    issuer:
      # The default authorization server URL.
      url: https://<org>.okta.com/oauth2/default
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

Role bindings reference users as `okta:<email>` and groups as
`okta:<group-name>`.

If you use a custom authorization server other than `default`, replace
`/oauth2/default` in the issuer URL with `/oauth2/<auth-server-id>` and make
sure the groups claim exists there too. Take the value from the authorization
server's discovery document at `<issuer>/.well-known/openid-configuration`,
and copy it verbatim.

## Set up directory access

Skip this section if you only need login. Directory queries use a
**separate** app from the one above. Okta only mints Management API tokens
for a service app that authenticates with a signed JWT assertion, so a
client secret isn't enough.

1. **Service app.** Go to **Applications > Create App Integration** and choose
   **API Services**.
2. **Key pair.** On the app's General tab, set client authentication to
   **Public key / Private key** and add a key. Let Okta generate one and copy
   the PEM private key. Okta shows it only once. Note the key ID if you
   register more than one key.
3. **Scopes.** On the **Okta API Scopes** tab, grant `okta.groups.read` and
   `okta.users.read`.
4. **Admin role.** If your org requires an admin role for API service apps,
   assign a read-only one.

Hub accepts RSA and ECDSA P-256 keys in PEM (PKCS#8, PKCS#1, or SEC1). If you
enable **Require Demonstrating Proof of Possession (DPoP)** on the app, Hub
handles the proofs and nonce challenges itself. You don't need to configure
anything extra.

## Configure the directory

Add a `directory` block alongside the login configuration:

```yaml
spec:
  # ...redirect and validation as above
  directory:
    # Okta tokens carry group names, not IDs. See below.
    groupClaimType: DisplayName
    userClaimType: Email
    config:
      apiVersion: directory.hub.upbound.io/v1alpha1
      kind: OktaConfiguration
      orgURL: https://<org>.okta.com
      clientID: "<service-app-client-id>"
      privateKey: |
        -----BEGIN PRIVATE KEY-----
        <PEM contents>
        -----END PRIVATE KEY-----
      privateKeyID: "<key-id>"
```

| Field | Required | Description |
|-------|----------|-------------|
| `orgURL` | yes | Okta org base URL. Must be an absolute `https://` URL. |
| `clientID` | yes | Client ID of the API Services app, not the login app. |
| `privateKey` | yes | PEM private key that signs the client assertion. Read back as `***`. |
| `privateKeyID` | no | The key's `kid`. Required when the app has more than one key registered. |

The groups claim you configured on the authorization server emits group
**names**, so `groupClaimType: DisplayName` is what makes directory groups and
signed-in users resolve to the same string. With `userInfoPrefix: "okta:"`,
both come out as `okta:<group-name>`. See [directory names are role binding
subjects](directory-sync.md#directory-names-are-role-binding-subjects).

Group search is a prefix match on the group's Okta name. Member lists carry
each user's email and display name, falling back to first and last name when
the profile has no display name set.

## Verify

```bash
# Search groups by name prefix.
curl -H "Authorization: Bearer $HUB_TOKEN" \
  "$HUB_URL/apis/authentication.hub.upbound.io/v1beta1/groups?identityProvider=okta&displayNameQuery=platform"

# List members, using a group name from the response above.
curl -H "Authorization: Bearer $HUB_TOKEN" \
  "$HUB_URL/apis/authentication.hub.upbound.io/v1beta1/users?identityProvider=okta&group=okta:platform-eng"
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `cannot authenticate to Okta` | Okta rejected the client assertion. | Check `orgURL` and `clientID`, confirm you registered the public key on the service app, and set `privateKeyID` if the app has several keys. |
| `cannot parse okta private key` | Unsupported key encoding. | Use a PEM-encoded RSA or ECDSA P-256 key. |
| `403` from the Management API | Scopes not granted. | Grant `okta.groups.read` and `okta.users.read` on the **Okta API Scopes** tab, and assign an admin role if your org requires one. |
| `directory not configured` | No `directory` block on the `IdentityProvider`. | Add one. |
| Search returns nothing | `displayNameQuery` matches on a prefix. | Query the start of the group name, not a word in the middle. |
| Role bindings never apply | `groupClaimType` disagrees with the token. | Use `DisplayName` for Okta, so directory groups and token groups carry the same value. |
| A group is missing from a broad search | Hub caps the matches a single query considers. | Narrow the query so the group falls inside the match set. |

## Next step

With the provider registered, decide what its identities may do: [Access
management](../access-management/overview.md) covers binding the prefixed
usernames and groups above to Hub roles.
