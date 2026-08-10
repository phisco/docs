---
title: Multiple providers
sidebar_position: 3
description: Register more than one IdentityProvider and move browser login between them.
---

:::note[Suggested reading]
Read the [Identity overview](overview.md) first for the `IdentityProvider`
resource, `userInfoPrefix`, and claim mappings. This page covers what changes
once you register more than one.
:::

You can register any number of `IdentityProvider` resources. Hub accepts
every provider's tokens at the token-exchange endpoint, so adding another
provider is the usual way to admit CI and workload identities alongside your
human IdP. Only one provider drives the browser-redirect login
(`redirect.browserLogin: true`).

## Uniqueness rules across providers

Hub enforces three rules whenever you create or update a provider. It checks
each rule against every other registered provider, so the error you get names
the one you collided with.

- **One browser-login provider.** Hub rejects `redirect.browserLogin: true`
  on a provider if another provider already holds it.
- **Issuer URLs must be unique.** Providers can't share a
  `validation.issuer.url`. If you need two audiences against one issuer, add
  both to `issuer.audiences` on a single provider rather than creating a
  second one.
- **Prefixes can't overlap.** Hub rejects a `userInfoPrefix` that's a leading
  prefix of an existing provider's, or that an existing one is a leading
  prefix of. Ending every prefix with a separator sidesteps this entirely:
  `corp:` and `corp-eu:` coexist, but the separator-less `corp` and `corp-eu`
  collide.

Hub also refuses to delete the provider driving browser login. Clear the flag
first, then delete.

## Replacing the browser-login provider

Moving browser login from one provider to another is more than a flag swap,
because two things don't carry over:

- `userInfoPrefix` is immutable and prefixes every username and group value, so
  role bindings written against the old provider (`old:admins`) don't match the
  new one (`new:admins`).
- No provider drives browser login between clearing the flag and setting it, so
  new browser sign-ins fail for that window. Tokens already issued keep working
  until you delete the old provider.

To migrate:

1. Create the new provider with `browserLogin` unset.
2. Duplicate your role bindings under the new prefix. An
   `OrganizationRoleBinding` on `old:admins` needs a counterpart on
   `new:admins`. Leave the old bindings in place for now.
3. Clear `browserLogin` on the old provider.
4. Set `browserLogin` on the new provider.
5. Sign in through the new provider and confirm your groups resolve with
   `kubectl auth whoami` (see [Verifying your
   identity](verifying-your-identity.md)).
6. Once you're confident the new provider works, delete the old provider and
   the role bindings that referenced its prefix. Skip this if you still want
   the old provider around.

Steps 3 and 4 can collapse into a single change when both providers come from
the bootstrap directory (`hub-core.bootstrap.files` in the Helm chart). A
provider that exists only through the API has no such safety net: clear the
old flag before setting the new one.

:::warning
A provider created through the API and never written to the bootstrap directory
has nothing to restore it. `validation.issuer.url` is immutable, so a wrong
issuer means deleting and recreating the provider. If that provider drives
browser login, you need a working login to do it. Define anything you depend
on for administrator access somewhere reconciled automatically, such as the
bootstrap directory, where the five-minute reconcile repairs it.
:::

## Related resources

- [Identity overview](overview.md): the `IdentityProvider` resource itself.
- [Installing Hub](../../howtos/install.md): supplying providers through
  `hub-core.bootstrap.files` instead of the single-provider sample layer.
- [Access management](../access-management/overview.md): the role bindings that
  reference each provider's prefixed subjects.
