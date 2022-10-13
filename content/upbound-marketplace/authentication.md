---
title: "Authentication"
weight: 10
---

Pulling private packages or pushing packages to an Upbound Marketplace private repository requires authentication to Upbound.

Installing private Kubernetes resources requires an [image pull secret](https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/#registry-secret-existing-credentials). 

{{< hint type="important" >}}
Authenticating to the Upbound Marketplace for private packages requires an [Upbound account]({{<ref "users/register" >}}).
{{< /hint >}}

## Prerequisites
Install the [Up command-line]({{<ref "cli">}}) to generate Kubernetes secrets and to use Upbound Marketplace private resources. 

{{< hint type="note" >}}
Upbound Marketplace requires Up command-line version `v0.13.0` or later.
{{< /hint >}}

## Log in with the Up command-line

Use `up login` to authenticate a user to the Upbound Marketplace.

```shell
up login
username: my-user
password: 
my-user logged in
```

## Kubernetes image pull secrets

Packages in private repositories require a Kubernetes image pull secret.  
The image pull secret authenticates Kubernetes to the Upbound Marketplace, allowing Kubernetes to download and install packages.

Generating an image pull secret requires either a user account _token_. 

{{< hint type="important" >}}
A user account token uses your current `up login` profile.  
Logging out with `up logout` deactivates the token.
{{< /hint >}}

Use the command `up controlplane pull-secret create` to generate a token and Kubernetes _Secret_ in the _upbound-system_ namespace.

```shell
up ctp pull-secret create
WARNING: Using temporary user credentials that will expire within 30 days.
upbound-system/package-pull-secret created
```
Verify the secret with `kubectl describe secret -n upbound-system package-pull-secret`

```shell
kubectl describe secret -n upbound-system package-pull-secret
Name:         package-pull-secret
Namespace:    upbound-system
Labels:       <none>
Annotations:  <none>

Type:  kubernetes.io/dockerconfigjson

Data
====
.dockerconfigjson:  1201 bytes
```

## Use an image pull secret

Use an image pull secret by providing a {{< hover label="pps" line="8" >}}spec.packagePullSecrets{{< /hover >}} in a {{< hover label="pps" line="2" >}}Configuration{{</hover>}} or `Provider` manifest.  

This example installs a private {{< hover label="pps" line="2" >}}Configuration{{< /hover >}} named {{< hover label="pps" line="6" >}}secret-configuration{{< /hover >}} from the Upbound image repository using image pull secret named {{< hover label="pps" line="8" >}}package-pull-secret{{< /hover >}}.
```yaml {label="pps",copy-line="all"}
apiVersion: pkg.crossplane.io/v1
kind: Configuration
metadata:
  name: platform-ref-aws
spec:
  package: xpkg.upbound.io/secret-org/secret-configuration:v1.2.3
  packagePullSecrets:
    - name: package-pull-secret
```



