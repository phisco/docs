---
title: Microsoft Entra ID
sidebar_position: 4
description: Configure Microsoft Entra ID (Azure AD) as an IdentityProvider for OIDC login and directory group discovery.
---

:::note[Suggested reading]
Read the [Identity overview](overview.md) first to understand the
`IdentityProvider` resource, `userInfoPrefix`, and claim mappings.
:::

Configure Microsoft Entra ID (formerly Azure AD) as a Hub identity provider,
either for OIDC login alone or with [directory
sync](directory-sync.md) through Microsoft Graph.

## Prerequisites

- An Entra ID tenant with an app registration.
- Admin access to grant API permissions and admin consent.
- `hub-core` with network access to `login.microsoftonline.com` and
  `graph.microsoft.com`, or the matching sovereign-cloud endpoints.

## Set up the app registration

In the Azure Portal, go to **Entra ID > App registrations** and either create a
new registration or select an existing one. Record:

| Value | Where to find it |
|-------|-----------------|
| **Tenant ID** | Overview → Directory (tenant) ID |
| **Client ID** | Overview → Application (client) ID |
| **Client Secret** | `Certificates & secrets` → `New client secret` |

Under **Authentication > Platform configurations**, add a **Web** platform with
your Hub deployment's redirect URI, `https://<hub-url>/oidc/callback`.

Then, under **Token configuration > Add groups claim**, choose which group
types to include (usually Security groups) and emit **Group ID** so groups
arrive as object IDs. Without this, tokens carry no `groups` claim at all.

:::warning[Group overage]
A user in more than 200 groups exceeds what Entra ID puts in a JWT. It
responds by dropping the `groups` claim entirely and substituting
`_claim_names` and `_claim_sources` pointers, which Hub doesn't follow, so
those users sign in with no groups, and no group-based role binding applies to
them. Scope the groups emitted to Hub narrowly enough to stay under the limit,
or bind those affected users individually instead. A directory doesn't help
here, since Hub uses it only to search Graph, not as a source of a caller's
groups. See
[ID token claims reference](https://learn.microsoft.com/entra/identity-platform/id-token-claims-reference#groups-overage-claim).
:::

## Configure OIDC login

```yaml
apiVersion: authentication.hub.upbound.io/v1beta1
kind: IdentityProvider
metadata:
  name: entra
spec:
  redirect:
    browserLogin: true
    clientSecret: "<client-secret>"
    scopes:
      - openid
      - email
      - profile
  validation:
    userInfoPrefix: "entra:"
    issuer:
      # The /v2.0 suffix is required; Hub expects the v2.0 token format.
      url: https://login.microsoftonline.com/<tenant-id>/v2.0
      audiences:
        - <client-id>
    claimMappings:
      username:
        claim: preferred_username
      groups:
        claim: groups
```

`preferred_username` carries the user principal name, typically the email
address. Use `email` instead if you'd rather depend on the `email` scope, or
`sub` (the object ID) when the user principal name may change under you, at
the cost of unreadable usernames in role bindings. In v2.0 tokens `oid`
equals `sub`. Prefer `sub`.

## Set up directory access

Skip this if you only need login. Directory queries reuse the same app
registration, but need application permissions of their own. Under **API
permissions**, add these as **Application** permissions, not Delegated:

| Permission | Purpose |
|-----------|---------|
| `Group.Read.All` | Search and list groups |
| `GroupMember.Read.All` | List group members |

Click **Grant admin consent for `<tenant>`** afterward. Hub authenticates with
the client credentials grant, which has no user context. Application
permissions with admin consent are the only thing that works.

## Configure the directory

Add a `directory` block alongside the login configuration:

```yaml
spec:
  # ...redirect and validation as above
  directory:
    # Entra tokens carry group object IDs, see below.
    groupClaimType: DirectoryID
    userClaimType: DirectoryID
    config:
      apiVersion: directory.hub.upbound.io/v1alpha1
      kind: EntraConfiguration
      tenantID: "<tenant-id>"
      clientID: "<client-id>"
      clientSecret: "<client-secret>"
```

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `tenantID` | yes | None | Entra tenant ID (UUID). |
| `clientID` | yes | None | Application (client) ID. |
| `clientSecret` | yes | None | Client secret. Read back as `***`. Send `***` on PUT to keep it, or a new value to rotate. |
| `graphURL` | no | `https://graph.microsoft.com` | Microsoft Graph base URL. Override for sovereign clouds. |
| `loginURL` | no | `https://login.microsoftonline.com` | Entra login endpoint. Override for sovereign clouds. |

Entra's `groups` claim contains object IDs, not display names, so
`groupClaimType: DirectoryID` is what makes directory groups and signed-in
users resolve to the same string. That's also why, with
`userInfoPrefix: "entra:"`, role bindings name groups as `entra:<object-id>`.
Switching to `DisplayName`
also means emitting display names in the token, under **Token configuration >
Add groups claim > Customize token properties**. See [directory names are role
binding subjects](directory-sync.md#directory-names-are-role-binding-subjects).

Group search is a `startswith` prefix match on the display name. Member lists
include only users. Nested groups and service principals don't appear.

### Sovereign clouds

For Azure Government, Azure China, or another national cloud, set both URLs on
the `EntraConfiguration`. The OAuth2 token scope follows `graphURL`
automatically.

| Cloud | `graphURL` | `loginURL` |
|-------|-----------|-----------|
| Public (default) | `https://graph.microsoft.com` | `https://login.microsoftonline.com` |
| US Government (GCC High) | `https://graph.microsoft.us` | `https://login.microsoftonline.us` |
| China (21Vianet) | `https://microsoftgraph.chinacloudapi.cn` | `https://login.chinacloudapi.cn` |

## Verify

```bash
# Search groups by display-name prefix.
curl -H "Authorization: Bearer $HUB_TOKEN" \
  "$HUB_URL/apis/authentication.hub.upbound.io/v1beta1/groups?identityProvider=entra&displayNameQuery=Engineering"

# List members, using a group name from the response above.
curl -H "Authorization: Bearer $HUB_TOKEN" \
  "$HUB_URL/apis/authentication.hub.upbound.io/v1beta1/users?identityProvider=entra&group=entra:03f0c91a-2408-4647-8d6e-f5dddbf00c58"
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `cannot authenticate to Entra ID` | Client credentials rejected. | Verify the tenant ID, client ID, and client secret, and confirm the app registration lives in that tenant. |
| `graph API returned 403` | Missing permissions. | Add `Group.Read.All` and `GroupMember.Read.All` as **Application** permissions and grant admin consent. |
| `directory not configured` | No `directory` block on the `IdentityProvider`. | Add one. |
| Search returns nothing | `displayNameQuery` matches on a prefix. | Query the start of the display name, not a word in the middle. |
| Fewer members than expected | The API returns only users. | Hub excludes nested groups and service principals by design. Flatten the group, or list the nested one separately. |
| A group is missing from a broad search | Hub caps the matches a single query considers. | Narrow the query so the group falls inside the match set. |
| A signed-in user has no groups | No groups claim configured, or Entra dropped it because the user belongs to too many groups. | Configure the groups claim on the app registration, and keep the groups emitted to Hub under Entra's overage limit. A directory doesn't supply groups to a request. |

## Next step

With the provider registered, decide what its identities may do: [Access
management](../access-management/overview.md) covers binding the prefixed
usernames and groups above to Hub roles.
