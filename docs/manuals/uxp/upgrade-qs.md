---
title: Upgrade to UXP quickstart
sidebar_label: Upgrade to UXP Quickstart 
description: Upgrade a Crossplane cluster to UXP and connect it to a Hub, on your laptop
sidebar_position: 1
---

This quickstart runs an open source Crossplane cluster on your laptop, upgrades
it to Upbound Crossplane (UXP), and connects it to a Hub. It takes about 20
minutes and uses two local kind clusters that you delete when you're done.

You start with a Crossplane control plane running a real workload, so you can
watch that workload come through the upgrade unchanged and then appear in the
Hub Console.

To upgrade a control plane you already run, follow [Upgrade Crossplane v2 to
Upbound Crossplane][upgrade-howto] instead.

## Prerequisites

Before you begin, make sure you have:

* [Docker](https://docs.docker.com/get-started/get-docker/)
* [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)
* `kubectl`
* `helm` version `v3.8.0` or later

## Create a Crossplane cluster

<!-- vale gitlab.FutureTense = NO -->
Create a kind cluster and install open source Crossplane. You'll install a
configuration on this control plane to walk through the upgrade process. 
<!-- vale gitlab.FutureTense = YES -->

```shell
kind create cluster --name uxp-upgrade-demo
```

When you create the cluster, your kubecontext switches to
`kind-uxp-upgrade-demo`. Now, install Crossplane on your demo cluster.

```shell helm repo add crossplane-stable https://charts.crossplane.io/stable &&
helm repo update

helm install crossplane crossplane-stable/crossplane \
  --namespace crossplane-system --create-namespace \
  --version 2.3.4 --wait
```

## Install a Configuration

This demo uses `configuration-app` which offers an `App` API that deploys a Ghost
blog as a Helm release.

```shell
kubectl apply -f - <<'EOF'
apiVersion: pkg.crossplane.io/v1
kind: Configuration
metadata:
  name: configuration-app
spec:
  package: xpkg.upbound.io/upbound/configuration-app:v2.1.0
EOF
```

Installing the Configuration also installs what it depends on, including
`provider-helm`. Wait for both to become healthy:

```shell
kubectl wait --for=condition=healthy configuration/configuration-app --timeout=5m
kubectl wait --for=condition=healthy provider/upbound-provider-helm --timeout=5m
```

<!-- vale Google.Headings = NO -->
## Configure the Helm provider
<!-- vale Google.Headings = YES -->

`provider-helm` needs a `ProviderConfig`, permission to create resources, and
the database credentials the Ghost chart reads.

```shell
kubectl apply -f - <<'EOF'
apiVersion: helm.m.crossplane.io/v1beta1
kind: ProviderConfig
metadata:
  name: default
  namespace: default
spec:
  credentials:
    source: InjectedIdentity
EOF
```

```shell
kubectl create clusterrolebinding crossplane-provider-helm-cluster-admin \
  --clusterrole=cluster-admin \
  --group=system:serviceaccounts:crossplane-system

kubectl -n default create secret generic ghost-db \
  --from-literal=host=mariadb.default.svc.cluster.local \
  --from-literal=username=ghost \
  --from-literal=password=ghost
```

:::warning
This grants `cluster-admin` to Crossplane's ServiceAccounts to keep the
quickstart short. Scope the provider's permissions down in a real cluster.
:::

## Create a composite resource

Create an `App`. Crossplane composes it into a Helm `Release` that deploys
Ghost.

```shell
kubectl apply -f - <<'EOF'
apiVersion: platform.upbound.io/v1alpha1
kind: App
metadata:
  name: quickstart
  namespace: default
spec:
  parameters:
    providerConfigName: default
    helm:
      chart:
        name: ghost
        repo: "oci://registry-1.docker.io/bitnamicharts"
        version: 25.0.4
      wait: false
    passwordSecretRef:
      namespace: default
      name: ghost-db
EOF
```

## Record the state you're upgrading from

```shell
helm list -n crossplane-system
kubectl get pkg
kubectl get app,releases.helm.m.crossplane.io -n default
```

`helm list` shows chart `crossplane-2.3.4`. The `App` and its `Release` both
show `SYNCED: True` and `READY: True`. You compare against these same commands
after the upgrade.

## Upgrade to UXP

UXP needs permission to create the Kubernetes resources its added controllers
manage. Grant it before you upgrade.

```shell
kubectl apply -f - <<'EOF'
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: crossplane-clusteradmin
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: crossplane
  namespace: crossplane-system
EOF
```

UXP versions match the Crossplane version they build on, up to an `-up.N`
suffix. This cluster runs Crossplane `2.3.4`, so upgrade it to `2.3.4-up.2`.

```shell
export UXP_VERSION=2.3.4-up.2

helm repo add upbound-stable https://charts.upbound.io/stable && helm repo update

helm upgrade --install crossplane --namespace crossplane-system \
  upbound-stable/crossplane --version "${UXP_VERSION}" --wait
```

## Confirm the workload survived

```shell
helm list -n crossplane-system
kubectl get pkg
kubectl get app,releases.helm.m.crossplane.io -n default
kubectl get composite -A
```

`helm list` now shows chart `crossplane-2.3.4-up.2`. Every package is still
`INSTALLED: True` and `HEALTHY: True`, and the same `App` and `Release` are
still `READY: True`. The upgrade replaced the control plane underneath your
resources without touching the resources themselves.

<!-- vale Google.Headings = NO -->
## Create a Hub cluster
<!-- vale Google.Headings = YES -->

The Hub gives you one API and Console for every control plane you run. Run one
on a second kind cluster in demo mode, which bundles the Postgres, OIDC, and
Gateway that a production install expects you to bring yourself.

Demo mode publishes the Hub gateway on node port `30443`, so map it to `8443`
on your machine when you create the cluster.

```shell
kind create cluster --name hub-quickstart --config - <<'EOF'
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: hub-quickstart
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 30443
        hostPort: 8443
        protocol: TCP
EOF
```
When your create this cluster your kubecontext switches to `kind-hub-quickstart`. The
remaining commands name their context explicitly.

```shell
helm upgrade --install hub oci://xpkg.upbound.io/upbound/hub \
  --kube-context kind-hub-quickstart \
  --namespace hub --create-namespace --version 1.0.0 \
  --set global.demo.enabled=true --wait
```

:::warning
The demo PostgreSQL writes to an `emptyDir`, so its pod losing its node loses
your Hub data. Demo mode is for trying the Hub out. Don't run it in production.
:::

<!-- vale Google.Headings = NO -->
## Expose the Hub API
<!-- vale Google.Headings = YES -->

:::important
This step exists only because you're connecting two kind clusters. A production
install routes all traffic through a Gateway.
:::

In demo mode, `hub-core` and its token exchange are ClusterIP Services,
reachable only from inside the Hub cluster. Add two NodePort Services alongside
them so your UXP cluster can connect over the Docker network.

```shell
kubectl --context kind-hub-quickstart -n hub apply -f - <<'EOF'
apiVersion: v1
kind: Service
metadata:
  name: hub-core-nodeport
spec:
  type: NodePort
  selector:
    app.kubernetes.io/name: hub-core
    app.kubernetes.io/instance: hub
  ports:
    - name: http
      port: 8080
      targetPort: http
      nodePort: 30080
---
apiVersion: v1
kind: Service
metadata:
  name: hub-core-token-exchange-nodeport
spec:
  type: NodePort
  selector:
    app.kubernetes.io/name: hub-core
    app.kubernetes.io/instance: hub
  ports:
    - name: token-exchange
      port: 8444
      targetPort: token-exchange
      nodePort: 30444
EOF
```

The selectors match the labels the `hub-core` Pods already carry, so these
Services route to the running API without changing the originals. 


## Create a registration token

Every control plane gets its own registration token. The connector presents that
token the first time it contacts the Hub API, which tells the Hub which control
plane the connector speaks for.

1. Open the [control planes
   page](https://hub.127.0.0.1.nip.io:8443/infrastructure/control-planes) and
   sign in as `admin` with the password `admin`. The demo uses a self-signed
   certificate, so accept your browser's warning to continue.
2. Register a control plane in the `default` realm and name it `upgraded`.
3. Copy the registration token. The Hub displays it once.
4. Save it for the next step:

```shell
export REG_TOKEN=<paste-registration-token-here>
```

## Connect the upgraded control plane

Install `hub-connector` on the UXP cluster. It dials
`hub-quickstart-control-plane:30080` for the API and `:30444` for token
exchange. Docker resolves that hostname to the Hub cluster's node container
with its embedded DNS.

```shell
kubectl --context kind-uxp-upgrade-demo create namespace hub

kubectl --context kind-uxp-upgrade-demo -n hub \
  create secret generic hub-connector-credentials \
  --from-literal=registrationToken="$REG_TOKEN"

helm install hub-connector oci://xpkg.upbound.io/upbound/hub-connector \
  --kube-context kind-uxp-upgrade-demo \
  --version 1.0.0 --namespace hub \
  --set connector.hub.url=http://hub-quickstart-control-plane:30080 \
  --set connector.hub.tokenExchangeUrl=http://hub-quickstart-control-plane:30444 \
  --set connector.hub.allowInsecure=true \
  --set connector.credentials.existingSecretRef.name=hub-connector-credentials \
  --wait --timeout 2m
```

Confirm the connector is running:

```shell
kubectl --context kind-uxp-upgrade-demo -n hub get pods
```
## See the upgraded control plane in the Hub

The [control planes
page](https://hub.127.0.0.1.nip.io:8443/infrastructure/control-planes) now
lists `upgraded` with a `Ready` status.

Open the [resources
page](https://hub.127.0.0.1.nip.io:8443/explore/resources) and filter by that
control plane. The `App` you created before the upgrade, the `Release` it
composes, and the packages UXP now manages all appear there.

## Clean up

```shell
kind delete cluster --name uxp-upgrade-demo
kind delete cluster --name hub-quickstart
```

## Next steps

* [Upgrade Crossplane v2 to Upbound Crossplane][upgrade-howto] for upgrading a
  control plane you already run
* [Insights][insights] for everything the **Explore** pages can do
* [Builders workshop][builders-workshop] for real cloud resources
* [Crossplane Web UI][web-ui] to browse all your managed resources
* [Upbound Query API][query-api] to query resource states in real time

[upgrade-howto]: /manuals/uxp/howtos/upgrade-to-uxp
[insights]: /hub/products/insights/overview
[builders-workshop]: /getstarted/builders-workshop/project-foundations
[web-ui]: /manuals/console/self-service/#key-features
[query-api]: /manuals/console/query-api/
