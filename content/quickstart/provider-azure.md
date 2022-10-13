---
title: Azure Quickstart 
---

Connect Crossplane to Microsoft Azure to create and manage cloud resources from Kubernetes with the [Azure Official Provider](https://marketplace.upbound.io/providers/upbound/provider-azure).

This guide walks you through the steps required to get started with the Azure Official Provider. This includes installing Upbound Universal Crossplane, configuring the provider to authenticate to Azure and creating a _Managed Resource_ in Azure directly from your Kubernetes cluster.

- [Prerequisites](#prerequisites)
- [Guided tour](#guided-tour)
  - [Install the official Azure provider](#install-the-official-azure-provider)
  - [Create a Kubernetes secret for Azure](#create-a-kubernetes-secret-for-azure)
    - [Install the Azure command-line](#install-the-azure-command-line)
    - [Create an Azure service principal](#create-an-azure-service-principal)
    - [Create a Kubernetes secret with the Azure credentials](#create-a-kubernetes-secret-with-the-azure-credentials)
  - [Create a ProviderConfig](#create-a-providerconfig)
  - [Create a managed resource](#create-a-managed-resource)
  - [Delete the managed resource](#delete-the-managed-resource)
  - [Next steps](#next-steps)

## Prerequisites
This quickstart requires:
* a Kubernetes cluster with at least 3 GB of RAM
* permissions to create pods and secrets in the Kubernetes cluster
* an Azure account with permissions to create an Azure [service principal](https://learn.microsoft.com/en-us/azure/active-directory/develop/app-objects-and-service-principals#service-principal-object) and an [Azure Resource Group](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/manage-resource-groups-portal)

{{< hint type="tip" >}}
If you don't have a Kubernetes cluster create one locally with [minikube](https://minikube.sigs.k8s.io/docs/start/) or [kind](https://kind.sigs.k8s.io/).
{{< /hint >}}

<!-- due to Azure CLI auth, this can't be automated -->

## Guided tour
{{< hint type="note" >}}
All commands use the current `kubeconfig` context and configuration. 
{{< /hint >}}

{{< include file="quickstart/quickstart-common.md" type="page" >}}

### Install the official Azure provider

Install the official provider into the Kubernetes cluster with the `up` command-line or a Kubernetes configuration file. 
{{< tabs "provider-install" >}}

{{< tab "with the Up command-line" >}}
```shell {copy-lines="all"}
up controlplane \
provider install \
xpkg.upbound.io/upbound/provider-azure:v0.16.0
```
{{< /tab >}}

{{< tab "with a Kubernetes manifest" >}}
```shell {label="provider",copy-lines="all"}
cat <<EOF | kubectl apply -f -
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: upbound-provider-azure
spec:
  package: xpkg.upbound.io/upbound/provider-azure:v0.16.0
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
NAME                     INSTALLED   HEALTHY   PACKAGE                                          AGE
upbound-provider-azure   True        True      xpkg.upbound.io/upbound/provider-azure:v0.16.0   3m3s
```

A provider installs their own Kubernetes _Custom Resource Definitions_ (CRDs). These CRDs allow you to create Azure resources directly inside Kubernetes.

You can view the new CRDs with `kubectl get crds`. Every CRD maps to a unique Azure service Crossplane can provision and manage.
<!-- vale gitlab.SubstitutionWarning = NO -->
<!-- disable "click" error. The user needs to actually click the button -->
{{< expand "Click to see the Azure CRDs" >}}
<!-- vale gitlab.SubstitutionWarning = YES -->
```shell
kubectl get crds
NAME                                                                            CREATED AT
accesspolicies.keyvault.azure.upbound.io                                        2022-10-12T01:06:59Z
accountnetworkrules.storage.azure.upbound.io                                    2022-10-12T01:07:02Z
accounts.cosmosdb.azure.upbound.io                                              2022-10-12T01:06:58Z
accounts.datashare.azure.upbound.io                                             2022-10-12T01:06:58Z
accounts.netapp.azure.upbound.io                                                2022-10-12T01:07:00Z
accounts.storage.azure.upbound.io                                               2022-10-12T01:07:02Z
activedirectoryadministrators.dbforpostgresql.azure.upbound.io                  2022-10-12T01:06:59Z
advancedthreatprotections.security.azure.upbound.io                             2022-10-12T01:07:02Z
agentpools.containerregistry.azure.upbound.io                                   2022-10-12T01:06:58Z
applicationgateways.network.azure.upbound.io                                    2022-10-12T01:07:00Z
applicationinsights.insights.azure.upbound.io                                   2022-10-12T01:07:00Z
applicationsecuritygroups.network.azure.upbound.io                              2022-10-12T01:07:00Z
assets.media.azure.upbound.io                                                   2022-10-12T01:07:00Z
authorizationrules.eventhub.azure.upbound.io                                    2022-10-12T01:06:59Z
availabilitysets.compute.azure.upbound.io                                       2022-10-12T01:06:58Z
backuppolicyblobstorages.dataprotection.azure.upbound.io                        2022-10-12T01:06:58Z
backupvaults.dataprotection.azure.upbound.io                                    2022-10-12T01:06:59Z
blobinventorypolicies.storage.azure.upbound.io                                  2022-10-12T01:07:02Z
blobs.storage.azure.upbound.io                                                  2022-10-12T01:07:02Z
cassandraclusters.cosmosdb.azure.upbound.io                                     2022-10-12T01:06:58Z
cassandradatacenters.cosmosdb.azure.upbound.io                                  2022-10-12T01:06:58Z
cassandrakeyspaces.cosmosdb.azure.upbound.io                                    2022-10-12T01:06:58Z
cassandratables.cosmosdb.azure.upbound.io                                       2022-10-12T01:06:58Z
certificateissuers.keyvault.azure.upbound.io                                    2022-10-12T01:06:59Z
certificates.keyvault.azure.upbound.io                                          2022-10-12T01:07:00Z
clusters.kusto.azure.upbound.io                                                 2022-10-12T01:07:00Z
clusters.streamanalytics.azure.upbound.io                                       2022-10-12T01:07:02Z
compositeresourcedefinitions.apiextensions.crossplane.io                        2022-10-12T01:05:33Z
compositionrevisions.apiextensions.crossplane.io                                2022-10-12T01:05:33Z
compositions.apiextensions.crossplane.io                                        2022-10-12T01:05:33Z
configurationrevisions.pkg.crossplane.io                                        2022-10-12T01:05:33Z
configurations.dbformariadb.azure.upbound.io                                    2022-10-12T01:06:59Z
configurations.dbformysql.azure.upbound.io                                      2022-10-12T01:06:59Z
configurations.dbforpostgresql.azure.upbound.io                                 2022-10-12T01:06:59Z
configurations.pkg.crossplane.io                                                2022-10-12T01:05:33Z
connectionmonitors.network.azure.upbound.io                                     2022-10-12T01:07:00Z
consumergroups.eventhub.azure.upbound.io                                        2022-10-12T01:06:59Z
containerconnectedregistries.containerregistry.azure.upbound.io                 2022-10-12T01:06:58Z
containers.storage.azure.upbound.io                                             2022-10-12T01:07:02Z
controllerconfigs.pkg.crossplane.io                                             2022-10-12T01:05:33Z
databases.dbformariadb.azure.upbound.io                                         2022-10-12T01:06:59Z
databases.dbforpostgresql.azure.upbound.io                                      2022-10-12T01:06:59Z
databases.kusto.azure.upbound.io                                                2022-10-12T01:07:00Z
datalakegen2filesystems.storage.azure.upbound.io                                2022-10-12T01:07:02Z
datasetblobstorages.datashare.azure.upbound.io                                  2022-10-12T01:06:58Z
datasetdatalakegen2s.datashare.azure.upbound.io                                 2022-10-12T01:06:58Z
datasetkustoclusters.datashare.azure.upbound.io                                 2022-10-12T01:06:58Z
datasetkustodatabases.datashare.azure.upbound.io                                2022-10-12T01:06:59Z
datashares.datashare.azure.upbound.io                                           2022-10-12T01:06:59Z
ddosprotectionplans.network.azure.upbound.io                                    2022-10-12T01:07:00Z
dedicatedhosts.compute.azure.upbound.io                                         2022-10-12T01:06:58Z
diskaccesses.compute.azure.upbound.io                                           2022-10-12T01:06:58Z
diskencryptionsets.compute.azure.upbound.io                                     2022-10-12T01:06:58Z
dnsaaaarecords.network.azure.upbound.io                                         2022-10-12T01:07:00Z
dnsarecords.network.azure.upbound.io                                            2022-10-12T01:07:00Z
dnscaarecords.network.azure.upbound.io                                          2022-10-12T01:07:00Z
dnscnamerecords.network.azure.upbound.io                                        2022-10-12T01:07:00Z
dnsmxrecords.network.azure.upbound.io                                           2022-10-12T01:07:00Z
dnsnsrecords.network.azure.upbound.io                                           2022-10-12T01:07:00Z
dnsptrrecords.network.azure.upbound.io                                          2022-10-12T01:07:00Z
dnssrvrecords.network.azure.upbound.io                                          2022-10-12T01:07:00Z
dnstxtrecords.network.azure.upbound.io                                          2022-10-12T01:07:00Z
dnszones.network.azure.upbound.io                                               2022-10-12T01:07:00Z
encryptionscopes.storage.azure.upbound.io                                       2022-10-12T01:07:02Z
eventhubnamespaces.eventhub.azure.upbound.io                                    2022-10-12T01:06:59Z
eventhubs.eventhub.azure.upbound.io                                             2022-10-12T01:06:59Z
expressroutecircuitauthorizations.network.azure.upbound.io                      2022-10-12T01:07:00Z
expressroutecircuitconnections.network.azure.upbound.io                         2022-10-12T01:07:00Z
expressroutecircuitpeerings.network.azure.upbound.io                            2022-10-12T01:07:00Z
expressroutecircuits.network.azure.upbound.io                                   2022-10-12T01:07:00Z
expressrouteconnections.network.azure.upbound.io                                2022-10-12T01:07:00Z
expressroutegateways.network.azure.upbound.io                                   2022-10-12T01:07:00Z
expressrouteports.network.azure.upbound.io                                      2022-10-12T01:07:00Z
firewallapplicationrulecollections.network.azure.upbound.io                     2022-10-12T01:07:00Z
firewallnatrulecollections.network.azure.upbound.io                             2022-10-12T01:07:00Z
firewallnetworkrulecollections.network.azure.upbound.io                         2022-10-12T01:07:00Z
firewallpolicies.network.azure.upbound.io                                       2022-10-12T01:07:01Z
firewallpolicyrulecollectiongroups.network.azure.upbound.io                     2022-10-12T01:07:01Z
firewallrules.dbformariadb.azure.upbound.io                                     2022-10-12T01:06:58Z
firewallrules.dbformysql.azure.upbound.io                                       2022-10-12T01:06:59Z
firewallrules.dbforpostgresql.azure.upbound.io                                  2022-10-12T01:06:59Z
firewalls.network.azure.upbound.io                                              2022-10-12T01:07:01Z
flexibledatabases.dbformysql.azure.upbound.io                                   2022-10-12T01:06:59Z
flexibleserverconfigurations.dbformysql.azure.upbound.io                        2022-10-12T01:06:59Z
flexibleserverconfigurations.dbforpostgresql.azure.upbound.io                   2022-10-12T01:06:59Z
flexibleserverdatabases.dbforpostgresql.azure.upbound.io                        2022-10-12T01:06:59Z
flexibleserverfirewallrules.dbformysql.azure.upbound.io                         2022-10-12T01:06:59Z
flexibleserverfirewallrules.dbforpostgresql.azure.upbound.io                    2022-10-12T01:06:59Z
flexibleservers.dbformysql.azure.upbound.io                                     2022-10-12T01:06:59Z
flexibleservers.dbforpostgresql.azure.upbound.io                                2022-10-12T01:06:59Z
frontdoorcustomhttpsconfigurations.network.azure.upbound.io                     2022-10-12T01:07:01Z
frontdoorfirewallpolicies.network.azure.upbound.io                              2022-10-12T01:07:01Z
frontdoorrulesengines.network.azure.upbound.io                                  2022-10-12T01:07:01Z
frontdoors.network.azure.upbound.io                                             2022-10-12T01:07:01Z
functionjavascriptudas.streamanalytics.azure.upbound.io                         2022-10-12T01:07:02Z
gremlindatabases.cosmosdb.azure.upbound.io                                      2022-10-12T01:06:58Z
gremlingraphs.cosmosdb.azure.upbound.io                                         2022-10-12T01:06:58Z
hpccacheaccesspolicies.storagecache.azure.upbound.io                            2022-10-12T01:07:02Z
hpccacheblobnfstargets.storagecache.azure.upbound.io                            2022-10-12T01:07:02Z
hpccacheblobtargets.storagecache.azure.upbound.io                               2022-10-12T01:07:02Z
hpccachenfstargets.storagecache.azure.upbound.io                                2022-10-12T01:07:02Z
hpccaches.storagecache.azure.upbound.io                                         2022-10-12T01:07:02Z
images.compute.azure.upbound.io                                                 2022-10-12T01:06:58Z
integrationserviceenvironments.logic.azure.upbound.io                           2022-10-12T01:07:00Z
iothubconsumergroups.devices.azure.upbound.io                                   2022-10-12T01:06:59Z
iothubdps.devices.azure.upbound.io                                              2022-10-12T01:06:59Z
iothubdpscertificates.devices.azure.upbound.io                                  2022-10-12T01:06:59Z
iothubdpssharedaccesspolicies.devices.azure.upbound.io                          2022-10-12T01:06:59Z
iothubendpointeventhubs.devices.azure.upbound.io                                2022-10-12T01:06:59Z
iothubendpointservicebusqueues.devices.azure.upbound.io                         2022-10-12T01:06:59Z
iothubendpointservicebustopics.devices.azure.upbound.io                         2022-10-12T01:06:59Z
iothubendpointstoragecontainers.devices.azure.upbound.io                        2022-10-12T01:06:59Z
iothubenrichments.devices.azure.upbound.io                                      2022-10-12T01:06:59Z
iothubfallbackroutes.devices.azure.upbound.io                                   2022-10-12T01:06:59Z
iothubroutes.devices.azure.upbound.io                                           2022-10-12T01:06:59Z
iothubs.devices.azure.upbound.io                                                2022-10-12T01:06:59Z
iothubsharedaccesspolicies.devices.azure.upbound.io                             2022-10-12T01:06:59Z
iotsecuritydevicegroups.security.azure.upbound.io                               2022-10-12T01:07:02Z
iotsecuritysolutions.security.azure.upbound.io                                  2022-10-12T01:07:02Z
ipgroups.network.azure.upbound.io                                               2022-10-12T01:07:01Z
jobs.streamanalytics.azure.upbound.io                                           2022-10-12T01:07:02Z
keys.keyvault.azure.upbound.io                                                  2022-10-12T01:06:59Z
kubernetesclusternodepools.containerservice.azure.upbound.io                    2022-10-12T01:06:58Z
kubernetesclusters.containerservice.azure.upbound.io                            2022-10-12T01:06:58Z
linuxvirtualmachines.compute.azure.upbound.io                                   2022-10-12T01:06:58Z
linuxvirtualmachinescalesets.compute.azure.upbound.io                           2022-10-12T01:06:58Z
liveeventoutputs.media.azure.upbound.io                                         2022-10-12T01:07:00Z
liveevents.media.azure.upbound.io                                               2022-10-12T01:07:00Z
loadbalancerbackendaddresspooladdresses.network.azure.upbound.io                2022-10-12T01:07:01Z
loadbalancerbackendaddresspools.network.azure.upbound.io                        2022-10-12T01:07:01Z
loadbalancernatpools.network.azure.upbound.io                                   2022-10-12T01:07:01Z
loadbalancernatrules.network.azure.upbound.io                                   2022-10-12T01:07:01Z
loadbalanceroutboundrules.network.azure.upbound.io                              2022-10-12T01:07:01Z
loadbalancerprobes.network.azure.upbound.io                                     2022-10-12T01:07:01Z
loadbalancerrules.network.azure.upbound.io                                      2022-10-12T01:07:01Z
loadbalancers.network.azure.upbound.io                                          2022-10-12T01:07:01Z
localnetworkgateways.network.azure.upbound.io                                   2022-10-12T01:07:01Z
locks.pkg.crossplane.io                                                         2022-10-12T01:05:33Z
manageddisks.compute.azure.upbound.io                                           2022-10-12T01:06:58Z
managedhardwaresecuritymodules.keyvault.azure.upbound.io                        2022-10-12T01:07:00Z
managedprivateendpoints.streamanalytics.azure.upbound.io                        2022-10-12T01:07:02Z
managedstorageaccounts.keyvault.azure.upbound.io                                2022-10-12T01:07:00Z
managedstorageaccountsastokendefinitions.keyvault.azure.upbound.io              2022-10-12T01:07:00Z
managementgroups.management.azure.upbound.io                                    2022-10-12T01:07:00Z
managementpolicies.storage.azure.upbound.io                                     2022-10-12T01:07:02Z
managements.apimanagement.azure.upbound.io                                      2022-10-12T01:06:58Z
marketplaceagreements.marketplaceordering.azure.upbound.io                      2022-10-12T01:07:00Z
mongocollections.cosmosdb.azure.upbound.io                                      2022-10-12T01:06:58Z
mongodatabases.cosmosdb.azure.upbound.io                                        2022-10-12T01:06:58Z
monitoractiongroups.insights.azure.upbound.io                                   2022-10-12T01:06:59Z
monitormetricalerts.insights.azure.upbound.io                                   2022-10-12T01:06:59Z
monitorprivatelinkscopedservices.insights.azure.upbound.io                      2022-10-12T01:06:59Z
monitorprivatelinkscopes.insights.azure.upbound.io                              2022-10-12T01:06:59Z
mssqldatabases.sql.azure.upbound.io                                             2022-10-12T01:07:02Z
mssqlfailovergroups.sql.azure.upbound.io                                        2022-10-12T01:07:02Z
mssqlmanageddatabases.sql.azure.upbound.io                                      2022-10-12T01:07:02Z
mssqlmanagedinstanceactivedirectoryadministrators.sql.azure.upbound.io          2022-10-12T01:07:02Z
mssqlmanagedinstancefailovergroups.sql.azure.upbound.io                         2022-10-12T01:07:02Z
mssqlmanagedinstances.sql.azure.upbound.io                                      2022-10-12T01:07:02Z
mssqlmanagedinstancevulnerabilityassessments.sql.azure.upbound.io               2022-10-12T01:07:02Z
mssqloutboundfirewallrules.sql.azure.upbound.io                                 2022-10-12T01:07:02Z
mssqlserverdnsaliases.sql.azure.upbound.io                                      2022-10-12T01:07:02Z
mssqlservers.sql.azure.upbound.io                                               2022-10-12T01:07:02Z
mssqlservertransparentdataencryptions.sql.azure.upbound.io                      2022-10-12T01:07:02Z
mssqlvirtualnetworkrules.sql.azure.upbound.io                                   2022-10-12T01:07:02Z
natgatewaypublicipassociations.network.azure.upbound.io                         2022-10-12T01:07:01Z
natgatewaypublicipprefixassociations.network.azure.upbound.io                   2022-10-12T01:07:01Z
natgateways.network.azure.upbound.io                                            2022-10-12T01:07:01Z
networkinterfaceapplicationsecuritygroupassociations.network.azure.upbound.io   2022-10-12T01:07:01Z
networkinterfacebackendaddresspoolassociations.network.azure.upbound.io         2022-10-12T01:07:01Z
networkinterfacenatruleassociations.network.azure.upbound.io                    2022-10-12T01:07:01Z
networkinterfaces.network.azure.upbound.io                                      2022-10-12T01:07:01Z
networkinterfacesecuritygroupassociations.network.azure.upbound.io              2022-10-12T01:07:01Z
notificationhubs.notificationhubs.azure.upbound.io                              2022-10-12T01:07:02Z
objectreplications.storage.azure.upbound.io                                     2022-10-12T01:07:02Z
orchestratedvirtualmachinescalesets.compute.azure.upbound.io                    2022-10-12T01:06:58Z
outputblobs.streamanalytics.azure.upbound.io                                    2022-10-12T01:07:02Z
outputfunctions.streamanalytics.azure.upbound.io                                2022-10-12T01:07:02Z
outputsynapses.streamanalytics.azure.upbound.io                                 2022-10-12T01:07:03Z
packetcaptures.network.azure.upbound.io                                         2022-10-12T01:07:01Z
pointtositevpngateways.network.azure.upbound.io                                 2022-10-12T01:07:01Z
policydefinitions.authorization.azure.upbound.io                                2022-10-12T01:06:57Z
pools.netapp.azure.upbound.io                                                   2022-10-12T01:07:00Z
privatednsaaaarecords.network.azure.upbound.io                                  2022-10-12T01:07:01Z
privatednsarecords.network.azure.upbound.io                                     2022-10-12T01:07:01Z
privatednscnamerecords.network.azure.upbound.io                                 2022-10-12T01:07:01Z
privatednsmxrecords.network.azure.upbound.io                                    2022-10-12T01:07:01Z
privatednsptrrecords.network.azure.upbound.io                                   2022-10-12T01:07:01Z
privatednssrvrecords.network.azure.upbound.io                                   2022-10-12T01:07:01Z
privatednstxtrecords.network.azure.upbound.io                                   2022-10-12T01:07:01Z
privatednszones.network.azure.upbound.io                                        2022-10-12T01:07:01Z
privatednszonevirtualnetworklinks.network.azure.upbound.io                      2022-10-12T01:07:01Z
privateendpoints.network.azure.upbound.io                                       2022-10-12T01:07:01Z
privatelinkservices.network.azure.upbound.io                                    2022-10-12T01:07:01Z
profiles.network.azure.upbound.io                                               2022-10-12T01:07:01Z
providerconfigs.azure.upbound.io                                                2022-10-12T01:06:57Z
providerconfigusages.azure.upbound.io                                           2022-10-12T01:06:57Z
providerrevisions.pkg.crossplane.io                                             2022-10-12T01:05:33Z
providers.pkg.crossplane.io                                                     2022-10-12T01:05:33Z
proximityplacementgroups.compute.azure.upbound.io                               2022-10-12T01:06:58Z
publicipprefixes.network.azure.upbound.io                                       2022-10-12T01:07:01Z
publicips.network.azure.upbound.io                                              2022-10-12T01:07:01Z
queues.storage.azure.upbound.io                                                 2022-10-12T01:07:02Z
rediscaches.cache.azure.upbound.io                                              2022-10-12T01:06:58Z
redisenterpriseclusters.cache.azure.upbound.io                                  2022-10-12T01:06:58Z
redisenterprisedatabases.cache.azure.upbound.io                                 2022-10-12T01:06:57Z
redisfirewallrules.cache.azure.upbound.io                                       2022-10-12T01:06:58Z
redislinkedservers.cache.azure.upbound.io                                       2022-10-12T01:06:58Z
registries.containerregistry.azure.upbound.io                                   2022-10-12T01:06:58Z
resourcegrouppolicyassignments.authorization.azure.upbound.io                   2022-10-12T01:06:57Z
resourcegroups.azure.upbound.io                                                 2022-10-12T01:06:57Z
resourcegrouptemplatedeployments.resources.azure.upbound.io                     2022-10-12T01:07:02Z
resourceproviderregistrations.azure.upbound.io                                  2022-10-12T01:06:57Z
roleassignments.authorization.azure.upbound.io                                  2022-10-12T01:06:57Z
routetables.network.azure.upbound.io                                            2022-10-12T01:07:01Z
scopemaps.containerregistry.azure.upbound.io                                    2022-10-12T01:06:58Z
secrets.keyvault.azure.upbound.io                                               2022-10-12T01:07:00Z
securitygroups.network.azure.upbound.io                                         2022-10-12T01:07:01Z
securityrules.network.azure.upbound.io                                          2022-10-12T01:07:01Z
serverkeys.dbforpostgresql.azure.upbound.io                                     2022-10-12T01:06:59Z
servers.dbformariadb.azure.upbound.io                                           2022-10-12T01:06:59Z
servers.dbformysql.azure.upbound.io                                             2022-10-12T01:06:59Z
servers.dbforpostgresql.azure.upbound.io                                        2022-10-12T01:06:59Z
servicesaccounts.media.azure.upbound.io                                         2022-10-12T01:07:00Z
sharedimagegalleries.compute.azure.upbound.io                                   2022-10-12T01:06:58Z
shares.storage.azure.upbound.io                                                 2022-10-12T01:07:02Z
snapshotpolicies.netapp.azure.upbound.io                                        2022-10-12T01:07:00Z
snapshots.compute.azure.upbound.io                                              2022-10-12T01:06:58Z
snapshots.netapp.azure.upbound.io                                               2022-10-12T01:07:00Z
spatialanchorsaccounts.mixedreality.azure.upbound.io                            2022-10-12T01:07:00Z
sqlcontainers.cosmosdb.azure.upbound.io                                         2022-10-12T01:06:58Z
sqldatabases.cosmosdb.azure.upbound.io                                          2022-10-12T01:06:58Z
sqlfunctions.cosmosdb.azure.upbound.io                                          2022-10-12T01:06:58Z
sqlroleassignments.cosmosdb.azure.upbound.io                                    2022-10-12T01:06:58Z
sqlroledefinitions.cosmosdb.azure.upbound.io                                    2022-10-12T01:06:58Z
sqlstoredprocedures.cosmosdb.azure.upbound.io                                   2022-10-12T01:06:58Z
sqltriggers.cosmosdb.azure.upbound.io                                           2022-10-12T01:06:58Z
storagesyncs.storagesync.azure.upbound.io                                       2022-10-12T01:07:02Z
storeconfigs.azure.upbound.io                                                   2022-10-12T01:06:57Z
storeconfigs.secrets.crossplane.io                                              2022-10-12T01:05:33Z
streamingendpoints.media.azure.upbound.io                                       2022-10-12T01:07:00Z
streaminglocators.media.azure.upbound.io                                        2022-10-12T01:07:00Z
streamingpolicies.media.azure.upbound.io                                        2022-10-12T01:07:00Z
subnetnatgatewayassociations.network.azure.upbound.io                           2022-10-12T01:07:01Z
subnetnetworksecuritygroupassociations.network.azure.upbound.io                 2022-10-12T01:07:01Z
subnetroutetableassociations.network.azure.upbound.io                           2022-10-12T01:07:01Z
subnets.network.azure.upbound.io                                                2022-10-12T01:07:01Z
subnetserviceendpointstoragepolicies.network.azure.upbound.io                   2022-10-12T01:07:01Z
subscriptions.azure.upbound.io                                                  2022-10-12T01:06:57Z
tables.cosmosdb.azure.upbound.io                                                2022-10-12T01:06:58Z
tables.storage.azure.upbound.io                                                 2022-10-12T01:07:02Z
tokens.containerregistry.azure.upbound.io                                       2022-10-12T01:06:58Z
transforms.media.azure.upbound.io                                               2022-10-12T01:07:00Z
vaults.keyvault.azure.upbound.io                                                2022-10-12T01:07:00Z
virtualhubs.network.azure.upbound.io                                            2022-10-12T01:07:01Z
virtualnetworkgatewayconnections.network.azure.upbound.io                       2022-10-12T01:07:02Z
virtualnetworkgateways.network.azure.upbound.io                                 2022-10-12T01:07:02Z
virtualnetworkpeerings.network.azure.upbound.io                                 2022-10-12T01:07:02Z
virtualnetworkrules.dbformariadb.azure.upbound.io                               2022-10-12T01:06:59Z
virtualnetworkrules.dbformysql.azure.upbound.io                                 2022-10-12T01:06:59Z
virtualnetworkrules.dbforpostgresql.azure.upbound.io                            2022-10-12T01:06:59Z
virtualnetworks.network.azure.upbound.io                                        2022-10-12T01:07:02Z
virtualwans.network.azure.upbound.io                                            2022-10-12T01:07:02Z
volumes.netapp.azure.upbound.io                                                 2022-10-12T01:07:00Z
vpnserverconfigurations.network.azure.upbound.io                                2022-10-12T01:07:02Z
watcherflowlogs.network.azure.upbound.io                                        2022-10-12T01:07:02Z
watchers.network.azure.upbound.io                                               2022-10-12T01:07:02Z
webhooks.containerregistry.azure.upbound.io                                     2022-10-12T01:06:58Z
windowsvirtualmachines.compute.azure.upbound.io                                 2022-10-12T01:06:58Z
windowsvirtualmachinescalesets.compute.azure.upbound.io                         2022-10-12T01:06:58Z
workspaces.operationalinsights.azure.upbound.io                                 2022-10-12T01:07:02Z
```
{{< /expand >}}

### Create a Kubernetes secret for Azure
The provider requires credentials to create and manage Azure resources. Providers use a Kubernetes _Secret_ to connect the credentials to the provider.

First generate a Kubernetes _Secret_ from your Azure JSON file and then configure the Provider to use it.

{{<expand "Need to generate an Azure JSON file?" >}}
#### Install the Azure command-line
Generating an [authentication file](https://docs.microsoft.com/en-us/azure/developer/go/azure-sdk-authorization#use-file-based-authentication) requires the Azure command-line.  
Follow the documentation from Microsoft to [Download and install the Azure command-line](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli).

Log in to the Azure command-line.

```command
az login
```
#### Create an Azure service principal
Follow the Azure documentation to [find your Subscription ID](https://docs.microsoft.com/en-us/azure/azure-portal/get-subscription-tenant-id) from the Azure Portal.

Using the Azure command-line and provide your Subscription ID create a service principal and authentication file.

```shell {copy-lines="all"}
az ad sp create-for-rbac \
--sdk-auth \
--role Owner \
--scopes /subscriptions/<Subscription ID> 
```
{{< hint type="note" >}}
The Azure command-line prints an expected deprecation warning for `--sdk-auth`.
{{< /hint >}}

The command generates a JSON file like this:
```json
{
  "clientId": "5d73973c-1933-4621-9f6a-9642db949768",
  "clientSecret": "24O8Q~db2DFJ123MBpB25hdESvV3Zy8bfeGYGcSd",
  "subscriptionId": "c02e2b27-21ef-48e3-96b9-a91305e9e010",
  "tenantId": "7060afec-1db7-4b6f-a44f-82c9c6d8762a",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```
{{< /expand >}}

Save your Azure JSON output as `azure-credentials.json`.

{{< hint type="note" >}}
The [Configuration](https://marketplace.upbound.io/providers/upbound/provider-azure/latest/docs/configuration) section of the Provider documentation describes other authentication methods.
{{< /hint >}}

#### Create a Kubernetes secret with the Azure credentials
A Kubernetes generic secret has a name and contents. Use {{< hover label="kube-create-secret" line="1">}}kubectl create secret{{< /hover >}} to generate the secret object named {{< hover label="kube-create-secret" line="2">}}azure-secret{{< /hover >}} in the {{< hover label="kube-create-secret" line="3">}}upbound-system{{</ hover >}} namespace.  

<!-- vale gitlab.Substitutions = NO -->
<!-- ignore .json file name -->
Use the {{< hover label="kube-create-secret" line="4">}}--from-file={{</hover>}} argument to set the value to the contents of the  {{< hover label="kube-create-secret" line="4">}}azure-credentials.json{{< /hover >}} file.
<!-- vale gitlab.Substitutions = YES -->
```shell {label="kube-create-secret",copy-lines="all"}
kubectl create secret \
generic azure-secret \
-n upbound-system \
--from-file=creds=./azure-credentials.json
```

View the secret with `kubectl describe secret`

{{< hint type="note" >}}
The size may be larger if there are extra blank spaces in your text file.
{{< /hint >}}

```shell
kubectl describe secret azure-secret -n upbound-system
Name:         azure-secret
Namespace:    upbound-system
Labels:       <none>
Annotations:  <none>

Type:  Opaque

Data
====
creds:  629 bytes
```

### Create a ProviderConfig
A `ProviderConfig` customizes the settings of the Azure Provider.  

Apply the {{< hover label="providerconfig" line="2">}}ProviderConfig{{</ hover >}} with the command:
```yaml {label="providerconfig",copy-lines="all"}
cat <<EOF | kubectl apply -f -
apiVersion: azure.upbound.io/v1beta1
metadata:
  name: default
kind: ProviderConfig
spec:
  credentials:
    source: Secret
    secretRef:
      namespace: upbound-system
      name: azure-secret
      key: creds
EOF
```

This attaches the Azure credentials, saved as a Kubernetes secret, as a {{< hover label="providerconfig" line="9">}}secretRef{{</ hover>}}.

The {{< hover label="providerconfig" line="11">}}spec.credentials.secretRef.name{{< /hover >}} value is the name of the Kubernetes secret containing the Azure credentials in the {{< hover label="providerconfig" line="10">}}spec.credentials.secretRef.namespace{{< /hover >}}.


### Create a managed resource
A _managed resource_ is anything Crossplane creates and manages outside of the Kubernetes cluster. This creates an Azure Resource group with Crossplane. The Resource group is a _managed resource_.

{{< hint type="tip" >}}
A resource group is one of the fastest Azure resources to provision.
{{< /hint >}}

```yaml {label="xr",copy-lines="all"}
cat <<EOF | kubectl apply -f -
apiVersion: azure.upbound.io/v1beta1
kind: ResourceGroup
metadata:
  name: example-rg
spec:
  forProvider:
    location: "East US"
  providerConfigRef:
    name: default
EOF
```

Notice the {{< hover label="xr" line="2">}}apiVersion{{< /hover >}} and {{< hover label="xr" line="3">}}kind{{</hover >}} are from the `Provider's` CRDs.

The {{< hover label="xr" line="5">}}metadata.name{{< /hover >}} value is the name of the created resource group in Azure.  
This example uses the name `example-rg`.

The {{< hover label="xr" line="8">}}spec.forProvider.location{{< /hover >}} tells Azure which Azure region to use when deploying resources. The region can be any [Azure geography](https://azure.microsoft.com/en-us/explore/global-infrastructure/geographies/) code.

Use `kubectl get resourcegroup` to verify Crossplane created the resource group.

```shell
kubectl get ResourceGroup
NAME         READY   SYNCED   EXTERNAL-NAME   AGE
example-rg   True    True     example-rg      4m58s
```

Optionally, log into the [Azure Portal](https://https://portal.azure.com/) and see the resource group inside Azure.

{{< img src="images/azure-rg-create.png" alt="Azure portal shows a resource-group with the name example-rg that matches the resource group created by Crossplane." >}}


<!-- vale gitlab.SubstitutionWarning = NO -->
<!-- disable "click" error. The user needs to actually click the button -->
{{< expand "Is the resource group not SYNCED? Click here for troubleshooting tips" >}}
<!-- vale gitlab.SubstitutionWarning = YES -->
If the `READY` or `SYNCED` are blank or `False` use `kubectl describe resourcegroup` to understand why.

A common issue is incorrect Azure credentials or not having permissions to create the resource group.

The following output is an example of the `kubectl describe resourcegroup` output when using the wrong Azure credentials.

```shell {label="bad-auth"}
kubectl describe ResourceGroup
Name:         example-rg
Namespace:
Labels:       <none>
Annotations:  crossplane.io/external-name: example-rg
API Version:  azure.upbound.io/v1beta1
Kind:         ResourceGroup
# Output trimmed for brevity
Spec:
  Deletion Policy:  Delete
  For Provider:
    Location:  East US
  Provider Config Ref:
    Name:  default
Status:
  At Provider:
  Conditions:
    Last Transition Time:  2022-10-12T02:17:40Z
    Message:               observe failed: cannot run refresh: refresh failed: building account: getting authenticated object ID: listing Service Principals: ServicePrincipalsClient.BaseClient.Get(): clientCredentialsToken: received HTTP status 401 with response: {"error":"invalid_client","error_description":"AADSTS7000215: Invalid client secret provided. Ensure the secret being sent in the request is the client secret value, not the client secret ID, for a secret added to app '76af2645-91b4-4087-aff3-e05bf1f1b88c'.\r\nTrace ID: 26369fb5-ab9c-4ba2-bb74-179818cc2e00\r\nCorrelation ID: 0fefd33e-dc03-4450-b70f-4b9a9c23143a\r\nTimestamp: 2022-10-12 02:17:40Z","error_codes":[7000215],"timestamp":"2022-10-12 02:17:40Z","trace_id":"26369fb5-ab9c-4ba2-bb74-179818cc2e00","correlation_id":"0fefd33e-dc03-4450-b70f-4b9a9c23143a","error_uri":"https://login.microsoftonline.com/error?code=7000215"}:
    Reason:                ReconcileError
    Status:                False
    Type:                  Synced
Events:
  Type     Reason                         Age              From                                                  Message
  ----     ------                         ----             ----                                                  -------
  Warning  CannotObserveExternalResource  24s              managed/azure.upbound.io/v1beta1, kind=resourcegroup  cannot run refresh: refresh failed: building account: getting authenticated object ID: listing Service Principals: ServicePrincipalsClient.BaseClient.Get(): clientCredentialsToken: received HTTP status 401 with response: {"error":"invalid_client","error_description":"AADSTS7000215: Invalid client secret provided. Ensure the secret being sent in the request is the client secret value, not the client secret ID, for a secret added to app '76af2645-91b4-4087-aff3-e05bf1f1b88c'.\r\nTrace ID: 54dd6c59-972b-4194-8d5c-81ccc9df2700\r\nCorrelation ID: 9d5df199-426b-45d4-bbd4-4d46703dff85\r\nTimestamp: 2022-10-12 02:17:17Z","error_codes":[7000215],"timestamp":"2022-10-12 02:17:17Z","trace_id":"54dd6c59-972b-4194-8d5c-81ccc9df2700","correlation_id":"9d5df199-426b-45d4-bbd4-4d46703dff85","error_uri":"https://login.microsoftonline.com/error?code=7000215"}:
  ```

The error message in the _Condition_ indicates the problem.  
<!-- vale alex.Ablist = NO --> 
<!-- allow "invalid" since it quotes the error -->
{{< hover label="bad-auth" line="19">}} Invalid client secret provided.{{< /hover >}}
<!-- vale alex.Ablist = YES --> 

To fix the problem:

* Update your Azure credentials in the `azure-credentials.json` text file.
* Delete the original Kubernetes _secret_ with  
* `kubectl delete secret azure-secret -n upbound-system`
* Create a new _secret_ with   
`kubectl create secret generic azure-secret -n upbound-system --from-file=creds=azure-credentials.json`
* Delete the `ProviderConfig` with  
`kubectl delete providerconfig.azure.upbound.io/default`
* Recreate the `ProviderConfig` with the output in the [ProviderConfig section](#create-a-providerconfig).
* Create the [resource group again](#create-a-managed-resource).

{{< hint type="note" >}}
Deleting the `ProviderConfig` isn't required, but is faster than waiting for Kubernetes to synchronize and update.
{{< /hint >}}

Still need help? Join the [Crossplane Slack](https://slack.crossplane.io/) and ask in the  `#Upbound` room to get help directly from Upbound employees and community members.

{{< /expand >}}

### Delete the managed resource
Before shutting down your Kubernetes cluster, delete the resource group just created.

Use `kubectl delete resource-group` to remove the bucket.

```shell
kubectl delete resourcegroup example-rg
resourcegroup.azure.upbound.io "example-rg" deleted
```

### Next steps 
* Explore Azure resources that can Crossplane can configure in the [Provider CRD reference](https://marketplace.upbound.io/providers/upbound/provider-azure/v0.16.0/crds).
* Learn about [Crossplane configuration packages]({{<ref "uxp/crossplane-concepts/packages">}}) to make your cloud platform fully portable.
* Join the [Crossplane Slack](https://slack.crossplane.io/) and the `#Upbound` room to connect with Crossplane users and contributors.