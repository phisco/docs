---
title: Directory sync
sidebar_position: 8
description: Let Hub query your IdP for the groups and users that exist, so you can search for a subject instead of decoding a token.
---

:::note[Suggested reading]
Read the [Identity overview](overview.md) first for the `IdentityProvider`
resource, `userInfoPrefix`, and claim mappings. A directory is an optional
addition to a provider you already have working for login.
:::

Claims tell Hub *who* a caller is. A **directory** lets Hub ask the IdP what
groups and users exist. Then you can search for a subject when writing a role
binding instead of copying strings out of a decoded token.

A directory is a read-only discovery tool. It has no effect on an authenticated
request: a caller's username and groups always come from their JWT token, never
from the directory.

## Enable a directory

Add a `directory` block to the `IdentityProvider`. Hub queries the provider's own
API with credentials you supply:

```yaml
kind: IdentityProvider
spec:
  directory:
    groupClaimType: DirectoryID   # or DisplayName
    userClaimType: DirectoryID    # or Email
    config:
      apiVersion: directory.hub.upbound.io/v1alpha1
      kind: EntraConfiguration
      # ...provider-specific fields
```

Both claim types default to `DirectoryID` when omitted. Which values a given
provider accepts differs. See [Choosing a claim
type](#choosing-a-claim-type).

The `kind` selects the provider:

| `kind` | Queries | Authenticates with |
|--------|---------|--------------------|
| `EntraConfiguration` | Microsoft Graph | Client secret ([setup](entra-id.md#set-up-directory-access)) |
| `OktaConfiguration` | Okta Management API | Signed JWT assertion ([setup](okta.md#set-up-directory-access)) |
| `KeycloakConfiguration` | Keycloak Admin REST API | Client secret |

Directory credentials are write-only. Hub returns them as `***` on read. Send
`***` in a PUT request to keep the stored credentials, or send the new value
to replace them.

## Directory names are role binding subjects

The directory names every group and user `<userInfoPrefix><claim value>`, the
same string Hub uses to authenticate a real caller. Copy the name the
directory gives you straight into a role binding subject.

You tell Hub how to correlate the claim values from the JWT token with the
user and group fields the directory returns:

| Subject | Field | `DirectoryID` (default) | Alternative |
|---------|-------|-------------------------|-------------|
| User | `userClaimType` | The provider's internal user ID | `Email` (the user's email address) |
| Group | `groupClaimType` | The provider's internal group ID | `DisplayName` (the group's name) |

### Choosing a claim type

Pick the one that matches what your tokens carry, so the directory ends up
naming a subject by the same value the token does. Entra ID sends group object
IDs, so it wants `groupClaimType: DirectoryID`. Okta sends group names, so it
wants `DisplayName`. For users, follow whatever `claimMappings.username` maps:
`Email` if you mapped the `email` claim, `DirectoryID` if you left the username
on `sub`.

`DirectoryID` always resolves, at the cost of bindings that name opaque IDs.
`DisplayName` and `Email` make bindings readable, but only if the provider
populates that field. Hub can't resolve a group with no display name or a user
with no email, and which fields a directory populates depends on the provider.
The page for your provider, [Microsoft Entra
ID](entra-id.md#configure-the-directory) or
[Okta](okta.md#configure-the-directory), gives the combination that suits it.

Use immutable user and group names (`DirectoryID`) when you can, since role
bindings then stay stable. Mutable identifiers like email or display name work
differently. If a user's email changes from `alice@example.com` to
`alicia@example.com`, or the IdP renames a group from `backend-team` to
`store-api-team`, affected users lose access. They stay locked out until you
update every role binding that names the old value.

:::tip
A binding whose subject nobody resolves to is inert with no error. Run `kubectl auth
whoami` as a real caller (see [Verifying your
identity](verifying-your-identity.md)) and check the groups it reports against
the names the directory returns.
:::

## Query the directory

```http
GET /apis/authentication.hub.upbound.io/v1beta1/groups?identityProvider=<name>
GET /apis/authentication.hub.upbound.io/v1beta1/groups?identityProvider=<name>&displayNameQuery=<prefix>
GET /apis/authentication.hub.upbound.io/v1beta1/users?identityProvider=<name>&group=<group-resource-name>
```

Both endpoints require `identityProvider`. Listing users also requires
`group`. There's no "every user in the directory" query, only "members of
this group." Pass the group's full resource name, prefix included, as the
groups endpoint returned it.

`displayNameQuery` matches a prefix, not any part of the name, so query the
start of a group's name instead of a word in the middle. Hub caps how many
matches a single search considers, and it caches group results briefly.
Narrow a query that comes back without the group you expected. Give a group
you just created in the IdP a moment to show up.

## Related resources

- [Identity overview](overview.md): the `IdentityProvider` resource these
  blocks attach to.
- [Verifying your identity](verifying-your-identity.md): reading back the
  names a real caller resolves to.
- [Microsoft Entra ID](entra-id.md#set-up-directory-access) and
  [Okta](okta.md#set-up-directory-access): the two providers whose directory
  setup needs its own app registration.
- [Access management](../access-management/overview.md): writing the role
  bindings these names go into.
