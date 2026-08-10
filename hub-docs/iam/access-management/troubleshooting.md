---
title: Troubleshooting access
sidebar_position: 5
description: Common access-management failure modes and how to diagnose them.
---

:::note[Suggested reading]
This page assumes the model from the [Access management overview](overview.md)
and the identity concepts from the [Identity overview](../identity/overview.md).
[Filtering and self-review](filtering.md) explains the debugging endpoints
referenced below.
:::

Access issues usually fall into one of six patterns. Work top to bottom.
Each section links out to the endpoint or resource that gives you the
definitive answer.

<!-- vale Google.FirstPerson = NO -->
<!-- vale gitlab.FirstPerson = NO -->
## "I'm an org admin but I can't list resources"
<!-- vale Google.FirstPerson = YES -->
<!-- vale gitlab.FirstPerson = YES -->

`org-admin` doesn't cover realm-internal data by design, including
`controlplanes`, `resources`, `resourcestats`, resource relationships,
`typedefinitions`, `crossplanepackages`, and metrics queries. The fleet-wide
Definitions and Packages views are realm-internal too, so an org admin with no
realm role sees nothing in them. See [Realm-scoped
resources](roles-reference.md#realm-scoped-resources) for the full list.

**Fix.** Grant yourself a `RealmRoleBinding` in the target realm:

```yaml
apiVersion: authorization.hub.upbound.io/v1beta1
kind: RealmRoleBinding
metadata:
  name: self-realm-admin
  namespace: <realm>
spec:
  roleRef:
    name: realm-admin
  subjects:
    - kind: User
      name: "<prefix>:<your-email>"
```

<!-- vale Google.FirstPerson = NO -->
## "My list is empty"
<!-- vale Google.FirstPerson = YES -->

No grant matches, or the underlying data isn't there.

**Fix.** Post a `SelfSubjectAccessReview` for the same verb and resource
(see [inspect your grants](filtering.md#inspect-your-grants-with-selfsubjectaccessreview)),
then read `status.decision`:

- `Deny`: no grant applies. Add the missing role binding.
- `Filtered`: read `status.filter`. It names which realm and control plane
  subset you'd see. If that subset doesn't cover what you were listing, the
  grant is too narrow. Bind the subject in the realm it's missing, or give
  it a higher role. `spec.roleRef.name` is immutable, so raising a role
  means creating a replacement binding and deleting the old one, not
  editing the existing one. See [Configure
  realm-level access](overview.md#configure-realm-level-access).
- `Allow`, or `Filtered` with a predicate that does cover what you were
  listing: the underlying data isn't there. Verify with a broader-scoped
  identity, or check that the control plane's `hub-connector` has synced
  the resources you expect.

## "`kubectl auth whoami` shows no groups"

Hub sees no group membership from the token. That's an `IdentityProvider`
misconfiguration on the provider side, on the Hub side, or both. See
[Verifying your identity](../identity/verifying-your-identity.md) for what a
valid response looks like.

**Fix.**

1. Confirm the token contains a groups claim. Copy a real access token
   from the Hub UI (browser dev tools) and decode it in a JWT inspector.
   Look for the claim your `IdentityProvider` points at.
2. If the claim is missing, the IdP isn't emitting groups. Follow the
   per-provider setup: [Entra ID](../identity/entra-id.md#set-up-the-app-registration),
   [Amazon Cognito](../identity/amazon-cognito.md), [Google
   Workspace](../identity/google-workspace.md), [Keycloak](../identity/keycloak.md),
   [Okta](../identity/okta.md).
3. If the claim is present but Hub still shows no groups,
   `spec.validation.claimMappings.groups.claim` on your `IdentityProvider`
   is pointing at the wrong name. Patch the `IdentityProvider` and
   re-authenticate.

Re-authenticate after each change: a cached token still carries the old
identity.

<!-- vale Google.FirstPerson = NO -->
<!-- vale gitlab.FirstPerson = NO -->
## "I changed the user's groups in the IdP but their access didn't update"
<!-- vale Google.FirstPerson = YES -->
<!-- vale gitlab.FirstPerson = YES -->

Role bindings apply immediately. Hub reads them from the database on every
request, so a new `OrganizationRoleBinding` or `RealmRoleBinding` goes live
on the caller's next request, with no new token required. Group membership
is the part that lags. The groups Hub matches bindings against are claims
carried inside the Hub token, so a change you make in the IdP stays
invisible until the caller gets a fresh token.

**Fix.** Get the caller a new token, then re-check.

- **Browser UI.** The session cookie refreshes on the next request, so reloading
  the page is usually enough. Signing out and back in forces it.
- **`kubectl` through the credential plugin.** The plugin refreshes when the
  cached token expires. To force it now, run `hub-credential-helper get-token
  --no-cache`, or delete the cache directory (`--cache-dir`, or `HUB_CACHE_DIR`).
- **Machine clients using token exchange.** Exchange a fresh IdP JWT for a new
  Hub token.

Confirm the new identity before looking anywhere else:

```bash
kubectl auth whoami   # the exact username and groups Hub now sees
```

See [Verifying your identity](../identity/verifying-your-identity.md) for how
to read the full response.

If the groups are right and the binding still doesn't apply, the problem is the
*names*, not the timing. A `subjects[].name` has to match the prefixed
identity: `<userInfoPrefix><username-claim-value>` for a `User` subject and
`<userInfoPrefix><raw-group-value>` for a `Group` subject. A missing prefix is the
most common cause of "the binding is there but nothing happens."

## "The binding exists in Hub but hasn't reached the Space"

On Spaces-managed control planes, Hub alone doesn't enforce a
`RealmRoleBinding`. It projects the binding down into each Space as an
`ObjectRoleBinding` in the realm's control plane group namespace. Until
that projection completes, the binding is real in Hub and invisible in the
Space.

**Fix.** Read the binding's status. It reports the projection per Space:

```bash
kubectl get realmrolebinding <name> -n <realm> -o yaml
```

```yaml
status:
  spaces:
    - name: space-east
      ctpGroup: prod-east
      objectRoleBinding: rrb-viewers
      phase: Synced
      lastSyncTime: "2026-07-31T09:14:22Z"
```

`phase` is one of:

| Phase | Means |
| --- | --- |
| `Pending` | Hub has accepted the binding but projection hasn't started. |
| `Syncing` | Projection is in flight. |
| `Synced` | The `ObjectRoleBinding` exists in that Space. Access should work. |
| `Error` | Projection failed. The binding doesn't take effect in that Space. |

A Space stuck outside `Synced`, or missing from the list entirely, points at the
connector rather than at your binding. Check that the space connector is running
with Spaces integration enabled and can reach both the Hub API and the Spaces API
server.

<!-- vale Google.FirstPerson = NO -->
<!-- vale gitlab.FirstPerson = NO -->
## "A resource type doesn't show up even though I have a realm role"
<!-- vale Google.FirstPerson = YES -->
<!-- vale gitlab.FirstPerson = YES -->

Realm roles project into every control plane in the realm. A
`realm-viewer` should see whatever `crossplane-view` and `controlplane-view`
expose between them on every control plane in the realm, regardless of that
control plane's `spec.identityProviders`. If a
specific resource type is missing, the cause is upstream of your role
binding.

**Fix.**

- Confirm the type is in the [aggregated ClusterRole](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#aggregated-clusterroles) the realm role
  maps to. Add a `ClusterRole` inside the control plane labeled
  `rbac.crossplane.io/aggregate-to-view: "true"` (or the `edit` / `admin`
  variants) to extend what the projection grants.
- Confirm the connector actually synced the type. The `hub-connector`
  runs with `--limit-to-cluster-roles` (`connector.sync.limitToClusterRoles`
  in the Helm chart) and only syncs resources permitted by the union of
  those ClusterRoles. See [the connector-side sync
  bound](overview.md#the-connector-side-sync-bound).
- Post a `SelfSubjectAccessReview` for `verb: list` on the exact
  resource, namespace, and control plane. The response tells you
  whether the row-level filter is denying access.

If you need *extra* privileges beyond the aggregation projection (edit on
one API group, write access to a specific Composition), configure the
control plane's `spec.identityProviders`. Then add a matching
`RoleBinding`/`ClusterRoleBinding` inside the control plane. See [Pass
Hub identities through to a control
plane](filtering.md#pass-hub-identities-through-to-a-control-plane).

## Related resources

- [Filtering and self-review](filtering.md): how to interpret the
  `SelfSubjectAccessReview` response.
- [Access management overview](overview.md)
- [Roles reference](roles-reference.md)
