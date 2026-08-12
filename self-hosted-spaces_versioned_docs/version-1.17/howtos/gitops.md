---
title: GitOps with ArgoCD in Self-Hosted Spaces
sidebar_position: 80
description: Set up GitOps workflows with Argo CD in self-hosted Spaces
plan: "business"
---

:::info Deployment Model
This guide applies to **self-hosted Spaces** deployments. For Upbound Cloud Spaces, see [GitOps with Upbound Control Planes](/cloud-spaces/howtos/gitops-on-upbound/).
:::

GitOps is an approach for managing a system by declaratively describing desired resources' configurations in Git and using controllers to realize the desired state. Upbound's control planes are compatible with this pattern and it's strongly recommended you integrate GitOps in the platforms you build on Upbound.

<!-- vale Google.Headings = NO -->
## Integrate with Argo CD
<!-- vale Google.Headings = YES -->

[Argo CD][argo-cd] is a project in the Kubernetes ecosystem commonly used for
GitOps. You can use it in tandem with Upbound control planes to achieve GitOps
flows. The sections below explain how to integrate these tools with Upbound.

### Configure connection secrets for control planes

You can configure control planes to write their connection details to a secret.
Do this by setting the
[`spec.writeConnectionSecretToRef`][spec-writeconnectionsecrettoref] field in a
control plane manifest. For example:

```yaml
apiVersion: spaces.upbound.io/v1beta1
kind: ControlPlane
metadata:
  name: ctp1
  namespace: default
spec:
  writeConnectionSecretToRef:
    name: kubeconfig-ctp1
    namespace: default
```

<!-- vale Google.Headings = NO -->
### Configure Argo CD
<!-- vale Google.Headings = YES -->

To configure Argo CD for Annotation resource tracking, edit the Argo CD
ConfigMap in the Argo CD namespace. Add `application.resourceTrackingMethod:
annotation` to the data section as below.

Next, configure the [auto respect RBAC for the Argo CD
controller][auto-respect-rbac-for-the-argo-cd-controller-1]. By default, Argo CD
attempts to discover some Kubernetes resource types that don't exist in a
control plane. You must configure Argo CD to respect the cluster's RBAC rules so
that Argo CD can sync. Add `resource.respectRBAC: normal` to the data section as
below.

```bash
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
data:
  ...
  application.resourceTrackingMethod: annotation
  resource.respectRBAC: normal
```

:::tip
The `resource.respectRBAC` configuration above tells Argo to respect RBAC for
_all_ cluster contexts. If you're using an Argo CD instance to manage more than
control planes, change the `clusters` string match to apply only to control
planes. For example, if every control plane context name follows the
`controlplane-<name>` naming convention, you should set the string match to be
`controlplane-*`.
:::

<!-- vale Google.Headings = NO -->
### Create a cluster context definition
<!-- vale Google.Headings = YES -->

Once the control plane is ready, extract the following values from the secret
containing the kubeconfig:

```bash
kubeconfig_content=$(kubectl get secrets kubeconfig-ctp1 -n default -o jsonpath='{.data.kubeconfig}' | base64 -d)
server=$(echo "$kubeconfig_content" | grep 'server:' | awk '{print $2}')
bearer_token=$(echo "$kubeconfig_content" | grep 'token:' | awk '{print $2}')
ca_data=$(echo "$kubeconfig_content" | grep 'certificate-authority-data:' | awk '{print $2}')
```

Generate a new secret in the cluster where you installed Argo, using the prior
values extracted:

```yaml
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: ctp-secret
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: cluster
type: Opaque
stringData:
  name: ctp
  server: $server
  config: |
    {
      "bearerToken": "$bearer_token",
      "tlsClientConfig": {
        "insecure": false,
        "caData": "$ca_data"
      }
    }
EOF
```

[generate-a-kubeconfig]: /manuals/cli/concepts/contexts
[control-plane-groups]: /self-hosted-spaces/concepts/groups
[control-planes]: /self-hosted-spaces/concepts/control-planes
[upbound-iam-resources]: /manuals/platform/identity-management
[space-apis]: /self-hosted-spaces/reference/
[space-apis-1]: /self-hosted-spaces/reference/
[control-plane-groups-2]: /self-hosted-spaces/concepts/groups


[argo-cd]: https://argo-cd.readthedocs.io/en/stable/
[my-account-api-tokens]: https://accounts.upbound.io/settings/tokens
[auto-respect-rbac-for-the-argo-cd-controller]: https://argo-cd.readthedocs.io/en/stable/operator-manual/declarative-setup/#auto-respect-rbac-for-controller
[spec-writeconnectionsecrettoref]: /self-hosted-spaces/reference/
[auto-respect-rbac-for-the-argo-cd-controller-1]: https://argo-cd.readthedocs.io/en/stable/operator-manual/declarative-setup/#auto-respect-rbac-for-controller
[provider-upbound]: https://marketplace.upbound.io/providers/upbound/provider-upbound
[provider-kubernetes]: https://marketplace.upbound.io/providers/upbound/provider-kubernetes
[provider-upbound-2]: https://marketplace.upbound.io/providers/upbound/provider-upbound
[robots]: https://marketplace.upbound.io/providers/upbound/provider-upbound/v0.8.0/resources/iam.upbound.io/Robot/v1alpha1
[teams]: https://marketplace.upbound.io/providers/upbound/provider-upbound/v0.8.0/resources/iam.upbound.io/Team/v1alpha1
[repositories]: https://marketplace.upbound.io/providers/upbound/provider-upbound/v0.8.0/resources/repository.upbound.io/Repository/v1alpha1
[permissions]: https://marketplace.upbound.io/providers/upbound/provider-upbound/v0.8.0/resources/repository.upbound.io/Permission/v1alpha1
[provider-kubernetes-3]: https://marketplace.upbound.io/providers/upbound/provider-kubernetes
[object]: https://marketplace.upbound.io/providers/upbound/provider-kubernetes/v0.17.0/resources/kubernetes.crossplane.io/Object/v1alpha2
[watch]: https://kubernetes.io/docs/reference/using-api/api-concepts/#watch-bookmarks
[providerconfig]: https://marketplace.upbound.io/providers/upbound/provider-kubernetes/v0.17.0/resources/kubernetes.crossplane.io/ProviderConfig/v1alpha1
[personal-access-token]: https://accounts.upbound.io/settings/tokens
