---
title: Query API
sidebar_position: 40
description: Use the `up` CLI to query objects and resources
---

<!-- vale write-good.TooWordy = NO -->
<!-- ignore "aggregate" -->

Upbound's Query API allows users to inspect objects and resources within their control planes. The read-only `up alpha query` and `up alpha get` CLI commands allow you to gather information on your control planes in a fast and efficient package. These commands follow the [`kubectl` conventions][kubectl-conventions] for filtering, sorting, and retrieving information from your Space.


<!-- vale Google.Headings = NO -->

## Using the Query API

<!-- vale Google.Headings = YES -->
The Query API allows you to retrieve control plane information faster than traditional `kubectl` commands. This feature lets you debug your Crossplane resources with the CLI or within the Upbound Console's enhanced management views.

### Query within a single control plane

Use the `up alpha get` command to retrieve information about objects within the current control plane context. This command uses the **Query** endpoint and targets the current control plane.

To switch between control plane groups, use the [`up ctx` ][up-ctx] and change to your desired context with an interactive prompt or specify with your control plane path:

```shell
up ctx <org>/<space>/<group>/<ctp-name>
```

You can query within a single control plane with the [`up alpha get` command][up-alpha-get-command] to return more information about a given object within the current kubeconfig context.

The `up alpha get` command can query resource types and aliases to return objects in your control plane.

```shell
up alpha get managed
NAME                             READY   SYNCED   AGE
custom-account1-5bv5j-sa         True    True     15m
custom-cluster1-bq6dk-net        True    True     15m
custom-account1-5bv5j-subnet     True    True     15m
custom-cluster1-bq6dk-nodepool   True    True     15m
custom-cluster1-bq6dk-cluster    True    True     15m
custom-account1-5bv5j-net        True    True     15m
custom-cluster1-bq6dk-subnet     True    True     15m
custom-cluster1-bq6dk-sa         True    True     15m
```

The [`-A` flag][a-flag] queries for objects across all namespaces.

```shell
up alpha get configmaps -A
NAMESPACE           NAME                                                   AGE
crossplane-system   uxp-versions-config                                    18m
crossplane-system   universal-crossplane-config                            18m
crossplane-system   kube-root-ca.crt                                       18m
upbound-system      kube-root-ca.crt                                       18m
kube-system         kube-root-ca.crt                                       18m
kube-system         coredns                                                18m
default             kube-root-ca.crt                                       18m
kube-node-lease     kube-root-ca.crt                                       18m
kube-public         kube-root-ca.crt                                       18m
kube-system         kube-apiserver-legacy-service-account-token-tracking   18m
kube-system         extension-apiserver-authentication                     18m
```

To query for [multiple resource types][multiple-resource-types], you can add the name or alias for the resource as a comma separated string.

```shell
up alpha get providers,providerrevisions

NAME                                                                              HEALTHY     REVISION   IMAGE                                                    STATE    DEP-FOUND   DEP-INSTALLED   AGE
providerrevision.pkg.crossplane.io/crossplane-contrib-provider-nop-ecc25c121431   True        1          xpkg.upbound.io/crossplane-contrib/provider-nop:v0.2.1   Active                               18m
NAME                                                                              INSTALLED   HEALTHY    PACKAGE                                                  AGE
provider.pkg.crossplane.io/crossplane-contrib-provider-nop                True        True       xpkg.upbound.io/crossplane-contrib/provider-nop:v0.2.1   18m
```

### Query multiple control planes

The [`up alpha query` command][up-alpha-query-command] returns a list of objects of any kind within all the control planes in your Space. This command uses either the **SpaceQuery** or **GroupQuery** endpoints depending on your query scope. The `-A` flag switches the query context from the group level to the entire Space

The `up alpha query` command accepts resources and aliases to return objects across your group or Space.

```shell
up alpha query crossplane

NAME                                                                                          ESTABLISHED   OFFERED   AGE
compositeresourcedefinition.apiextensions.crossplane.io/xnetworks.platform.acme.co            True          True      20m
compositeresourcedefinition.apiextensions.crossplane.io/xaccountscaffolds.platform.acme.co    True          True      20m


NAME                                                                          XR-KIND             XR-APIVERSION               AGE
composition.apiextensions.crossplane.io/xaccountscaffolds.platform.acme.co    XAccountScaffold    platform.acme.co/v1alpha1   20m
composition.apiextensions.crossplane.io/xnetworks.platform.acme.co            XNetwork            platform.acme.co/v1alpha1   20m


NAME                                                                                          REVISION   XR-KIND             XR-APIVERSION               AGE
compositionrevision.apiextensions.crossplane.io/xaccountscaffolds.platform.acme.co-5ae9da5    1          XAccountScaffold    platform.acme.co/v1alpha1   20m
compositionrevision.apiextensions.crossplane.io/xnetworks.platform.acme.co-414ce80            1          XNetwork            platform.acme.co/v1alpha1   20m

NAME                                                           READY   SYNCED   AGE
nopresource.nop.crossplane.io/custom-cluster1-bq6dk-subnet     True    True     19m
nopresource.nop.crossplane.io/custom-account1-5bv5j-net        True    True     19m

## Output truncated...

```

<!-- vale Upbound.Spelling = NO -->
The [`--sort-by` flag][sort-by-flag] allows you to return information to your specifications. You can construct your sort order in a JSONPath expression string or integer.
<!-- vale Upbound.Spelling = YES -->

```shell
up alpha query crossplane -A --sort-by="{.metadata.name}"

CONTROLPLANE    NAME                                                    AGE
default/test    deploymentruntimeconfig.pkg.crossplane.io/default       10m

CONTROLPLANE    NAME                                                    AGE         TYPE            DEFAULT-SCOPE
default/test    storeconfig.secrets.crossplane.io/default               10m         Kubernetes      crossplane-system
```

To query for multiple resource types, you can add the name or alias for the resource as a comma separated string.

```shell
up alpha query namespaces,configmaps -A

CONTROLPLANE    NAME                            AGE
default/test    namespace/upbound-system        15m
default/test    namespace/crossplane-system     15m
default/test    namespace/kube-system           16m
default/test    namespace/default               16m

CONTROLPLANE    NAMESPACE           NAME                                            AGE
default/test    crossplane-system   configmap/uxp-versions-config                   15m
default/test    crossplane-system   configmap/universal-crossplane-config           15m
default/test    crossplane-system   configmap/kube-root-ca.crt                      15m
default/test    upbound-system      configmap/kube-root-ca.crt                      15m
default/test    kube-system         configmap/coredns                               16m
default/test    default             configmap/kube-root-ca.crt                      16m

## Output truncated...

```

The Query API also allows you to return resource types with specific [label columns][label-columns].

```shell
up alpha query composite -A --label-columns=crossplane.io/claim-namespace

CONTROLPLANE                  NAME                                                 SYNCED   READY   COMPOSITION                     AGE   CLAIM-NAMESPACE
query-api-test/test   xeks.argo.discover.upbound.io/test-k7xbk   False            xeks.argo.discover.upbound.io   51d   default

CONTROLPLANE                                                        NAME                                                                        EXTERNALDNS   SYNCED   READY   COMPOSITION                                    AGE   CLAIM-NAMESPACE
spaces-clusters/controlplane-query-api-test-spaces-playground   xexternaldns.externaldns.platform.upbound.io/spaces-cluster-0-xd8v2-lhnl7   6.34.2        True     True    xexternaldns.externaldns.platform.upbound.io   19d   default
default/query-api-test                                          xexternaldns.externaldns.platform.upbound.io/space-awg-kine-f7dxq-nkk2q     6.34.2        True     True    xexternaldns.externaldns.platform.upbound.io   55d   default

## Output truncated...

```

### Query API request format

The CLI can also return a version of your query request with the [`--debug` flag][debug-flag]. This flag returns the API spec request for your query.

```shell
up alpha query composite -A -d

apiVersion: query.spaces.upbound.io/v1alpha1
kind: SpaceQuery
metadata:
  creationTimestamp: null
spec:
  cursor: true
  filter:
    categories:
    - composite
    controlPlane: {}
  limit: 500
  objects:
    controlPlane: true
    table: {}
  page: {}
```

For more complex queries, you can interact with the Query API like a Kubernetes-style API by creating a query and applying it with `kubectl`.

The example below is a query for `claim` resources in every control plane from oldest to newest and returns specific information about those claims.


```yaml
apiVersion: query.spaces.upbound.io/v1alpha1
kind: SpaceQuery
spec:
  filter:
    categories:
    - claim
  order:
  - creationTimestamp: Asc
  cursor: true
  count: true
  objects:
    id: true
    controlPlane: true
    object:
      kind: true
      apiVersion: true
      metadata:
        name: true
        uid: true
      spec:
        containers:
          image: true
```

<!-- vale write-good.Passive = NO -->
The Query API is served by the Spaces API endpoint. You can use `up ctx` to
switch the kubectl context to the Spaces API ingress. After that, you can use
`kubectl create` and receive the `response` for your query parameters.
<!-- vale write-good.Passive = YES -->

```shell
kubectl create -f spaces-query.yaml -o yaml
```

Your `response` should look similar to this example:

```yaml {copy-lines="none"}
apiVersion: query.spaces.upbound.io/v1alpha1
kind: SpaceQuery
metadata:
  creationTimestamp: "2024-08-08T14:41:46Z"
  name: default
response:
  count: 3
  cursor:
    next: ""
    page: 0
    pageSize: 100
    position: 0
  objects:
  - controlPlane:
      name: query-api-test
      namespace: default
    id: default/query-api-test/823b2781-7e70-4d91-a6f0-ee8f455d67dc
    object:
      apiVersion: spaces.platform.upbound.io/v1alpha1
      kind: Space
      metadata:
        name: space-awg-kine
        resourceVersion: "803868"
        uid: 823b2781-7e70-4d91-a6f0-ee8f455d67dc
      spec: {}
  - controlPlane:
      name: test-1
      namespace: test
    id: test/test-1/08a573dd-851a-42cc-a600-b6f6ed37ee8d
    object:
      apiVersion: argo.discover.upbound.io/v1alpha1
      kind: EKS
      metadata:
        name: test-1
        resourceVersion: "4270320"
        uid: 08a573dd-851a-42cc-a600-b6f6ed37ee8d
      spec: {}
  - controlPlane:
      name: controlplane-query-api-test-spaces-playground
      namespace: spaces-clusters
    id: spaces-clusters/controlplane-query-api-test-spaces-playground/b5a6770f-1f85-4d09-8990-997c84bd4159
    object:
      apiVersion: spaces.platform.upbound.io/v1alpha1
      kind: Space
      metadata:
        name: spaces-cluster-0
        resourceVersion: "1408337"
        uid: b5a6770f-1f85-4d09-8990-997c84bd4159
      spec: {}
```
<!-- vale off -->

## Query API Explorer

<!-- vale on -->

import CrdDocViewer from '@site/src/components/CrdViewer';

### Query

The Query resource allows you to query objects in a single control plane.

<CrdDocViewer crdUrl="/crds/query/spaces.upbound.io_queries.yaml" />

### GroupQuery

The GroupQuery resource allows you to query objects across a group of control planes.

<CrdDocViewer crdUrl="/crds/query/spaces.upbound.io_groupqueries.yaml" />

### SpaceQuery

The SpaceQuery resource allows you to query objects across all control planes in a space.

<CrdDocViewer crdUrl="/crds/query/spaces.upbound.io_spacequeries.yaml" />

<!-- ignore "aggregate" -->
<!-- vale write-good.TooWordy = YES -->

[documentation]: /self-hosted-spaces/howtos/query-api
[up-ctx]: /reference/cli-reference
[up-alpha-get-command]: /reference/cli-reference
[a-flag]: /reference/cli-reference
[multiple-resource-types]: /reference/cli-reference
[up-alpha-query-command]: /reference/cli-reference
[sort-by-flag]: /reference/cli-reference
[label-columns]: /reference/cli-reference
[debug-flag]: /reference/cli-reference
[kubectl-conventions]: https://kubernetes.io/docs/reference/kubectl/generated/kubectl_get/
