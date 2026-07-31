---
title: Resource filtering
sidebar_position: 1
description: Filter fleet-wide resource lists with CEL expressions evaluated in the database.
---

Resource filter expressions let you narrow a fleet-wide list with a
[CEL](https://github.com/google/cel-spec) expression instead of a fixed set of
query parameters. You pass the expression in the `filter` query parameter and
Hub compiles it to SQL, so filtering happens in the database rather than in your
client.

```text
conditions.ready.status == "False" && createdAt > now() - duration("24h")
```

:::note
Resource filter expressions is an alpha feature. Its grammar and available
fields may change in incompatible ways between releases. See the [feature
lifecycle](../../../reference/feature-releases.md).
:::

## Where you can use it

| Endpoint | Notes |
| --- | --- |
| `GET /apis/hub.upbound.io/v1beta1/resources` | Current version. |
| `GET /apis/hub.upbound.io/v1alpha2/resources` | Same filter schema as `v1beta1`. |
| `GET /apis/catalog.hub.upbound.io/v1alpha1/images` | Different field set. Requires the `Catalog` gate. |
| `POST /apis/catalog.hub.upbound.io/v1alpha1/imagesearches` | Takes the expression in `spec.filter`. Requires the `Catalog` gate. |

`hub.upbound.io/v1alpha1/resources` doesn't accept `filter` at all. It takes
discrete per-field parameters instead, such as `kind`, `controlPlane`, `ready`,
and `labelSelector`. It ignores a `filter` key without an error. Use `v1beta1`
for expression filtering.

## Available fields

You can use these fields in a filter expression on the resources endpoints:

| Field | Type | Notes |
| --- | --- | --- |
| `kind` | string | |
| `group` | string | |
| `apiVersion` | string | The version segment only, such as `v1beta1`. Not `group/version`. |
| `name` | string | |
| `namespace` | string | |
| `labels` | map(string, string) | |
| `annotations` | map(string, string) | |
| `controlPlane` | string | |
| `realm` | string | |
| `space` | string | |
| `crossplaneType` | string | One of `xr`, `mr`, `composed`, `claim`. |
| `conditions.ready.status` | string | `True`, `False`, or `Unknown`. |
| `conditions.ready.message` | string | |
| `conditions.synced.status` | string | |
| `conditions.synced.message` | string | |
| `conditions.healthy.status` | string | |
| `conditions.healthy.message` | string | |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |
| `deletedAt` | timestamp | |

There's no `status` field and no free-form access to the resource object. An
unknown identifier is an error, not an empty match.

## Supported operators and functions

| Category | Supported |
| --- | --- |
| Boolean | `&&`, `\|\|`, `!` |
| Comparison | `==`, `!=`, `<`, `<=`, `>`, `>=` |
| Membership | `in` |
| String | `startsWith`, `endsWith`, `contains`, `matches` |
| Conversion | `timestamp()`, `duration()`, `int()`, `string()` |
| Time | `now()` |

<!-- vale write-good.TooWordy = NO -->
The API rejects anything outside this list. That includes CEL macros such as
`exists`, `all`, `map`, and `filter`, ternary expressions, and arithmetic beyond
timestamp and duration math. The expression as a whole must evaluate to a
boolean.
<!-- vale write-good.TooWordy = YES -->

## How filtering behaves

Hub compiles the expression to a SQL `WHERE` clause and applies it before
pagination, so `page` and `pageSize` page through the matches. The `total` in
the response metadata is the filtered count, not the fleet count.

<!-- vale write-good.Passive = NO -->
Filtering never widens access. The expression is evaluated against the resources
the caller is already authorized to see, so a filter can't surface a resource in
a realm the user can't view.
<!-- vale write-good.Passive = YES -->

## Limits

| Limit | Value |
| --- | --- |
| Expression nesting depth | 50 |
| Regex pattern length in `matches()` | 1000 characters |

<!-- vale write-good.TooWordy = NO -->
There's no cap on overall expression length.
<!-- vale write-good.TooWordy = YES -->

## See also

- [Filtering resource lists](filtering-resources.md)
- [Feature flags](../../../reference/feature-flags.md)
- [Feature lifecycle](../../../reference/feature-releases.md)
