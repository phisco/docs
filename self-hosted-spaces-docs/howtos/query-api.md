---
title: Query API
sidebar_position: 40
description: Use the `up` CLI to query objects and resources
---

<!-- vale write-good.TooWordy = NO -->
<!-- ignore "aggregate" -->

:::warning Deprecated

The Query API (`query.spaces.upbound.io`), backed by Apollo, is deprecated as of
Spaces 1.18 and will be removed in a future release.

:::

Upbound's Query API allows users to inspect objects and resources within their control planes. The read-only `up alpha query` and `up alpha get` CLI commands allow you to gather information on your control planes in a fast and efficient package. These commands follow the [`kubectl` conventions][kubectl-conventions] for filtering, sorting, and retrieving information from your Space.

Query API requires a PostgreSQL database to store the data. You can use the default PostgreSQL instance provided by Upbound or bring your own PostgreSQL instance.

## Managed setup

:::tip
If you don't have specific requirements for your setup, Upbound recommends following this approach.
:::

To enable this feature, set `features.alpha.apollo.enabled=true` and `apollo.apollo.storage.postgres.create=true` when installing Spaces.

However, you need to install CloudNativePG (`CNPG`) to provide the PostgreSQL instance. You can let the `up` CLI do this for you, or install it manually.

For more customization, see the [Helm chart reference][helm-chart-reference]. You can modify the number
of PostgreSQL instances, pooling instances, storage size, and more.

If you have specific requirements not addressed in the Helm chart, see below for more information on how to bring your own [PostgreSQL setup][postgresql-setup].

### Using the up CLI

Before you begin, make sure you have the most recent version of the [`up` CLI installed][up-cli-installed].

To enable this feature, set `features.alpha.apollo.enabled=true` and `apollo.apollo.storage.postgres.create=true` when installing Spaces:

```bash
up space init --token-file="${SPACES_TOKEN_PATH}" "v${SPACES_VERSION}" \
  ...
  --set "features.alpha.apollo.enabled=true" \
  --set "apollo.apollo.storage.postgres.create=true"
```

`up space init` and `up space upgrade` install CloudNativePG automatically, if needed.

### Helm chart

If you are installing the Helm chart in some other way, you can manually install CloudNativePG in one of the [supported ways][supported-ways], for example:

```shell
kubectl apply --server-side -f \
             https://github.com/cloudnative-pg/cloudnative-pg/releases/download/v1.24.1/cnpg-1.24.1.yaml
kubectl rollout status -n cnpg-system deployment cnpg-controller-manager -w --timeout 120s
```

Next, install the Spaces Helm chart with the necessary values, for example:

```shell
helm -n upbound-system upgrade --install spaces \
  oci://xpkg.upbound.io/spaces-artifacts/spaces \
  --version "${SPACES_VERSION}" \
  ...
  --set "features.alpha.apollo.enabled=true" \
  --set "apollo.apollo.storage.postgres.create=true" \
  --wait
```
<!-- vale Google.Headings = NO -->
## Self-hosted PostgreSQL configuration
<!-- vale Google.Headings = YES -->

If your workflow requires more customization, you can provide your own
PostgreSQL instance and configure credentials manually.

Using your own PostgreSQL instance requires careful architecture consideration.
Review the architecture and requirements guidelines.

### Architecture

The Query API architecture uses three components, other than a PostgreSQL database:
* **Apollo Syncers**: Watching `ETCD` for changes and syncing them to PostgreSQL. One, or more, per control plane.
* **Apollo Server**: Serving the Query API out of the data in PostgreSQL. One, or more, per Space.

The default setup also uses the `PgBouncer` connection pooler to manage connections from the syncers.
```mermaid
graph LR
    User[User]
    
    subgraph Cluster["Cluster (Spaces)"]
        direction TB
        Apollo[apollo]
        
        subgraph ControlPlanes["Control Planes"]
            APIServer[API Server]
            Syncer[apollo-syncer]
        end
    end
    
    PostgreSQL[(PostgreSQL)]
    
    User -->|requests| Apollo
    
    Apollo -->|connects| PostgreSQL
    Apollo -->|creates schemas & users| PostgreSQL
    
    Syncer -->|watches| APIServer
    Syncer -->|writes| PostgreSQL
    
    PostgreSQL -->|data| Apollo
    
    style PostgreSQL fill:#e1f5ff,stroke:#333,stroke-width:2px,color:#000
    style Apollo fill:#ffe1e1,stroke:#333,stroke-width:2px,color:#000
    style Cluster fill:#f0f0f0,stroke:#333,stroke-width:2px,color:#000
    style ControlPlanes fill:#fff,stroke:#666,stroke-width:1px,stroke-dasharray: 5 5,color:#000
```


Each component needs to connect to the PostgreSQL database.

In the event of database issues, you can provide a new database and the syncers
automatically repopulate the data.

### Requirements

* A PostgreSQL 16 instance or cluster.
* A database, for example named `upbound`.
* **Optional**: A dedicated user for the Apollo Syncers, otherwise the Spaces Controller generates a dedicated set of credentials per syncer with the necessary permissions, for example named `syncer`.
* A dedicated **superuser or admin account** for the Apollo Server.
* **Optional**: A connection pooler, like PgBouncer, to manage connections from the Apollo Syncers. If you didn't provide the optional users, you might have to configure the pooler to allow users to connect using the same credentials as PostgreSQL.
* **Optional**: A read replica for the Apollo Syncers to connect to, to reduce load on the primary database, this might cause a slight delay in the data being available through the Query API.

Below you can find examples of setups to get you started, you can mix and match the examples to suit your needs.

### In-cluster setup

<!-- vale gitlab.SentenceLength = NO -->
:::tip

If you don't have strong opinions on your setup, but still want full control on
the resources created for some unsupported customizations, Upbound recommends
the in-cluster setup.

:::
<!-- vale gitlab.SentenceLength = YES -->

For more customization than the managed setup, you can use CloudNativePG for
PostgreSQL in the same cluster.

For in-cluster setup, manually deploy the operator in one of the [supported ways][supported-ways-1], for example:

```shell
kubectl apply --server-side -f \
             https://github.com/cloudnative-pg/cloudnative-pg/releases/download/v1.24.1/cnpg-1.24.1.yaml
kubectl rollout status -n cnpg-system deployment cnpg-controller-manager -w --timeout 120s
```

Then create a `Cluster` and `Pooler` in the `upbound-system` namespace, for example:

```shell
kubectl create ns upbound-system

kubectl apply -f - <<EOF
---
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: spaces-apollo-pg
  namespace: upbound-system
spec:
  instances: 2
  imageName: ghcr.io/cloudnative-pg/postgresql:16
  bootstrap:
    initdb:
      database: upbound
      owner: apollo
      postInitApplicationSQL:
      - ALTER ROLE "apollo" CREATEROLE;
  certificates:
    serverAltDNSNames:
      - spaces-apollo-pg-pooler
      - spaces-apollo-pg-pooler.upbound-system
      - spaces-apollo-pg-pooler.upbound-system.svc
      - spaces-apollo-pg-pooler.upbound-system.svc.cluster.local
  storage:
    size: 10Gi
---
apiVersion: postgresql.cnpg.io/v1
kind: Pooler
metadata:
  name: spaces-apollo-pg-pooler
  namespace: upbound-system
spec:
  cluster:
    name: spaces-apollo-pg
  pgbouncer:
    poolMode: transaction
    parameters:
      max_client_conn: "1000"
      default_pool_size: "10"
      max_prepared_statements: "1000"
  instances: 2
  type: rw
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-syncer-ingress-to-apollo-pg
  namespace: upbound-system
spec:
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: mxp-apollo-syncer
      ports:
        - port: 5432
          protocol: TCP
  podSelector:
    matchLabels:
      cluster: spaces-apollo-pg
  policyTypes:
    - Ingress
EOF
```

Adjust the `Cluster` and `Pooler` resources to your needs, for example by changing the `spec.storage.size` or `spec.imageName`.

CloudNativePG takes care of setting up the necessary Secrets.

Next, configure Spaces to use the CloudNativePG secrets:

```shell
helm upgrade --install ... \
  --set "features.alpha.apollo.enabled=true" \
  --set "apollo.apollo.storage.postgres.create=false" \
  --set "apollo.apollo.storage.postgres.connection.apollo.credentials.user=apollo" \
  --set "apollo.apollo.storage.postgres.connection.url=spaces-apollo-pg-rw:5432" \
  --set "apollo.apollo.storage.postgres.connection.credentials.secret.name=spaces-apollo-pg-app" \
  --set "apollo.apollo.storage.postgres.connection.credentials.format=basicauth" \
  --set "apollo.apollo.storage.postgres.connection.ca.name=spaces-apollo-pg-ca" \
  --set "apollo.apollo.storage.postgres.connection.syncer.url=spaces-apollo-pg-pooler.upbound-system.svc:5432"
  --set "apollo.apollo.storage.postgres.connection.credentials.user=apollo" \
```

#### Common customisations

Below you can find references to how to customize this setup:

* **Storage**: See the [CloudNativePG documentation][cloudnativepg-documentation] for more information on how to configure the storage.
* **Resources**: See the CloudNativePG documentation for more information on how to configure the resources used by the [PostgreSQL Cluster][postgresql-cluster] and the [Pooler][pooler].
* **High Availability**: See the CloudNativePG documentation for more information on how to configure replication for the [PostgreSQL Cluster][postgresql-cluster-2] and the [Pooler][pooler-3].
* **Images used**: See the CloudNativePG documentation for more information on how to configure the images used by the [PostgreSQL Cluster][postgresql-cluster-4] and the [Pooler][pooler-5].
* **PostgreSQL configuration**: See the [CloudNativePG documentation][cloudnativepg-documentation-6] for more information on how to configure the PostgreSQL instances, for example `max_connections`, `shared_buffers`, etc.
<!-- vale Google.Headings = NO -->

### External setup

<!-- vale Google.Headings = YES -->
:::tip
Use this method if you decide the `apollo` manager can manage credentials , but your
PostgreSQL instance is outside the cluster.
:::

When using this setup, you must manually create the required Secrets in the
`upbound-system` namespace. The `apollo` user must have permissions to create
schemas and users.

```shell

kubectl create ns upbound-system

# A Secret containing the necessary credentials to connect to the PostgreSQL instance
kubectl create secret generic spaces-apollo-pg-app -n upbound-system \
  --from-literal=password=supersecret

# A Secret containing the necessary CA certificate to verify the connection to the PostgreSQL instance
kubectl create secret generic spaces-apollo-pg-ca -n upbound-system \
  --from-file=ca.crt=/path/to/ca.crt
```

Next, install Spaces with the necessary settings:

```shell
export PG_URL=your-postgres-host:5432
export PG_POOLED_URL=your-pgbouncer-host:5432 # this could be the same as above

helm upgrade --install ... \
  --set "features.alpha.apollo.enabled=true" \
  --set "apollo.apollo.storage.postgres.create=false" \
  --set "apollo.apollo.storage.postgres.connection.url=$PG_URL" \
  --set "apollo.apollo.storage.postgres.connection.credentials.secret.name=spaces-apollo-pg-app" \
  --set "apollo.apollo.storage.postgres.connection.credentials.format=basicauth" \
  --set "apollo.apollo.storage.postgres.connection.ca.name=spaces-apollo-pg-ca" \
  --set "apollo.apollo.storage.postgres.connection.syncer.url=$PG_POOLED_URL"
```

### External setup with all custom credentials

For custom credentials with Apollo Syncers or Server, create a new secret in the
`upbound-system` namespace:

```shell
export APOLLO_SYNCER_USER=syncer
export APOLLO_SERVER_USER=apollo

kubectl create ns upbound-system

# A Secret containing the necessary credentials to connect to the PostgreSQL instance
kubectl create secret generic spaces-apollo-pg-app -n upbound-system \
  --from-literal=password=supersecret

# A Secret containing the necessary CA certificate to verify the connection to the PostgreSQL instance
kubectl create secret generic spaces-apollo-pg-ca -n upbound-system \
  --from-file=ca.crt=/path/to/ca.crt

# A Secret containing the necessary credentials for the Apollo Syncers to connect to the PostgreSQL instance.
# These will be used by all Syncers in the Space.
kubectl create secret generic spaces-apollo-pg-syncer -n upbound-system \
  --from-literal=username=$APOLLO_SYNCER_USER \
  --from-literal=password=supersecret

# A Secret containing the necessary credentials for the Apollo Server to connect to the PostgreSQL instance.
kubectl create secret generic spaces-apollo-pg-apollo -n upbound-system \
  --from-literal=username=$APOLLO_SERVER_USER \
  --from-literal=password=supersecret
```

Next, install Spaces with the necessary settings:

```shell
export PG_URL=your-postgres-host:5432
export PG_POOLED_URL=your-pgbouncer-host:5432 # this could be the same as above

helm ... \
  --set "features.alpha.apollo.enabled=true" \
  --set "apollo.apollo.storage.postgres.create=false" \
  --set "apollo.apollo.storage.postgres.connection.url=$PG_URL" \
  --set "apollo.apollo.storage.postgres.connection.credentials.secret.name=spaces-apollo-pg-app" \
  --set "apollo.apollo.storage.postgres.connection.credentials.format=basicauth" \
  --set "apollo.apollo.storage.postgres.connection.ca.name=spaces-apollo-pg-ca" \
  --set "apollo.apollo.storage.postgres.connection.syncer.url=$PG_POOLED_URL" \

  # For the syncers
  --set "apollo.apollo.storage.postgres.connection.syncer.credentials.format=basicauth" \
  --set "apollo.apollo.storage.postgres.connection.syncer.credentials.user=$APOLLO_SYNCER_USER" \
  --set "apollo.apollo.storage.postgres.connection.syncer.credentials.secret.name=spaces-apollo-pg-syncer" \

  # For the server
  --set "apollo.apollo.storage.postgres.connection.apollo.credentials.format=basicauth" \
  --set "apollo.apollo.storage.postgres.connection.apollo.credentials.user=$APOLLO_SERVER_USER" \
  --set "apollo.apollo.storage.postgres.connection.apollo.credentials.secret.name=spaces-apollo-pg-apollo" \
  --set "apollo.apollo.storage.postgres.connection.apollo.url=$PG_POOLED_URL"
```
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

[postgresql-setup]: #self-hosted-postgresql-configuration
[up-cli-installed]: /manuals/cli/overview
[query-api-documentation]: /manuals/spaces/howtos/query-api

[helm-chart-reference]: /reference/spaces-helm-reference/
[kubectl-conventions]: https://kubernetes.io/docs/reference/kubectl/generated/kubectl_get/
[supported-ways]: https://cloudnative-pg.io/documentation/current/installation_upgrade/
[supported-ways-1]: https://cloudnative-pg.io/documentation/current/installation_upgrade/
[cloudnativepg-documentation]: https://cloudnative-pg.io/documentation/1.24/storage/#configuration-via-a-pvc-template
[postgresql-cluster]: https://cloudnative-pg.io/documentation/1.24/resource_management/
[pooler]: https://cloudnative-pg.io/documentation/1.24/connection_pooling/#pod-templates
[postgresql-cluster-2]: https://cloudnative-pg.io/documentation/1.24/replication/
[pooler-3]: https://cloudnative-pg.io/documentation/1.24/connection_pooling/#high-availability-ha
[postgresql-cluster-4]: https://cloudnative-pg.io/documentation/1.24/operator_capability_levels/#override-of-operand-images-through-the-crd
[pooler-5]: https://cloudnative-pg.io/documentation/1.24/connection_pooling/#pod-templates
[cloudnativepg-documentation-6]: https://cloudnative-pg.io/documentation/1.24/postgresql_conf/

