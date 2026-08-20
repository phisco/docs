---
title: Consume control plane APIs in an app cluster with control plane connector
sidebar_position: 99
description: A tutorial to configure a Space with Argo to declaratively create and
  manage control planes
---

In this tutorial, you learn how to configure a Kubernetes app cluster to communicate with a control plane in an Upbound self-hosted Space.


The [control plane connector][control-plane-connector] bridges your Kubernetes application clusters---running outside of Upbound--to your control planes running in Upbound. This allows you to interact with your control plane's API right from the app cluster. The claim APIs you define via `CompositeResourceDefinitions` are available alongside Kubernetes workload APIs like `Pod`. In effect, control plane connector provides the same experience as a locally installed Crossplane.

## Prerequisites

To complete this tutorial, you need the following:

- Have already deployed an Upbound Space.
- Have already deployed an Kubernetes cluster (referred to as `app cluster`).

## Create a control plane

Create a new control plane in your self-hosted Space. Run the following command in a terminal:

```bash
up ctp create my-control-plane
```

Once the control plane is ready, connect to it.

```bash
up ctx my-control-plane
```

For convenience, install an Upbound [platform reference Configuration][platform-reference-configuration] from the marketplace. For production scenarios, replace this with your own Crossplane Configurations or compositions.

```bash
up ctp configuration install xpkg.upbound.io/upbound/platform-ref-aws:v1.4.0
```

## Fetch the control plane's connection details

Run the following command in a terminal:

```shell
kubectl get secret kubeconfig-my-control-plane -n default -o jsonpath='{.data.kubeconfig}' | base64 -d > kubeconfig-my-control-plane.yaml
```

This command saves the kubeconfig for the control plane to a file in your working directory.

## Install control plane connector in your app cluster

Switch contexts to your Kubernetes app cluster. To install the control plane connector in your app cluster, you must first provide a secret containing your control plane's kubeconfig at install-time. Run the following command in a terminal:

:::important
Run the following commands against your **app cluster**, not your control plane.
:::

```bash
kubectl create secret generic kubeconfig-my-control-plane -n kube-system --from-file=kubeconfig=./kubeconfig-my-control-plane.yaml
```

Set the environment variable below to configure which namespace _in your control plane_ you wish to sync the app cluster's claims to.

```shell
export CONNECTOR_CTP_NAMESPACE=app-cluster-1
```

Install the Control Plane Connector in the app cluster and point it to your control plane.

```bash
up ctp connector install my-control-plane $CONNECTOR_CTP_NAMESPACE --control-plane-secret=kubeconfig-my-control-plane
```

## Inspect your app cluster

After you install Control Plane Connector in the app cluster, you can now see APIs which live on the control plane. You can confirm this is the case by running the following command on your app cluster:

```bash {copy-lines="1"}
kubectl api-resources | grep upbound

# The output should look like this:
sqlinstances                                   aws.platform.upbound.io/v1alpha1       true         SQLInstance
clusters                                       aws.platformref.upbound.io/v1alpha1    true         Cluster
osss                                           observe.platform.upbound.io/v1alpha1   true         Oss
apps                                           platform.upbound.io/v1alpha1           true         App
```

## Claim a database instance on your app cluster

Create a database claim against the `SQLInstance` API and observe resources get created by your control plane. Apply the following resources to your app cluster:

```yaml
cat <<EOF | kubectl apply -f -
apiVersion: aws.platform.upbound.io/v1alpha1
kind: SQLInstance
metadata:
  name: platform-ref-aws-db-postgres
  namespace: default
spec:
  parameters:
    region: us-west-2
    engine: postgres
    engineVersion: "13.7"
    storageGB: 5
    passwordSecretRef:
      namespace: default
      name: psqlsecret
      key: password
    networkRef:
      id: platform-ref-aws
  writeConnectionSecretToRef:
    name: platform-ref-aws-db-conn-postgres
---
apiVersion: v1
data:
  password: dXBiMHVuZHIwY2s1ITMxMzM3
kind: Secret
metadata:
  name: psqlsecret
  namespace: default
type: Opaque
EOF
```

## Inspect your control plane

Switch contexts, connect to your control plane, and look at the managed resources on your control plane. It should look like the following:

:::important
Run the following commands against your **control plane**, not your app cluster.
:::

```bash {copy-lines="1"}
kubectl get managed

# The output should look like this:
NAME                                                             READY   SYNCED   EXTERNAL-NAME   AGE
instance.rds.aws.upbound.io/claim-dd1039cdd0366e1a-xcb52-7nlfk           False                    54s

NAME                                                                READY   SYNCED   EXTERNAL-NAME                        AGE
subnetgroup.rds.aws.upbound.io/claim-dd1039cdd0366e1a-xcb52-vnsnk           False    claim-dd1039cdd0366e1a-xcb52-vnsnk   55s
```

Requesting the list of claims in namespace `app-cluster-1` shows that the claim for the database (originating from the app cluster) actually lives on the control plane:

```bash {copy-lines="1"}
kubectl get SQLInstances -n app-cluster-1

# The output should look like this:
NAME                     SYNCED   READY   CONNECTION-SECRET        AGE
claim-dd1039cdd0366e1a   True     False   claim-5ffa34ecdfd4b372   2m56s
```

## Summary

In this tutorial, you:
- connected an app cluster to a control plane using the Control Plane Connector.
- You experienced how make resource requests from your app cluster to your control plane.
- You saw how resource requests are actually fulfilled by the control plane.


[control-plane-connector]: /self-hosted-spaces/howtos/ctp-connector
[platform-reference-configuration]: https://marketplace.upbound.io/configurations/upbound/platform-ref-aws
