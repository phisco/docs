---
title: Try the hub
description: Run Hub on kind, connect two Crossplane control planes, and query the fleet from one screen.
---

This quickstart installs and runs the hub API locally and connects two
Crossplane control planes to it. By the end you have a three control plane fleet
and a Console that queries across the fleet. You can check which resources
exist, types and where they exist, and which control plane runs an older package
version.

Budget about 30 minutes. Everything runs in local `kind` clusters and needs no
cloud credentials.

:::warning
This quickstart uses the chart's demo mode. Demo mode bundles PostgreSQL,
Keycloak, and the Envoy Gateway controller with fixed credentials, ephemeral
storage, and a self-signed certificate. Don't run it in production. For a real
install, see [Installing hub][install].
:::

## What you build

| Cluster | Role |
| --- | --- |
| `hub` | Runs hub, the bundled Postgres and Keycloak, and the Console. Registers itself as the `default` control plane. |
| `ctp-payments` | Crossplane control plane running `provider-nop` v0.4.0. |
| `ctp-analytics` | Crossplane control plane running `provider-nop` v0.5.0. |

The two control plane clusters run the same composite type on different provider
versions. That difference is what the fleet views surface later.

## Prerequisites

- [Docker](https://docs.docker.com/get-started/get-docker/) with at least 8 CPU cores
  and 8 GB of memory available
- [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation) v0.20 or
  later
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Helm](https://helm.sh/docs/intro/install/) 3
- The [up CLI][upCli] and an Upbound account

Log in before you start. The hub chart lives in Upbound's registry:

```shell
up login
```

## Step 1: Create the hub cluster

Demo mode exposes the Console through an Envoy Gateway on node port `30443`. Map
that node port to a host port so you can open the Console in a browser.

1. Write the cluster config.

   ```yaml title="hub-cluster.yaml"
   kind: Cluster
   apiVersion: kind.x-k8s.io/v1alpha4
   name: hub
   nodes:
     - role: control-plane
       extraPortMappings:
         - containerPort: 30443
           hostPort: 8443
           protocol: TCP
   ```

2. Create the cluster.

   ```shell
   kind create cluster --config hub-cluster.yaml
   ```

   kind attaches every cluster it creates to a shared Docker network named
   `kind`, and names the node container `<cluster-name>-control-plane`. The
   control plane clusters you create in step 4 reach this one at
   `hub-control-plane`.

## Step 2: Install hub

1. Install the umbrella chart with demo mode on.

   The two `NodePort` settings expose the `hub-core` API and its token exchange
   endpoint so connectors running in the other kind clusters can reach them. A
   production install routes this traffic through a gateway instead.

   ```shell
   helm upgrade --install hub oci://xpkg.upbound.io/upbound/hub \
     --namespace hub --create-namespace \
     --version 1.0.0 \
     --set global.demo.enabled=true \
     --set hub-core.api.service.api.type=NodePort \
     --set hub-core.api.tokenExchange.service.type=NodePort
   ```

2. Wait for the stack to come up. The first install runs a database migration
   before `hub-core` starts, so this takes up to 5 minutes.

   ```shell
   kubectl --context kind-hub -n hub wait --for=condition=ready pod --all --timeout=10m
   ```

3. Read back the node ports Kubernetes assigned. Step 6 points the connectors at
   them, so stay in this shell or note the values down.

   ```shell
   HUB_API_PORT=$(kubectl --context kind-hub -n hub get svc hub-core \
     -o jsonpath='{.spec.ports[?(@.name=="http")].nodePort}')
   HUB_TOKEN_PORT=$(kubectl --context kind-hub -n hub get svc hub-core-token-exchange \
     -o jsonpath='{.spec.ports[?(@.name=="token-exchange")].nodePort}')

   echo "api=$HUB_API_PORT token-exchange=$HUB_TOKEN_PORT"
   ```

   :::note
   Chart version 1.0.0 rejects an explicit
   `hub-core.api.service.api.nodePort`, so you can't pin these ports at install
   time. Kubernetes allocates them from the node port range instead.
   :::

Demo mode bootstraps four things for you:

- A Keycloak identity provider named `keycloak`, with a set of demo users.
- A `default` control plane in the `default` realm, representing the hub cluster
  itself.
- An `OrganizationRoleBinding` granting the `keycloak:admin` group organization
  admin.
- A `RealmRoleBinding` granting the same group admin on the `default` realm.

:::info
A realm is the namespace a control plane lives in. Organization roles govern
realms, identity, and role bindings. Realm roles govern the control planes and
resources inside a realm. Both bindings exist because organization admin alone
doesn't grant access to a realm's contents. See [Access and
authorization][rbac].
:::

## Step 3: Sign in to the Console

1. Open `https://hub.127.0.0.1.nip.io:8443`.

   Demo mode serves the Console, the hub API, and Keycloak from this one
   hostname, routed by path. The gateway presents a self-signed certificate, so
   your browser warns you on first visit. Choose **Advanced**, then proceed.

2. Sign in as `admin` with the password `admin`.

3. Open the control planes view. One control plane, `default`, is already
   registered and `Ready`. Its resources are the hub cluster's own.

Demo mode also creates users with narrower access. Keep them for step 7:

| User | Password | Access |
| --- | --- | --- |
| `admin` | `admin` | Organization admin and realm admin on `default` |
| `editor-alice` | `password` | Editor |
| `editor-bob` | `password` | Editor |
| `viewer-charlie` | `password` | Read-only |

## Step 4: Create two Crossplane control planes

Each cluster gets UXP, `provider-nop` at a different version, a composite
resource definition, and composite resources. The differing provider
versions give the fleet views something to compare.

1. Create the two clusters.

   ```shell
   kind create cluster --name ctp-payments
   kind create cluster --name ctp-analytics
   ```

2. Install UXP in each one.

   ```shell
   for ctx in kind-ctp-payments kind-ctp-analytics; do
     up uxp install --kubecontext "$ctx"
     kubectl --context "$ctx" -n crossplane-system \
       wait --for=condition=ready pod --all --timeout=5m
   done
   ```

3. Install the packages. `ctp-payments` gets `provider-nop` v0.4.0 and
   `ctp-analytics` gets v0.5.0.

   ```shell
   install_packages() {
     kubectl --context "$1" apply -f - <<EOF
   apiVersion: pkg.crossplane.io/v1
   kind: Provider
   metadata:
     name: provider-nop
   spec:
     package: xpkg.upbound.io/crossplane-contrib/provider-nop:$2
   ---
   apiVersion: pkg.crossplane.io/v1beta1
   kind: Function
   metadata:
     name: function-patch-and-transform
   spec:
     package: xpkg.upbound.io/crossplane-contrib/function-patch-and-transform:v0.9.0
   EOF
     kubectl --context "$1" wait --for=condition=healthy provider/provider-nop --timeout=5m
     kubectl --context "$1" wait --for=condition=healthy function/function-patch-and-transform --timeout=5m
   }

   install_packages kind-ctp-payments v0.4.0
   install_packages kind-ctp-analytics v0.5.0
   ```

4. Define a composite type in both clusters.

   ```shell
   for ctx in kind-ctp-payments kind-ctp-analytics; do
     kubectl --context "$ctx" apply -f - <<'EOF'
   apiVersion: apiextensions.crossplane.io/v1
   kind: CompositeResourceDefinition
   metadata:
     name: xapps.example.upbound.io
   spec:
     group: example.upbound.io
     names:
       kind: XApp
       plural: xapps
     versions:
       - name: v1alpha1
         served: true
         referenceable: true
         schema:
           openAPIV3Schema:
             type: object
             properties:
               spec:
                 type: object
   ---
   apiVersion: apiextensions.crossplane.io/v1
   kind: Composition
   metadata:
     name: xapps.example.upbound.io
   spec:
     compositeTypeRef:
       apiVersion: example.upbound.io/v1alpha1
       kind: XApp
     mode: Pipeline
     pipeline:
       - step: create-nop
         functionRef:
           name: function-patch-and-transform
         input:
           apiVersion: pt.fn.crossplane.io/v1beta1
           kind: Resources
           resources:
             - name: nop
               base:
                 apiVersion: nop.crossplane.io/v1alpha1
                 kind: NopResource
                 spec:
                   forProvider:
                     conditionAfter:
                       - conditionType: Ready
                         conditionStatus: "True"
                         time: 5s
   EOF
     kubectl --context "$ctx" wait --for=condition=established \
       crd/xapps.example.upbound.io --timeout=2m
   done
   ```

5. Create composite resources. Give each cluster a different count so the
   aggregate views show something other than a tie.

   ```shell
   for n in 1 2 3; do
     kubectl --context kind-ctp-payments create -f - <<EOF
   apiVersion: example.upbound.io/v1alpha1
   kind: XApp
   metadata:
     name: payments-$n
   spec: {}
   EOF
   done

   kubectl --context kind-ctp-analytics create -f - <<'EOF'
   apiVersion: example.upbound.io/v1alpha1
   kind: XApp
   metadata:
     name: analytics-1
   spec: {}
   EOF
   ```

## Step 5: Register each control plane

Registering a control plane in hub returns a one-time registration token. The
connector presents that token the first time it contacts `hub-core`.

Do this once per cluster.

1. In the Console, open the control planes view for the `default` realm.

2. Select **Create control plane** and name it `payments`.

3. Copy the registration token the Console displays and set it as a shell
   variable.

   ```shell
   PAYMENTS_TOKEN=<paste-registration-token>
   ```

   :::warning
   The Console shows the token once. It's valid for 24 hours and single-use. If
   you lose it, reissue the token, which invalidates the old one.
   :::

4. Repeat for `analytics`.

   ```shell
   ANALYTICS_TOKEN=<paste-registration-token>
   ```

## Step 6: Install the connector

The connector runs inside each control plane cluster, exchanges its registration
token for a hub credential, and streams resource state to `hub-core`.

1. Install the connector in `ctp-payments`.

   ```shell
   kubectl --context kind-ctp-payments create namespace upbound-system

   kubectl --context kind-ctp-payments -n upbound-system \
     create secret generic hub-connector-credentials \
     --from-literal=registrationToken="$PAYMENTS_TOKEN"

   helm install hub-connector oci://xpkg.upbound.io/upbound/hub-connector \
     --kube-context kind-ctp-payments \
     --namespace upbound-system \
     --version 1.0.0 \
     --set connector.hub.url=http://hub-control-plane:$HUB_API_PORT \
     --set connector.hub.tokenExchangeUrl=http://hub-control-plane:$HUB_TOKEN_PORT \
     --set connector.hub.allowInsecure=true
   ```

   `$HUB_API_PORT` and `$HUB_TOKEN_PORT` come from step 2.
   `connector.hub.allowInsecure` permits plaintext HTTP to the hub. It's needed
   here because the node ports you exposed in step 2 don't end TLS. A real
   install points the connector at an HTTPS gateway and leaves this at its
   default of `false`.

2. Install the connector in `ctp-analytics`.

   ```shell
   kubectl --context kind-ctp-analytics create namespace upbound-system

   kubectl --context kind-ctp-analytics -n upbound-system \
     create secret generic hub-connector-credentials \
     --from-literal=registrationToken="$ANALYTICS_TOKEN"

   helm install hub-connector oci://xpkg.upbound.io/upbound/hub-connector \
     --kube-context kind-ctp-analytics \
     --namespace upbound-system \
     --version 1.0.0 \
     --set connector.hub.url=http://hub-control-plane:$HUB_API_PORT \
     --set connector.hub.tokenExchangeUrl=http://hub-control-plane:$HUB_TOKEN_PORT \
     --set connector.hub.allowInsecure=true
   ```

3. Confirm both connectors are running.

   ```shell
   for ctx in kind-ctp-payments kind-ctp-analytics; do
     kubectl --context "$ctx" -n upbound-system wait --for=condition=ready pod \
       --selector app.kubernetes.io/name=hub-connector --timeout=3m
   done
   ```

4. Refresh the Console. The control planes view now lists `default`, `payments`,
   and `analytics`, all `Ready`.

   A control plane stays `Pending` until its connector registers. If one doesn't
   turn `Ready`, see [Troubleshooting](#troubleshooting).

## Step 7: Query the fleet

Everything below happens in one Console, against all three control planes, with
no `kubectl` context switching.

### Find resources across control planes

Open the resources view. It lists every resource the connectors report, from all
three control planes at once, with sort, filter, and search.

Try these:

- Search for `XApp`. Four composites come back: three from `payments`, one from
  `analytics`.
- Filter by control plane `analytics`. The list narrows to that cluster without
  changing the query.
- Filter by health to isolate resources that aren't `Ready`.

:::note
By default the connector syncs only resources authorized by the
`crossplane-admin` ClusterRole, so you see Crossplane resources rather than every
object in the cluster. Widen `connector.sync.limitToClusterRoles`, or set it to
`[]`, to sync more.
:::

### Roll resources up into counts

Group the resource list by health, label, annotation, or creation time.
Each grouping answers a fleet-wide question in one screen, such as how many
composites are `Ready` right now across all three control planes.

Hub keeps these aggregations as time series, so the same counts also show up as
trends rather than a single snapshot. The trend line is thin right now because
your fleet is minutes old.

### Compare types across the fleet

Open the types view. Hub indexes the CRDs and XRDs installed in every connected
control plane, so `XApp` appears once with both `payments` and `analytics`
listed underneath it.

This view is where schema drift shows up. Change the XRD in one cluster and the
two control planes stop agreeing on the same type:

```shell
kubectl --context kind-ctp-analytics patch xrd xapps.example.upbound.io \
  --type=json \
  -p='[{"op":"add","path":"/spec/names/shortNames","value":["xa"]}]'
```

After the next rediscovery interval, about 20 seconds, the types view reflects
the change on `analytics` only.

### Spot package version drift

Open the packages view. Hub lists every Provider, Configuration, and Function
across the fleet alongside the version each control plane runs.

`provider-nop` appears with two versions: v0.4.0 on `payments` and v0.5.0 on
`analytics`. You set this drift up in step 4, and finding it takes a single
lookup instead of one `kubectl get providers` per cluster.

Upgrade `payments` to match and watch the entry collapse to one version:

```shell
kubectl --context kind-ctp-payments patch provider provider-nop \
  --type=merge \
  -p '{"spec":{"package":"xpkg.upbound.io/crossplane-contrib/provider-nop:v0.5.0"}}'
```

### See how access scopes the view

Sign out and sign back in as `viewer-charlie` with the password `password`.

The fleet views only show control planes in realms the signed-in user can access,
and counts reflect that scope. An operator with partial access sees partial
totals, not an error. Sign back in as `admin` to restore the full view.

:::note
Catalog, which indexes the package images behind those providers and makes them
searchable, is a preview feature and off by default. See [Catalog][catalog] to
enable it.
:::

## Troubleshooting

### A control plane stays Pending

The connector hasn't completed registration. Check its logs:

```shell
kubectl --context kind-ctp-payments -n upbound-system logs deployment/hub-connector
```

The most common cause is the connector failing to reach
`hub-control-plane:$HUB_API_PORT`, which happens when the cluster didn't join the shared
`kind` Docker network. Attach it and restart the connector:

```shell
docker network connect kind ctp-payments-control-plane
kubectl --context kind-ctp-payments -n upbound-system \
  rollout restart deployment hub-connector
```

### The connector logs an authentication error

The registration token expired, or something already used it. Reissue a token
for the control plane in the Console, update the secret, and restart the
connector:

```shell
kubectl --context kind-ctp-payments -n upbound-system \
  delete secret hub-connector-credentials

kubectl --context kind-ctp-payments -n upbound-system \
  create secret generic hub-connector-credentials \
  --from-literal=registrationToken="<new-token>"

kubectl --context kind-ctp-payments -n upbound-system \
  rollout restart deployment hub-connector
```
<!-- vale gitlab.FutureTense = NO -->
<!-- vale Google.Headings = NO -->
### The Console won't load
<!-- vale Google.Headings = YES -->
<!-- vale gitlab.FutureTense = YES -->

Confirm the gateway data plane is serving on node port `30443`:

```shell
kubectl --context kind-hub -n hub get svc \
  -l gateway.envoyproxy.io/owning-gateway-name=hub-gateway
```

If you created the `hub` cluster without the `extraPortMappings` from step 1,
reach the Console with a port-forward instead:

```shell
kubectl --context kind-hub -n hub port-forward \
  "svc/$(kubectl --context kind-hub -n hub get svc \
    -l gateway.envoyproxy.io/owning-gateway-name=hub-gateway \
    -o jsonpath='{.items[0].metadata.name}')" 8443:8443
```

### Resources appear for a control plane but not the ones you expect

The connector syncs only what the `crossplane-admin` ClusterRole authorizes.
Widen the filter and upgrade the release:

```shell
helm upgrade hub-connector oci://xpkg.upbound.io/upbound/hub-connector \
  --version 1.0.0 \
  --kube-context kind-ctp-payments \
  --namespace upbound-system \
  --reuse-values \
  --set 'connector.sync.limitToClusterRoles=[]'
```

## Clean up

Delete all three clusters:

```shell
kind delete cluster --name ctp-analytics
kind delete cluster --name ctp-payments
kind delete cluster --name hub
```

## Next steps

- [Installing the hub API][install] to run against your own PostgreSQL, OIDC
  provider, and gateway.
- [Connect a control plane][connect] for the connector install against a real
  hub, including the kubectl path for minting registration tokens.
- [Production overview][production] for sizing, high availability, autoscaling,
  and upgrades.

[install]: ./howtos/install.md
[connect]: ./howtos/connect-control-plane.md
[production]: ./howtos/production-overview.md
[rbac]: ./iam/access-management/overview.md
[catalog]: ./products/insights/catalog/overview.md
[upCli]: /manuals/cli/overview
