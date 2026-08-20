---
title: Declaratively create control planes
sidebar_position: 99
description: A tutorial to configure a Space with Argo to declaratively create and
  manage control planes
---

In this tutorial, you learn how to configure [Argo CD][argo-cd] to communicate with a self-hosted Space. This flow allows you to declaratively create and manage control planes from Git. Argo CD is a continuous delivery tool for Kubernetes that you can use to drive GitOps flows for your control plane infrastructure.


## Prerequisites

To complete this tutorial, you need the following:

- Have already deployed an Upbound Space.
- Have already deployed an instance of Argo CD on a Kubernetes cluster.

## Connect your Space to Argo CD

Fetch the kubeconfig for the Space cluster, the Kubernetes cluster where you installed the Upbound Spaces software. You must add the Space cluster as a context to Argo.

```ini
export SPACES_CLUSTER_SERVER="https://url"
export SPACES_CLUSTER_NAME="cluster"
```

Switch contexts to the Kubernetes cluster where you've installed Argo. Create a secret on the Argo cluster whose data contains the connection details of the Space cluster.

:::important
Run the following commands against your **Argo** cluster, not your Space cluster.
:::

Run the following command in a terminal:

```yaml
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: space-cluster
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: cluster
type: Opaque
stringData:
  name: ${SPACES_CLUSTER_NAME}
  server: ${SPACES_CLUSTER_SERVER}
  config: |
    {
      # configure this section!
    }
EOF
```

:::tip
Read the [Argo CD documentation][argo-cd-documentation] to see examples of configuring clusters for various cloud providers' managed Kubernetes services
:::

## Create an Argo Application

Use the Argo CD `Application` resource to represent a Git repository which contains `kind: ControlPlane` configuration objects you want deployed in your Space.

Keeping your context pointed at the Argo cluster, run the following command in a terminal:

```yaml
cat <<EOF | kubectl apply -f -
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: control-planes
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/upbound/spaces-reference-arch.git
    targetRevision: HEAD
    path: infrastructure
    directory:
      recurse: true
  destination:
    name: ${SPACES_CLUSTER_NAME}
EOF
```

This application points at a sample repository which contains a configurations for 3 control planes destined for deployment to a Space.

## Inspect the Space

Once you kick off a sync operation, Argo syncs the desired control planes from Git to your Space cluster. You can confirm this by querying the Space with `up`:

```bash {copy-lines="1"}
up ctp list -A

# The output should look like this:
GROUP     NAME          CROSSPLANE    SYNCED   READY   MESSAGE   AGE
default   ctp-dev       1.13.2-up.3   True     True              9d
default   ctp-staging   1.13.2-up.3   True     True              9d
default   ctp-prod      1.13.2-up.3   True     True              9d
```

Now you can declaratively create new control planes in your Space, update existing ones, or delete them by committing desired state to your Git repository.


[argo-cd]: https://argoproj.github.io/cd/
[argo-cd-documentation]: https://argo-cd.readthedocs.io/en/stable/operator-manual/declarative-setup/#clusters
