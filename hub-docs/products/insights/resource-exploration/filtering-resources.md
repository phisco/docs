---
title: Filtering resource lists
sidebar_position: 3
description: Answer fleet-wide questions with filter expressions, from a single condition to combined ones.
---

This guide covers three fleet-wide queries: finding unhealthy resources across
every control plane, scoping a list to one realm, and combining conditions that
no single query parameter covers.

Every example runs against the `v1beta1` resources endpoint. See the [Resource
filter expressions overview](overview.md) for the full field list.

## Before you start

The examples use a `hub` kubectl context. See [Configure kubectl for the
hub](../../../howtos/configure-kubectl.md) to set one up.

`filter` values need URL encoding, which makes long expressions hard to read on
a command line. Define a helper that encodes for you:

```shell
hubfilter() {
  kubectl --context=hub get --raw \
    "/apis/hub.upbound.io/v1beta1/resources?filter=$(jq -rn --arg f "$1" '$f|@uri')"
}
```

Then pass expressions as you wrote them:

```shell
hubfilter 'kind == "XApp"' | jq -r '.items[].metadata.name'
```

## Match a single field

The simplest filters compare one field:

```text
kind == "RDSInstance"
namespace == "team-alpha"
apiVersion == "v1beta1"
crossplaneType in ["xr", "mr"]
```

`in` takes a list, which is shorter than chaining `||`:

```text
kind in ["RDSInstance", "S3Bucket", "VPC"]
```

## Find unhealthy resources

Each of `ready`, `synced`, and `healthy` exposes a `status` and a `message`:

```text
conditions.ready.status == "False"
conditions.healthy.status == "False"
conditions.ready.status == "False" || conditions.synced.status == "False"
```

`!=` and `!` both work, and they differ in how they treat `Unknown`. Use `!=` to
catch resources that are neither ready nor reporting:

```text
conditions.ready.status != "True"
!(conditions.ready.status == "True")
```

## Scope to part of the fleet

`controlPlane`, `realm`, and `space` narrow a query to one slice of the fleet.
Hub pushes these down into its authorization query, so they're the cheapest
predicates to add:

```text
realm == "production"
realm in ["prod-us", "prod-eu"]
controlPlane == "prod-west"
```

Combined with a condition, this is the "what's broken in production" query:

```shell
hubfilter 'conditions.ready.status == "False" && realm == "production"' \
  | jq -r '.items[] | "\(.metadata.name)\t\(.kind)"'
```

## Match on names and labels

String functions cover prefix, suffix, partial match, and regex:

```text
name.startsWith("api-")
name.endsWith("-prod")
name.contains("payments")
name.matches("^web-[0-9]+$")
```

Labels and annotations are maps. Index them by key, or test for a key with `in`:

```text
labels["team"] == "alpha"
"team" in labels
labels["team"] == "platform" && !(annotations["deprecated"] == "true")
```

:::note
A regex passed to `matches()` has a limit of 1000 characters.
:::

## Filter by time

`createdAt`, `updatedAt`, and `deletedAt` are timestamps. Compare them to an
absolute time with `timestamp()`, or to a relative one with `now()` and
`duration()`:

```text
updatedAt > timestamp("2026-01-15T00:00:00Z")
createdAt > now() - duration("24h")
updatedAt < deletedAt
```

A created-between window is two comparisons:

```text
namespace == "team-alpha" &&
  createdAt > timestamp("2026-01-01T00:00:00Z") &&
  createdAt < timestamp("2026-02-01T00:00:00Z")
```

## Combine conditions

Parentheses group sub-expressions and control precedence:

```text
(conditions.ready.status == "False" || conditions.synced.status == "False") &&
  realm == "production"
```

Recently changed AWS resources, either created or updated:

```text
group.contains("aws") &&
  (createdAt > now() - duration("24h") || updatedAt > now() - duration("1h"))
```

A full fleet triage query, scoped and named and timed at once:

```text
controlPlane == "prod-west" &&
  (kind == "Pod" || kind == "Deployment") &&
  labels["tier"] == "frontend" &&
  createdAt > now() - duration("168h")
```

## Page through matches

Filtering runs in the database before pagination, so `page` and `pageSize` walk
the matched set and `metadata.total` is the filtered count:

```shell
kubectl --context=hub get --raw \
  '/apis/hub.upbound.io/v1beta1/resources?pageSize=50&page=2&filter=realm%3D%3D%22production%22' \
  | jq '{total: .metadata.total, returned: (.items | length)}'
```

Pages count from 1.

## Errors

An invalid expression returns `400` and doesn't reach the database. The message
tells you which part failed:

<!-- vale Microsoft.Ranges = NO -->
<!-- vale Microsoft.RangeFormat = NO -->
<!-- vale write-good.Passive = NO -->
| Message | Cause |
| --- | --- |
| `unknown column "<path>"` | The identifier isn't in the field list. Check [the available fields](overview.md#available-fields). |
| `unsupported operator or function "<fn>"` | The function isn't supported. Macros such as `exists`, `all`, and `map` are rejected. |
| `filter must evaluate to a boolean condition, got <type>` | The expression returns a value rather than a comparison, such as `kind` on its own. |
| `regex pattern exceeds 1000 characters` | Shorten the `matches()` pattern. |
| `invalid duration "<s>"` | `duration()` takes a Go duration string, such as `24h` or `90m`. |
| `invalid timestamp "<s>": must be RFC3339` | `timestamp()` takes an RFC 3339 value, such as `2026-01-15T00:00:00Z`. |
| A CEL parser error with a source location | A syntax or type error. The message points at the offending column. |
<!-- vale write-good.Passive = YES -->
<!-- vale Microsoft.RangeFormat = YES -->
<!-- vale Microsoft.Ranges = YES -->

A `400` with no message about the filter, on a request you expected to work, is
usually the wrong API version. `v1alpha1` ignores `filter` rather than
evaluating it. See [Where you can use it](overview.md#where-you-can-use-it).

## See also

- [Resource filter expressions overview](overview.md)
- [Connect a control plane](../../../howtos/connect-control-plane.md)
