---
title: Verifying your identity
sidebar_position: 7
description: Read back the username, groups, and attributes Hub resolved for you, with kubectl auth whoami or the SelfSubjectReview API.
---

:::note[Suggested reading]
Read the [Identity overview](overview.md) first for the `IdentityProvider`
resource, `userInfoPrefix`, and claim mappings. This page shows you what those
settings produced for a real caller.
:::

Role bindings match on exact strings, so the first question to answer when
access doesn't behave is *who does Hub think you are?* Ask Hub rather than
deriving the answer from your `IdentityProvider` config. A binding whose
subject name is off by one character grants nothing, without warning.

## `kubectl auth whoami`

The quickest check. It posts a `SelfSubjectReview` under the hood and prints
the two fields role bindings match against:

```console
$ kubectl auth whoami
ATTRIBUTE   VALUE
Username    entra:alice@example.com
Groups      [entra:platform-eng system:authenticated]
```

Check three things:

- The username matches `<userInfoPrefix><username-claim-value>`
  (`entra:alice@example.com` in the example).
- Every group you expect appears, prefixed with `userInfoPrefix`.
- If groups are missing, the IdP either didn't emit a `groups` claim or you
  pointed `claimMappings.groups.claim` at the wrong claim name.

This needs `kubectl` wired up against Hub. See [Configure
kubectl](../../howtos/configure-kubectl.md).

## The request and response

`SelfSubjectReview` is the standard Kubernetes `authentication.k8s.io/v1`
resource, cluster-scoped and create-only. Hub ignores the request body
entirely and answers from the bearer token you authenticated with. You can't
make the review describe anyone but yourself:

```http
POST /apis/authentication.k8s.io/v1/selfsubjectreviews
Authorization: Bearer <hub-token>
Content-Type: application/json

{
  "apiVersion": "authentication.k8s.io/v1",
  "kind": "SelfSubjectReview"
}
```

The response carries the resolved identity under `status.userInfo`:

```json
{
  "apiVersion": "authentication.k8s.io/v1",
  "kind": "SelfSubjectReview",
  "status": {
    "userInfo": {
      "username": "entra:alice@example.com",
      "groups": [
        "entra:platform-eng",
        "system:authenticated"
      ],
      "extra": {
        "authentication.hub.upbound.io/identity-provider": ["entra"],
        "authentication.hub.upbound.io/issuer": ["https://login.microsoftonline.com/<tenant-id>/v2.0"],
        "authentication.hub.upbound.io/sub": ["8f14e45f-ceea-467a-9a1c-2b3d4e5f6a7b"],
        "authentication.hub.upbound.io/email": ["alice@example.com"],
        "authentication.hub.upbound.io/is-human": ["true"],
        "authentication.hub.upbound.io/expiry": ["2026-07-31T16:04:11Z"],
        "upbound.io/org": ["acme"]
      }
    }
  }
}
```

`username` and `groups` are the values every role binding matches against,
already carrying the `userInfoPrefix` from the `IdentityProvider` that
authenticated you. `kubectl auth whoami` renders these two fields.

To issue the request without `kubectl`:

```bash
curl -s -X POST "$HUB_URL/apis/authentication.k8s.io/v1/selfsubjectreviews" \
  -H "Authorization: Bearer $(hub-credential-helper get-token --hub-url=$HUB_URL)" \
  -H "Content-Type: application/json" \
  -d '{"apiVersion":"authentication.k8s.io/v1","kind":"SelfSubjectReview"}'
```

Every authenticated principal may create a `SelfSubjectReview`, regardless of
role. It's part of the built-in `system:basic-user` grant.

## The `extra` attributes

The `extra` map carries the identity attributes Hub derived while minting your
token. Each value is a list, per the Kubernetes `UserInfo` schema, even when
it holds a single entry:

| Key | Carries |
| --- | --- |
| `authentication.hub.upbound.io/identity-provider` | Name of the `IdentityProvider` that authenticated you |
| `authentication.hub.upbound.io/issuer` | The upstream OIDC issuer URL |
| `authentication.hub.upbound.io/sub` | The `sub` claim from the upstream token |
| `authentication.hub.upbound.io/email` | The verified email address |
| `authentication.hub.upbound.io/is-human` | `"true"` for browser and device-flow logins, `"false"` for exchanged workload tokens |
| `authentication.hub.upbound.io/expiry` | Token expiry, RFC 3339 |
| `upbound.io/org` | The organization Hub minted the token for |

`uid` is present in the schema, but Hub doesn't populate it. Hub keys identity
on the prefixed username, not an opaque ID.

## When the identity is right but access still isn't

`SelfSubjectReview` answers *who are you*. When the answer looks correct but
access still doesn't behave, the question becomes *what are you allowed to
do*, a different endpoint. See [Filtering and
self-review](../access-management/filtering.md) for `SelfSubjectAccessReview`
and how to read the filter it returns.

## Related resources

- [Identity overview](overview.md): the claim mappings that produce these
  values.
- [Configure kubectl](../../howtos/configure-kubectl.md): wiring `kubectl` up
  against Hub.
- [Workload identities](workload-identities.md): reading back a CI job's or
  ServiceAccount's username before binding it.
- [Troubleshooting access](../access-management/troubleshooting.md): when the
  groups are missing or a binding doesn't apply.
