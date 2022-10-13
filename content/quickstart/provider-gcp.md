---
title: GCP Quickstart
---

Connect Crossplane to Google GCP to create and manage cloud resources from Kubernetes with the [GCP Official Provider](https://marketplace.upbound.io/providers/upbound/provider-gcp/).

This guide walks you through the steps required to get started with the GCP Official Provider. This includes installing Upbound Universal Crossplane, configuring the provider to authenticate to GCP and creating a _Managed Resource_ in GCP directly from your Kubernetes cluster.

- [Prerequisites](#prerequisites)
- [Guided tour](#guided-tour)
  - [Install the official GCP provider](#install-the-official-gcp-provider)
  - [Create a Kubernetes secret for GCP](#create-a-kubernetes-secret-for-gcp)
    - [Generate a GCP service account JSON file](#generate-a-gcp-service-account-json-file)
    - [Create a Kubernetes secret with the GCP credentials](#create-a-kubernetes-secret-with-the-gcp-credentials)
  - [Create a ProviderConfig](#create-a-providerconfig)
  - [Create a managed resource](#create-a-managed-resource)
  - [Delete the managed resource](#delete-the-managed-resource)
  - [Next steps](#next-steps)

## Prerequisites
This quickstart requires:
* a Kubernetes cluster with at least 3 GB of RAM
* permissions to create pods and secrets in the Kubernetes cluster
* a GCP account with permissions to create a storage bucket
* GCP [account keys](https://cloud.google.com/iam/docs/creating-managing-service-account-keys)
* GCP [Project ID](https://support.google.com/googleapi/answer/7014113?hl=en)

{{< hint type="tip" >}}
If you don't have a Kubernetes cluster create one locally with [minikube](https://minikube.sigs.k8s.io/docs/start/) or [kind](https://kind.sigs.k8s.io/).
{{< /hint >}}

## Guided tour
{{< hint type="note" >}}
All commands use the current `kubeconfig` context and configuration. 
{{< /hint >}}

You need your:
* GCP service account key

{{< include file="quickstart/quickstart-common.md" type="page" >}}

### Install the official GCP provider

Install the official provider into the Kubernetes cluster with the `up` command-line or a Kubernetes configuration file. 
{{< tabs "provider-install" >}}

{{< tab "with the Up command-line" >}}
```shell {copy-lines="all"}
up controlplane \
provider install \
xpkg.upbound.io/upbound/provider-gcp:v0.15.0
```
{{< /tab >}}

{{< tab "with a Kubernetes manifest" >}}
```shell {label="provider",copy-lines="all"}
cat <<EOF | kubectl apply -f -
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: upbound-provider-gcp
spec:
  package: xpkg.upbound.io/upbound/provider-gcp:v0.15.0
EOF
```

The {{< hover label="provider" line="3">}}kind: Provider{{< /hover >}} uses the Crossplane `Provider` _Custom Resource Definition_ to connect your Kubernetes cluster to your cloud provider.  

{{< /tab >}}

{{< /tabs >}}

Verify the provider installed with `kubectl get providers`. 

{{< hint type="note" >}}
It may take up to five minutes for the provider to list `HEALTHY` as `True`. 
{{< /hint >}}

```shell 
kubectl get providers
NAME                   INSTALLED   HEALTHY   PACKAGE                                        AGE
upbound-provider-gcp   True        False     xpkg.upbound.io/upbound/provider-gcp:v0.15.0   8s
```

A provider installs their own Kubernetes _Custom Resource Definitions_ (CRDs). These CRDs allow you to create GCP resources directly inside Kubernetes.

You can view the new CRDs with `kubectl get crds`. Every CRD maps to a unique GCP service Crossplane can provision and manage.
<!-- vale gitlab.SubstitutionWarning = NO -->
<!-- disable "click" error. The user needs to actually click the button -->
{{< expand "Click to see the GCP CRDs" >}}
<!-- vale gitlab.SubstitutionWarning = YES -->
```shell
kubectl get crds
NAME                                                               CREATED AT
addresses.compute.gcp.upbound.io                                   2022-10-12T19:45:38Z
agents.dialogflowcx.gcp.upbound.io                                 2022-10-12T19:45:39Z
alertpolicies.monitoring.gcp.upbound.io                            2022-10-12T19:45:40Z
applications.appengine.gcp.upbound.io                              2022-10-12T19:45:37Z
attacheddisks.compute.gcp.upbound.io                               2022-10-12T19:45:38Z
autoscalers.compute.gcp.upbound.io                                 2022-10-12T19:45:38Z
backendbuckets.compute.gcp.upbound.io                              2022-10-12T19:45:38Z
backendbucketsignedurlkeys.compute.gcp.upbound.io                  2022-10-12T19:45:38Z
backendservices.compute.gcp.upbound.io                             2022-10-12T19:45:38Z
bucketaccesscontrols.storage.gcp.upbound.io                        2022-10-12T19:45:41Z
bucketacls.storage.gcp.upbound.io                                  2022-10-12T19:45:41Z
bucketiammembers.storage.gcp.upbound.io                            2022-10-12T19:45:41Z
bucketobjects.storage.gcp.upbound.io                               2022-10-12T19:45:41Z
buckets.storage.gcp.upbound.io                                     2022-10-12T19:45:41Z
capooliammembers.privateca.gcp.upbound.io                          2022-10-12T19:45:40Z
capools.privateca.gcp.upbound.io                                   2022-10-12T19:45:40Z
certificateauthorities.privateca.gcp.upbound.io                    2022-10-12T19:45:41Z
certificates.privateca.gcp.upbound.io                              2022-10-12T19:45:41Z
certificatetemplateiammembers.privateca.gcp.upbound.io             2022-10-12T19:45:41Z
certificatetemplates.privateca.gcp.upbound.io                      2022-10-12T19:45:41Z
clients.containerazure.gcp.upbound.io                              2022-10-12T19:45:39Z
clusters.container.gcp.upbound.io                                  2022-10-12T19:45:39Z
clusters.containeraws.gcp.upbound.io                               2022-10-12T19:45:39Z
clusters.containerazure.gcp.upbound.io                             2022-10-12T19:45:39Z
compositeresourcedefinitions.apiextensions.crossplane.io           2022-10-12T19:44:47Z
compositionrevisions.apiextensions.crossplane.io                   2022-10-12T19:44:47Z
compositions.apiextensions.crossplane.io                           2022-10-12T19:44:47Z
configurationrevisions.pkg.crossplane.io                           2022-10-12T19:44:47Z
configurations.pkg.crossplane.io                                   2022-10-12T19:44:47Z
connections.servicenetworking.gcp.upbound.io                       2022-10-12T19:45:41Z
consentstores.healthcare.gcp.upbound.io                            2022-10-12T19:45:40Z
contacts.essentialcontacts.gcp.upbound.io                          2022-10-12T19:45:40Z
controllerconfigs.pkg.crossplane.io                                2022-10-12T19:44:47Z
cryptokeyiammembers.kms.gcp.upbound.io                             2022-10-12T19:45:40Z
cryptokeys.kms.gcp.upbound.io                                      2022-10-12T19:45:40Z
databaseiammembers.spanner.gcp.upbound.io                          2022-10-12T19:45:41Z
databaseinstances.sql.gcp.upbound.io                               2022-10-12T19:45:41Z
databases.spanner.gcp.upbound.io                                   2022-10-12T19:45:41Z
databases.sql.gcp.upbound.io                                       2022-10-12T19:45:41Z
datasets.healthcare.gcp.upbound.io                                 2022-10-12T19:45:40Z
defaultobjectaccesscontrols.storage.gcp.upbound.io                 2022-10-12T19:45:41Z
defaultobjectacls.storage.gcp.upbound.io                           2022-10-12T19:45:41Z
defaultsupportedidpconfigs.identityplatform.gcp.upbound.io         2022-10-12T19:45:40Z
diskiammembers.compute.gcp.upbound.io                              2022-10-12T19:45:38Z
diskresourcepolicyattachments.compute.gcp.upbound.io               2022-10-12T19:45:38Z
disks.compute.gcp.upbound.io                                       2022-10-12T19:45:38Z
domainmappings.cloudrun.gcp.upbound.io                             2022-10-12T19:45:38Z
entitytypes.dialogflowcx.gcp.upbound.io                            2022-10-12T19:45:40Z
entries.datacatalog.gcp.upbound.io                                 2022-10-12T19:45:39Z
entrygroups.datacatalog.gcp.upbound.io                             2022-10-12T19:45:39Z
environments.composer.gcp.upbound.io                               2022-10-12T19:45:38Z
environments.dialogflowcx.gcp.upbound.io                           2022-10-12T19:45:39Z
environments.notebooks.gcp.upbound.io                              2022-10-12T19:45:40Z
externalvpngateways.compute.gcp.upbound.io                         2022-10-12T19:45:38Z
firewallpolicies.compute.gcp.upbound.io                            2022-10-12T19:45:38Z
firewallpolicyassociations.compute.gcp.upbound.io                  2022-10-12T19:45:38Z
firewallpolicyrules.compute.gcp.upbound.io                         2022-10-12T19:45:38Z
firewalls.compute.gcp.upbound.io                                   2022-10-12T19:45:38Z
flows.dialogflowcx.gcp.upbound.io                                  2022-10-12T19:45:40Z
folders.cloudplatform.gcp.upbound.io                               2022-10-12T19:45:37Z
forwardingrules.compute.gcp.upbound.io                             2022-10-12T19:45:38Z
functioniammembers.cloudfunctions.gcp.upbound.io                   2022-10-12T19:45:37Z
functions.cloudfunctions.gcp.upbound.io                            2022-10-12T19:45:37Z
globaladdresses.compute.gcp.upbound.io                             2022-10-12T19:45:38Z
globalforwardingrules.compute.gcp.upbound.io                       2022-10-12T19:45:38Z
globalnetworkendpointgroups.compute.gcp.upbound.io                 2022-10-12T19:45:38Z
globalnetworkendpoints.compute.gcp.upbound.io                      2022-10-12T19:45:38Z
havpngateways.compute.gcp.upbound.io                               2022-10-12T19:45:38Z
healthchecks.compute.gcp.upbound.io                                2022-10-12T19:45:38Z
httphealthchecks.compute.gcp.upbound.io                            2022-10-12T19:45:38Z
httpshealthchecks.compute.gcp.upbound.io                           2022-10-12T19:45:38Z
imageiammembers.compute.gcp.upbound.io                             2022-10-12T19:45:38Z
images.compute.gcp.upbound.io                                      2022-10-12T19:45:38Z
inboundsamlconfigs.identityplatform.gcp.upbound.io                 2022-10-12T19:45:40Z
instancefromtemplates.compute.gcp.upbound.io                       2022-10-12T19:45:38Z
instancegroupmanagers.compute.gcp.upbound.io                       2022-10-12T19:45:38Z
instancegroupnamedports.compute.gcp.upbound.io                     2022-10-12T19:45:38Z
instancegroups.compute.gcp.upbound.io                              2022-10-12T19:45:38Z
instanceiammembers.compute.gcp.upbound.io                          2022-10-12T19:45:38Z
instanceiammembers.notebooks.gcp.upbound.io                        2022-10-12T19:45:40Z
instanceiammembers.spanner.gcp.upbound.io                          2022-10-12T19:45:41Z
instances.compute.gcp.upbound.io                                   2022-10-12T19:45:38Z
instances.filestore.gcp.upbound.io                                 2022-10-12T19:45:40Z
instances.notebooks.gcp.upbound.io                                 2022-10-12T19:45:40Z
instances.redis.gcp.upbound.io                                     2022-10-12T19:45:41Z
instances.spanner.gcp.upbound.io                                   2022-10-12T19:45:41Z
instancetemplates.compute.gcp.upbound.io                           2022-10-12T19:45:38Z
intents.dialogflowcx.gcp.upbound.io                                2022-10-12T19:45:40Z
interconnectattachments.compute.gcp.upbound.io                     2022-10-12T19:45:38Z
jobs.cloudscheduler.gcp.upbound.io                                 2022-10-12T19:45:38Z
keyringiammembers.kms.gcp.upbound.io                               2022-10-12T19:45:40Z
keyringimportjobs.kms.gcp.upbound.io                               2022-10-12T19:45:40Z
keyrings.kms.gcp.upbound.io                                        2022-10-12T19:45:40Z
litereservations.pubsub.gcp.upbound.io                             2022-10-12T19:45:41Z
litesubscriptions.pubsub.gcp.upbound.io                            2022-10-12T19:45:41Z
litetopics.pubsub.gcp.upbound.io                                   2022-10-12T19:45:41Z
locks.pkg.crossplane.io                                            2022-10-12T19:44:47Z
managedsslcertificates.compute.gcp.upbound.io                      2022-10-12T19:45:38Z
managedzones.dns.gcp.upbound.io                                    2022-10-12T19:45:40Z
memberships.gkehub.gcp.upbound.io                                  2022-10-12T19:45:40Z
networkendpointgroups.compute.gcp.upbound.io                       2022-10-12T19:45:38Z
networkendpoints.compute.gcp.upbound.io                            2022-10-12T19:45:38Z
networkpeeringroutesconfigs.compute.gcp.upbound.io                 2022-10-12T19:45:38Z
networkpeerings.compute.gcp.upbound.io                             2022-10-12T19:45:38Z
networks.compute.gcp.upbound.io                                    2022-10-12T19:45:38Z
nodegroups.compute.gcp.upbound.io                                  2022-10-12T19:45:38Z
nodepools.container.gcp.upbound.io                                 2022-10-12T19:45:39Z
nodepools.containeraws.gcp.upbound.io                              2022-10-12T19:45:39Z
nodepools.containerazure.gcp.upbound.io                            2022-10-12T19:45:40Z
nodetemplates.compute.gcp.upbound.io                               2022-10-12T19:45:38Z
notes.containeranalysis.gcp.upbound.io                             2022-10-12T19:45:39Z
notificationchannels.monitoring.gcp.upbound.io                     2022-10-12T19:45:40Z
oauthidpconfigs.identityplatform.gcp.upbound.io                    2022-10-12T19:45:40Z
organizationiamauditconfigs.cloudplatform.gcp.upbound.io           2022-10-12T19:45:37Z
organizationiamcustomroles.cloudplatform.gcp.upbound.io            2022-10-12T19:45:37Z
organizationiammembers.cloudplatform.gcp.upbound.io                2022-10-12T19:45:37Z
ospolicyassignments.osconfig.gcp.upbound.io                        2022-10-12T19:45:40Z
packetmirrorings.compute.gcp.upbound.io                            2022-10-12T19:45:38Z
pages.dialogflowcx.gcp.upbound.io                                  2022-10-12T19:45:40Z
patchdeployments.osconfig.gcp.upbound.io                           2022-10-12T19:45:40Z
perinstanceconfigs.compute.gcp.upbound.io                          2022-10-12T19:45:39Z
policies.dns.gcp.upbound.io                                        2022-10-12T19:45:40Z
projectdefaultnetworktiers.compute.gcp.upbound.io                  2022-10-12T19:45:39Z
projectdefaultserviceaccounts.cloudplatform.gcp.upbound.io         2022-10-12T19:45:37Z
projectiamauditconfigs.cloudplatform.gcp.upbound.io                2022-10-12T19:45:37Z
projectiammembers.cloudplatform.gcp.upbound.io                     2022-10-12T19:45:37Z
projectmetadata.compute.gcp.upbound.io                             2022-10-12T19:45:39Z
projectmetadataitems.compute.gcp.upbound.io                        2022-10-12T19:45:39Z
projects.cloudplatform.gcp.upbound.io                              2022-10-12T19:45:37Z
projectservices.cloudplatform.gcp.upbound.io                       2022-10-12T19:45:37Z
projectusageexportbuckets.cloudplatform.gcp.upbound.io             2022-10-12T19:45:38Z
providerconfigs.gcp.upbound.io                                     2022-10-12T19:45:40Z
providerconfigusages.gcp.upbound.io                                2022-10-12T19:45:40Z
providerrevisions.pkg.crossplane.io                                2022-10-12T19:44:47Z
providers.pkg.crossplane.io                                        2022-10-12T19:44:47Z
queues.cloudtasks.gcp.upbound.io                                   2022-10-12T19:45:38Z
recordsets.dns.gcp.upbound.io                                      2022-10-12T19:45:40Z
regionautoscalers.compute.gcp.upbound.io                           2022-10-12T19:45:39Z
regionbackendservices.compute.gcp.upbound.io                       2022-10-12T19:45:39Z
regiondiskiammembers.compute.gcp.upbound.io                        2022-10-12T19:45:39Z
regiondiskresourcepolicyattachments.compute.gcp.upbound.io         2022-10-12T19:45:39Z
regiondisks.compute.gcp.upbound.io                                 2022-10-12T19:45:39Z
regionhealthchecks.compute.gcp.upbound.io                          2022-10-12T19:45:39Z
regioninstancegroupmanagers.compute.gcp.upbound.io                 2022-10-12T19:45:39Z
regionnetworkendpointgroups.compute.gcp.upbound.io                 2022-10-12T19:45:39Z
regionperinstanceconfigs.compute.gcp.upbound.io                    2022-10-12T19:45:39Z
regionsslcertificates.compute.gcp.upbound.io                       2022-10-12T19:45:39Z
regiontargethttpproxies.compute.gcp.upbound.io                     2022-10-12T19:45:39Z
regiontargethttpsproxies.compute.gcp.upbound.io                    2022-10-12T19:45:39Z
regionurlmaps.compute.gcp.upbound.io                               2022-10-12T19:45:39Z
registries.container.gcp.upbound.io                                2022-10-12T19:45:39Z
releases.firebaserules.gcp.upbound.io                              2022-10-12T19:45:40Z
repositories.sourcerepo.gcp.upbound.io                             2022-10-12T19:45:41Z
repositoryiammembers.sourcerepo.gcp.upbound.io                     2022-10-12T19:45:41Z
reservations.compute.gcp.upbound.io                                2022-10-12T19:45:39Z
resourcepolicies.compute.gcp.upbound.io                            2022-10-12T19:45:39Z
routerinterfaces.compute.gcp.upbound.io                            2022-10-12T19:45:39Z
routernats.compute.gcp.upbound.io                                  2022-10-12T19:45:39Z
routers.compute.gcp.upbound.io                                     2022-10-12T19:45:39Z
routes.compute.gcp.upbound.io                                      2022-10-12T19:45:39Z
rulesets.firebaserules.gcp.upbound.io                              2022-10-12T19:45:40Z
runtimeiammembers.notebooks.gcp.upbound.io                         2022-10-12T19:45:40Z
runtimes.notebooks.gcp.upbound.io                                  2022-10-12T19:45:40Z
schemas.pubsub.gcp.upbound.io                                      2022-10-12T19:45:41Z
secretciphertexts.kms.gcp.upbound.io                               2022-10-12T19:45:40Z
secretiammembers.secretmanager.gcp.upbound.io                      2022-10-12T19:45:41Z
secrets.secretmanager.gcp.upbound.io                               2022-10-12T19:45:41Z
secretversions.secretmanager.gcp.upbound.io                        2022-10-12T19:45:41Z
securitypolicies.compute.gcp.upbound.io                            2022-10-12T19:45:39Z
serviceaccountiammembers.cloudplatform.gcp.upbound.io              2022-10-12T19:45:37Z
serviceaccountkeys.cloudplatform.gcp.upbound.io                    2022-10-12T19:45:38Z
serviceaccounts.cloudplatform.gcp.upbound.io                       2022-10-12T19:45:37Z
serviceattachments.compute.gcp.upbound.io                          2022-10-12T19:45:39Z
serviceiammembers.cloudrun.gcp.upbound.io                          2022-10-12T19:45:38Z
servicenetworkingpeereddnsdomains.cloudplatform.gcp.upbound.io     2022-10-12T19:45:37Z
services.cloudrun.gcp.upbound.io                                   2022-10-12T19:45:38Z
sourcerepresentationinstances.sql.gcp.upbound.io                   2022-10-12T19:45:41Z
sshpublickeys.oslogin.gcp.upbound.io                               2022-10-12T19:45:40Z
sslcertificates.compute.gcp.upbound.io                             2022-10-12T19:45:39Z
sslcerts.sql.gcp.upbound.io                                        2022-10-12T19:45:41Z
storeconfigs.gcp.upbound.io                                        2022-10-12T19:45:40Z
storeconfigs.secrets.crossplane.io                                 2022-10-12T19:44:47Z
subnetworkiammembers.compute.gcp.upbound.io                        2022-10-12T19:45:39Z
subnetworks.compute.gcp.upbound.io                                 2022-10-12T19:45:39Z
subscriptioniammembers.pubsub.gcp.upbound.io                       2022-10-12T19:45:41Z
subscriptions.pubsub.gcp.upbound.io                                2022-10-12T19:45:41Z
targetgrpcproxies.compute.gcp.upbound.io                           2022-10-12T19:45:39Z
targethttpproxies.compute.gcp.upbound.io                           2022-10-12T19:45:39Z
targethttpsproxies.compute.gcp.upbound.io                          2022-10-12T19:45:39Z
targetinstances.compute.gcp.upbound.io                             2022-10-12T19:45:39Z
targetpools.compute.gcp.upbound.io                                 2022-10-12T19:45:39Z
targetsslproxies.compute.gcp.upbound.io                            2022-10-12T19:45:39Z
targettcpproxies.compute.gcp.upbound.io                            2022-10-12T19:45:39Z
tenantdefaultsupportedidpconfigs.identityplatform.gcp.upbound.io   2022-10-12T19:45:40Z
tenantinboundsamlconfigs.identityplatform.gcp.upbound.io           2022-10-12T19:45:40Z
tenantoauthidpconfigs.identityplatform.gcp.upbound.io              2022-10-12T19:45:40Z
tenants.identityplatform.gcp.upbound.io                            2022-10-12T19:45:40Z
topiciammembers.pubsub.gcp.upbound.io                              2022-10-12T19:45:41Z
topics.pubsub.gcp.upbound.io                                       2022-10-12T19:45:41Z
triggers.eventarc.gcp.upbound.io                                   2022-10-12T19:45:40Z
uptimecheckconfigs.monitoring.gcp.upbound.io                       2022-10-12T19:45:40Z
urlmaps.compute.gcp.upbound.io                                     2022-10-12T19:45:39Z
users.sql.gcp.upbound.io                                           2022-10-12T19:45:41Z
versions.dialogflowcx.gcp.upbound.io                               2022-10-12T19:45:40Z
vpngateways.compute.gcp.upbound.io                                 2022-10-12T19:45:39Z
vpntunnels.compute.gcp.upbound.io                                  2022-10-12T19:45:39Z
webbackendserviceiammembers.iap.gcp.upbound.io                     2022-10-12T19:45:40Z
webiammembers.iap.gcp.upbound.io                                   2022-10-12T19:45:40Z
webtypeappengineiammembers.iap.gcp.upbound.io                      2022-10-12T19:45:40Z
webtypecomputeiammembers.iap.gcp.upbound.io                        2022-10-12T19:45:40Z
```
{{< /expand >}}

### Create a Kubernetes secret for GCP
The provider requires credentials to create and manage GCP resources. Providers use a Kubernetes _Secret_ to connect the credentials to the provider.

First generate a Kubernetes _Secret_ from a Google Cloud service account JSON file and then configure the Provider to use it.

#### Generate a GCP service account JSON file
For basic user authentication, use a Google Cloud service account JSON file. 

{{< hint type="tip" >}}
The [GCP documentation](https://cloud.google.com/iam/docs/creating-managing-service-account-keys) provides information on how to generate a service account JSON file.
{{< /hint >}}

Save this JSON file as `gcp-credentials.json`

{{< hint type="note" >}}
The [Configuration](https://marketplace.upbound.io/providers/upbound/provider-gcp/v0.15.0/docs/configuration) section of the Provider documentation describes other authentication methods.
{{< /hint >}}

#### Create a Kubernetes secret with the GCP credentials
A Kubernetes generic secret has a name and contents. Use {{< hover label="kube-create-secret" line="1">}}kubectl create secret{{< /hover >}} to generate the secret object named {{< hover label="kube-create-secret" line="2">}}gcp-secret{{< /hover >}} in the {{< hover label="kube-create-secret" line="3">}}upbound-system{{</ hover >}} namespace.  
Use the {{< hover label="kube-create-secret" line="4">}}--from-file={{</hover>}} argument to set the value to the contents of the  {{< hover label="kube-create-secret" line="4">}}gcp-credentials.json{{< /hover >}} file.

```shell {label="kube-create-secret",copy-lines="all"}
kubectl create secret \
generic gcp-secret \
-n upbound-system \
--from-file=creds=./gcp-credentials.json
```

View the secret with `kubectl describe secret`

{{< hint type="note" >}}
The size may be larger if there are extra blank spaces in your text file.
{{< /hint >}}

```shell
kubectl describe secret gcp-secret -n upbound-system
Name:         gcp-secret
Namespace:    upbound-system
Labels:       <none>
Annotations:  <none>

Type:  Opaque

Data
====
creds:  2330 bytes
```

### Create a ProviderConfig
A `ProviderConfig` customizes the settings of the GCP Provider.  

Apply the {{< hover label="providerconfig" line="2">}}ProviderConfig{{</ hover >}}. Include your {{< hover label="providerconfig" line="7" >}}GCP project ID{{< /hover >}}.

{{< hint type="warning" >}}
Add your GCP `project ID` into the output below. 
{{< /hint >}}

```yaml {label="providerconfig",copy-lines="all"}
cat <<EOF | kubectl apply -f -
apiVersion: gcp.upbound.io/v1beta1
kind: ProviderConfig
metadata:
  name: default
spec:
  projectID: <PROJECT_ID>
  credentials:
    source: Secret
    secretRef:
      namespace: upbound-system
      name: gcp-secret
      key: creds
EOF
```

This attaches the GCP credentials, saved as a Kubernetes secret, as a {{< hover label="providerconfig" line="9">}}secretRef{{</ hover>}}.

The {{< hover label="providerconfig" line="12">}}spec.credentials.secretRef.name{{< /hover >}} value is the name of the Kubernetes secret containing the GCP credentials in the {{< hover label="providerconfig" line="11">}}spec.credentials.secretRef.namespace{{< /hover >}}.


### Create a managed resource
A _managed resource_ is anything Crossplane creates and manages outside of the Kubernetes cluster. This creates a GCP storage bucket with Crossplane. The storage bucket is a _managed resource_.

This will generate a random name for the storage bucket starting with {{< hover label="xr" line="1" >}}upbound-bucket{{< /hover >}}

```yaml {label="xr",copy-lines="all"}
bucket=$(echo "upbound-bucket-"$(head -n 4096 /dev/urandom | openssl sha1 | tail -c 10))
cat <<EOF | kubectl apply -f -
apiVersion: storage.gcp.upbound.io/v1beta1
kind: Bucket
metadata:
  name: $bucket
spec:
  forProvider:
    location: US
    storageClass: MULTI_REGIONAL
  providerConfigRef:
    name: default
  deletionPolicy: Delete
EOF
```

Notice the {{< hover label="xr" line="3">}}apiVersion{{< /hover >}} and {{< hover label="xr" line="4">}}kind{{</hover >}} are from the `Provider's` CRDs.


The {{< hover label="xr" line="6">}}metadata.name{{< /hover >}} value is the name of the created GCP storage bucket.  
This example uses the generated name `upbound-bucket-<hash>` in the {{< hover label="xr" line="6">}}$bucket{{</hover >}} variable.

{{< hover label="xr" line="10" >}}spec.storageClass{{< /hover >}} defines the GCP storage bucket is [single-region, dual-region or multi-region](https://cloud.google.com/storage/docs/locations#key-concepts). 

{{< hover label="xr" line="9">}}spec.forProvider.location{{< /hover >}} is a [GCP location based](https://cloud.google.com/storage/docs/locations) on the {{< hover label="xr" line="10" >}}storageClass{{< /hover >}}. 

Use `kubectl get buckets` to verify Crossplane created the bucket.

{{< hint type="tip" >}}
Upbound created the bucket when the values `READY` and `SYNCED` are `True`.  
This may take up to 5 minutes.  
{{< /hint >}}

```shell
kubectl get bucket
NAME                       READY   SYNCED   EXTERNAL-NAME              AGE
upbound-bucket-cf2b6d853   True    True     upbound-bucket-cf2b6d853   3m3s
```

Optionally, log into the [GCP Console](https://console.cloud.google.com/) and see the storage bucket inside GCP.

{{< img src="images/gcp-bucket-create.png" alt="GCP console shows a storage bucket with the name upbound-bucket-cf2b6d853 that matches the bucket created by Crossplane." >}}

<br />

<!-- vale gitlab.SubstitutionWarning = NO -->
<!-- disable "click" error. The user needs to actually click the button -->
{{< expand "Is the bucket not SYNCED? Click here for troubleshooting tips" >}}
<!-- vale gitlab.SubstitutionWarning = YES -->
If the `READY` or `SYNCED` are blank or `False` use `kubectl describe bucket` to understand why.

A common issue is incorrect GCP credentials or not having permissions to create the GCP storage bucket.

The following output is an example of the `kubectl describe bucket` output when using the wrong GCP credentials.

```shell {label="bad-auth"}
 kubectl describe bucket
Name:         upbound-bucket-b7cf6b590
Namespace:
Labels:       <none>
Annotations:  crossplane.io/external-name: upbound-bucket-b7cf6b590
API Version:  storage.gcp.upbound.io/v1beta1
Kind:         Bucket
# Output trimmed for brevity
Spec:
  Deletion Policy:  Delete
  For Provider:
    Location:       US
    Storage Class:  MULTI_REGIONAL
  Provider Config Ref:
    Name:  default
Status:
  At Provider:
  Conditions:
    Last Transition Time:  2022-10-13T02:39:18Z
    Message:               observe failed: cannot run refresh: refresh failed: Error when reading or editing Storage Bucket "upbound-bucket-b7cf6b590": Get "https://storage.googleapis.com/storage/v1/b/upbound-bucket-b7cf6b590?alt=json&prettyPrint=false": private key should be a PEM or plain PKCS1 or PKCS8; parse error: x509: failed to parse private key (use ParsePKCS8PrivateKey instead for this key format):
    Reason:                ReconcileError
    Status:                False
    Type:                  Synced
Events:
  Type     Reason                         Age              From                                                 Message
  ----     ------                         ----             ----                                                 -------
  Warning  CannotObserveExternalResource  1s (x4 over 7s)  managed/storage.gcp.upbound.io/v1beta1, kind=bucket  cannot run refresh: refresh failed: Error when reading or editing Storage Bucket "upbound-bucket-b7cf6b590": Get "https://storage.googleapis.com/storage/v1/b/upbound-bucket-b7cf6b590?alt=json&prettyPrint=false": private key should be a PEM or plain PKCS1 or PKCS8; parse error: x509: failed to parse private key (use ParsePKCS8PrivateKey instead for this key format):
  ```
<!-- vale alex.Ablist = NO --> 
<!-- allow "invalid" since it quotes the error -->
The error message in the _Events_ log indicates the problem.  
{{< hover label="bad-auth" line="28">}}private key should be a PEM or plain PKCS1 or PKCS8; parse error: x509: failed to parse private key{{< /hover >}}.  

This indicates the GCP authorization JSON file 
<!-- vale alex.Ablist = YES --> 

To fix the problem:

* Update your GCP credentials in the `gcp-credentials.json` file.
* Delete the original Kubernetes _secret_ with  
* `kubectl delete secret gcp-secret -n upbound-system`
* Create a new _secret_ with   
`kubectl create secret generic gcp-secret -n upbound-system --from-file=creds=gcp-credentials.json`
* Delete the `ProviderConfig` with  
`kubectl delete providerconfigs.gcp.upbound.io/default`
* Recreate the `ProviderConfig` with the output in the [ProviderConfig section](#create-a-providerconfig).
* Create the [bucket again](#create-a-managed-resource).

{{< hint type="note" >}}
Deleting the `ProviderConfig` isn't required, but is faster than waiting for Kubernetes to synchronize and update.
{{< /hint >}}

Still need help? Join the [Crossplane Slack](https://slack.crossplane.io/) and ask in the  `#Upbound` room to get help directly from Upbound employees and community members.

{{< /expand >}}

### Delete the managed resource
Before shutting down your Kubernetes cluster, delete the S3 bucket just created.

Use `kubectl delete bucket <bucketname>` to remove the bucket.

```shell
kubectl delete bucket $bucket
bucket.storage.gcp.upbound.io "upbound-bucket-b7cf6b590" deleted
```

Look in the [GCP Console](https://console.cloud.google.com/) to confirm Crossplane deleted the bucket from GCP.

{{< img alt="The Google Cloud console showing no buckets exist, indicating Crossplane deleted the storage bucket managed resource." src="images/gcp-bucket-delete.png" >}}

### Next steps 
* Explore GCP resources that can Crossplane can configure in the [Provider CRD reference](https://marketplace.upbound.io/providers/upbound/provider-gcp/latest/crds).
* Learn about [Crossplane configuration packages]({{<ref "uxp/crossplane-concepts/packages">}}) to make your cloud platform fully portable.
* Join the [Crossplane Slack](https://slack.crossplane.io/) and the `#Upbound` room to connect with Crossplane users and contributors.