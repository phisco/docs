---
title: Query your fleet
sidebar_position: 2
description: Search, filter, and count resources across your connected control planes with the Insights API, and save a query as a lens.
---

This guide explains how to query the resources Hub aggregates from your
connected control planes. It also covers inspecting a single resource in detail
and saving a query as a lens your team can reuse.

## Prerequisites

- A Hub install with at least one [connected control plane][connectCtp] or
  [connected space][connectSpace].
- The base URL clients use to reach `hub-core`, the same value as
  `hub-core.api.externalURL`.
- A Hub access token for an account with read access to at least one realm.

The examples use two shell variables:

```shell
HUB_URL=https://api.<your-domain>
TOKEN=<your-hub-access-token>
```

## Step 1: List the aggregated resources

1. Request the resource list.

   ```shell
   curl -s "$HUB_URL/apis/hub.upbound.io/v1beta1/resources" \
     -H "Authorization: Bearer $TOKEN"
   ```

   Each item carries the resource's own identity in `source`, its control plane
   and realm in `location`, and the aggregation metadata in `hub`.

2. Read the count from the response metadata.

   ```json
   {
     "kind": "ResourceList",
     "apiVersion": "hub.upbound.io/v1beta1",
     "metadata": {
       "total": { "count": 614, "relation": "eq" },
       "page": 1,
       "pageSize": 10
     }
   }
   ```

   `total.count` is the number of resources matching the query, not the number
   returned. Page through the matches with `page` and `pageSize`.

   The Console renders the same list at `/explore/resources`:

   ![The unfiltered aggregated resource list in the Console](/img/hub/insights/resources-list.png)

:::warning
Use `hub.upbound.io/v1beta1`. The `v1alpha1` version accepts the `filter`
parameter but ignores it, so a filtered query sent to `v1alpha1` returns your
whole estate.
:::

## Step 2: Narrow the list

1. Search by name with `search`.

   ```shell
   curl -sG "$HUB_URL/apis/hub.upbound.io/v1beta1/resources" \
     --data-urlencode 'search=kubernetes' \
     -H "Authorization: Bearer $TOKEN"
   ```

2. Filter with a CEL expression in `filter`.

   ```shell
   curl -sG "$HUB_URL/apis/hub.upbound.io/v1beta1/resources" \
     --data-urlencode 'filter=kind == "Pod"' \
     --data-urlencode 'pageSize=25' \
     -H "Authorization: Bearer $TOKEN"
   ```

   Reference resource fields as bare identifiers, such as `kind` or `namespace`.

   The Console builds the same narrowing through **Add Filter**, which lists the
   fields you can filter on:

   ![The Add Filter menu listing filterable resource fields](/img/hub/insights/resources-add-filter-menu.png)

   An applied filter shows as a chip over the list, with the match count
   updated:

   ![The resource list narrowed by a Kind filter](/img/hub/insights/resources-filter-kind-applied.png)

3. Check `message` if a query returns no items.

   An invalid expression returns the CEL parse error rather than an empty
   result:

   ```json
   {
     "message": "ERROR: <input>:1:1: undeclared reference to 'source'\n | source.kind == \"Pod\"\n | ^"
   }
   ```

## Step 3: Inspect one resource

1. Get the resource by the name Hub assigned it.

   The name in `metadata.name` is Hub's identifier, such as
   `default.default.eb8a0fbd0b83f39b`, not the resource's own name.

   ```shell
   curl -s "$HUB_URL/apis/hub.upbound.io/v1beta1/resources/$NAME" \
     -H "Authorization: Bearer $TOKEN"
   ```

2. Read its events.

   ```shell
   curl -s "$HUB_URL/apis/hub.upbound.io/v1beta1/resources/$NAME/events" \
     -H "Authorization: Bearer $TOKEN"
   ```

3. Follow its relationships.

   ```shell
   curl -s "$HUB_URL/apis/hub.upbound.io/v1beta1/resourcerelationships/$NAME" \
     -H "Authorization: Bearer $TOKEN"
   ```

   `resourcerelationships` returns the resources one resource composes, the ones
   it references, and the ones that reference it. For the whole composition tree
   below a composite resource, request `resourcerelationshiptrees/$NAME` instead.
   Both endpoints answer for a single resource, so a request without a name
   fails.

   The Console shows all three in one detail drawer, with the object itself on
   the **YAML** tab:

   ![The resource detail drawer showing the resource YAML](/img/hub/insights/resource-detail-yaml.png)

## Step 4: Count without listing

Post an empty `spec` to `resourcestats` to count everything the caller can see.

```shell
curl -s -X POST "$HUB_URL/apis/hub.upbound.io/v1beta1/resourcestats" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"apiVersion":"hub.upbound.io/v1beta1","kind":"ResourceStats","spec":{}}'
```

The response groups the count by condition, which is what the Console dashboard
renders:

```json
{
  "results": {
    "summary": {
      "totalCount": 614,
      "readyTrue": 27,
      "readyFalse": 0,
      "readyUnknown": 587,
      "syncedTrue": 2,
      "syncedFalse": 0,
      "syncedUnknown": 612,
      "healthyTrue": 4,
      "healthyFalse": 0,
      "healthyUnknown": 610
    }
  }
}
```
<!-- vale write-good.Passive = NO -->
A high `readyUnknown` count is expected. Kubernetes resources that don't report a
`Ready` condition, such as `Endpoints`, count as unknown.
<!-- vale write-good.Passive = YES -->

## Step 5: Save the query as a lens

A lens stores a filter so you can apply it in the Console instead of rebuilding
the query.

1. Create the lens.

   ```shell
   curl -s -X POST "$HUB_URL/apis/hub.upbound.io/v1beta1/lenses" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "apiVersion": "hub.upbound.io/v1beta1",
       "kind": "Lens",
       "metadata": {
         "name": "team-a-pods",
         "annotations": { "hub.upbound.io/shared": "true" }
       },
       "spec": {
         "displayName": "Team A pods",
         "description": "Pods the platform team owns.",
         "target": { "kind": "Resource", "apiVersion": "hub.upbound.io/v1beta1" },
         "filter": { "fields": [ { "field": "kind", "values": ["Pod"] } ] }
       }
     }'
   ```

   Hub records who created the lens in its status:

   ```json
   {
     "status": {
       "lastUpdatedAt": "2026-07-29T16:50:20Z",
       "createdBy": "keycloak:admin@hub.demo",
       "lastUpdatedBy": "keycloak:admin@hub.demo"
     }
   }
   ```

   Set `hub.upbound.io/shared: "true"` to give the whole organization access to
   the lens. Without it, the lens belongs to you.

2. Confirm the lens exists.

   ```shell
   curl -s "$HUB_URL/apis/hub.upbound.io/v1beta1/lenses" \
     -H "Authorization: Bearer $TOKEN"
   ```

   Your lens appears alongside the two lenses Hub includes,
   `crossplane-not-ready` and `packages-unhealthy`. Those two carry the
   `hub.upbound.io/source: upbound` annotation.

3. Apply the lens in the Console, on the `/explore/resources` page.
<!-- vale Microsoft.Adverbs = NO -->
   The sidebar groups the lenses you created separately from the shared ones and
   the ones Hub includes:
<!-- vale Microsoft.Adverbs = YES -->

   ![A saved lens selected in the Console sidebar](/img/hub/insights/lens-endpoints-and-services.png)

4. Delete the lens when the team no longer needs it.

   ```shell
   curl -s -X DELETE "$HUB_URL/apis/hub.upbound.io/v1beta1/lenses/team-a-pods" \
     -H "Authorization: Bearer $TOKEN"
   ```

   A successful delete returns `204` with no body.

## Troubleshoot

A query that returns fewer resources than you expect usually means one of three
things:

- **The caller lacks access.** Insights filters every response by realm
  permissions, so two users running one query get different counts. See
  [RBAC][rbac].
- **The version ignores your filter.** `v1alpha1` accepts `filter` and ignores
  it. Use `v1beta1`.
- **The record is stale.** Insights serves aggregated data, not a live read.
  Check `hub.syncLagSeconds` on the resource to see how far behind the record
  fell.

## See also

- [Insights][insights]
- [Connect a control plane][connectCtp]
- [Configure RBAC][rbac]

[connectCtp]: ../../../howtos/connect-control-plane.md
[connectSpace]: ../../../howtos/connect-space.md
[insights]: ./overview.md
[rbac]: ../../../howtos/rbac.md
