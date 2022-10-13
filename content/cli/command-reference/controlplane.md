---
title: "up controlplane"
---
_Alias_: `up ctp`

Commands under `up controlplane` create and manage Kubernetes [image pull secrets](https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/).  
Install resources from private repositories or Upbound Official Providers requires an image pull secret.

### `up controlplane pull-secret`

<!-- omit in toc -->
#### Arguments
* `<secret name>`  - name of the Kubernetes secret object to create. Default is `package-pull-secret`.
* `-f,--file = <file>` - path to a token credentials file created by [`up robot token create`]({{<ref "robot" >}}).
* `--kubeconfig = <path>` - path to a kubeconfig file. The default is the kubeconfig file used by `kubectl`.
* `-n,--namespace = <namespace>` - namespace to install the Kubernetes secret into.  
The default is the value of the environmental variable `UPBOUND_NAMESPACE`.  
If the variable isn't set the command uses the namespace `upbound-system`.

The `up controlplane pull-secret` command is a simplified alias to the command `kubernetes secret docker-registry package-pull-secret`.  

The command `up controlplane pull-secret <secret name>` executes the following Kubernetes command:

```shell
kubectl create secret docker-registry <secret name> \
--namespace=upbound-system \
--docker-server=xpkg.upbound.io \
--docker-username=<generated accessId> \
--docker-password=<generated token>
```

#### Automatic token generation
If a `-f <file>` isn't provided the command generates a _user token_ based on the current `up login` profile. Logging out with `up logout` deactivates the token.

{{< hint type="caution" >}}
User tokens can't install Upbound Official Providers. Only robot tokens can install Official Providers.
{{< /hint >}}
If you use `-f <file>` the `accessId` and `token` values from a token JSON file are the `--docker-username` and `--docker-password` values. 

<!-- vale gitlab.Substitutions = NO -->
<!-- ignore lowercase 'k' in kubernetes -->
For more information on creating robot account tokens to install Official providers reference the [Authentication]({{<ref "upbound-marketplace/authentication#kubernetes-image-pull-secrets" >}}) section.
<!-- vale gitlab.Substitutions = YES -->

<!-- omit in toc -->
#### Examples

##### Create a pull-secret and automatically generate a user token
```shell
up controlplane pull-secret create my-token
WARNING: Using temporary user credentials that will expire within 30 days.
upbound-system/my-token created
```

##### View a created pull-secret
```shell
kubectl describe secret my-token -n upbound-system
Name:         my-token
Namespace:    upbound-system
Labels:       <none>
Annotations:  <none>

Type:  kubernetes.io/dockerconfigjson

Data
====
.dockerconfigjson:  1201 bytes
```
