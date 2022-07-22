---
title: "Connecting to Hosted Control Planes"
metaTitle: "Connecting to Hosted Control Planes"
metaDescription: "Connecting to Hosted Control Planes"
rank: 42
---

For some operations, you may want to have full command line access to your
hosted control plane. Under the hood, hosted control planes are powered by a 
hosted [UXP] instance managed by Upbound, so we can connect to it with `kubectl` 
like we would any remote Kubernetes cluster.

This guide will help you connect to your hosted control planes that reside in
Upbound. For self-hosted control planes, you will have already established a
`kubectl` connection in order to install UXP and connect it to Upbound.

## Generate a Token

The first thing you'll need to connect to your hosted control plane is an API 
Token. To generate one, click on the Organization switcher and select 
"My Account". From there, navigate to "API Tokens" and click on "Create New 
Token". We're going to name our new token `test-token`.

**Make sure to copy the token string and store it somewhere safe** like a
password manager. This is the last time Upbound will display it to you.

![Create an API Token](../images/upbound/create-api-token.gif)

## Connect to Control Plane

Now you're ready to connect to your hosted control plane. The `up` CLI provides
commands to automatically update your `kubeconfig` to point to a control plane
on Upbound.

First you'll need to get the ID of your control plane:

```console
$ up ctp list
NAME   ID                                     SELF-HOSTED   STATUS
test   47ebaad4-14e3-44cc-a738-20412ea11ef2   false         ready
```

Next, you can use the API token you created above to populate your current
`kubeconfig`:

This command assumes that you have stored your API token in a file named
`api-token.txt`, but it may be provided via other means. We recommend avoiding
exposing any sensitive data in your bash history.

```console
cat api-token.txt | up controlplane kubeconfig get --token=- <control-plane-ID>
```

If you prefer to generate a new `kubeconfig` or merge with one that is not set
as your default, you can provide the file name with `-f`.

You can now verify that you are able to access your control plane successfully:

```console
kubectl get crd
```

[UXP]: ../../uxp
