---
geekdocHidden: true
---
### Install the Up command-line
The Up command-line helps manage Upbound Universal Crossplane, Upbound's enterprise Crossplane distribution and manage Upbound user accounts. 

Download and install the Upbound `up` command-line.

```shell {copy-lines="all"}
curl -sL "https://cli.upbound.io" | sh
sudo mv up /usr/local/bin/
```

### Install Upbound Universal Crossplane
Upbound Universal Crossplane (_UXP_) consists of upstream Crossplane and Upbound-specific enhancements and patches. It's [open source](https://github.com/upbound/universal-crossplane) and maintained by Upbound. 

Install UXP with the Up command-line `up uxp install` command.

```shell
up uxp install
UXP 1.9.1-up.2 installed
```

Verify all UXP pods are `Running` with `kubectl get pods -n upbound-system`. This may take up to five minutes depending on your Kubernetes cluster.

```shell {label="pods"}
kubectl get pods -n upbound-system
NAME                                        READY   STATUS    RESTARTS      AGE
crossplane-7fdfbd897c-pmrml                 1/1     Running   0             68m
crossplane-rbac-manager-7d6867bc4d-v7wpb    1/1     Running   0             68m
upbound-bootstrapper-5f47977d54-t8kvk       1/1     Running   0             68m
xgql-7c4b74c458-5bf2q                       1/1     Running   3 (67m ago)   68m
```

{{< hint type="note" >}}
`RESTARTS` for the `xgql` pod are normal during initial installation. 
{{< /hint >}}

For more details about UXP pods, read the [UXP]({{<ref "uxp#universal-crossplane-pods" >}}) section.


Installing UXP and Crossplane creates new Kubernetes API end-points. Take a look at the new API end-points with `kubectl api-resources  | grep crossplane`. In a later step you use the {{< hover label="grep" line="10">}}Provider{{< /hover >}} resource install the Official Provider.

```shell  {label="grep"}
kubectl api-resources  | grep crossplane
compositeresourcedefinitions      xrd,xrds     apiextensions.crossplane.io/v1         false        CompositeResourceDefinition
compositionrevisions                           apiextensions.crossplane.io/v1alpha1   false        CompositionRevision
compositions                                   apiextensions.crossplane.io/v1         false        Composition
configurationrevisions                         pkg.crossplane.io/v1                   false        ConfigurationRevision
configurations                                 pkg.crossplane.io/v1                   false        Configuration
controllerconfigs                              pkg.crossplane.io/v1alpha1             false        ControllerConfig
locks                                          pkg.crossplane.io/v1beta1              false        Lock
providerrevisions                              pkg.crossplane.io/v1                   false        ProviderRevision
providers                                      pkg.crossplane.io/v1                   false        Provider
storeconfigs                                   secrets.crossplane.io/v1alpha1         false        StoreConfig
```