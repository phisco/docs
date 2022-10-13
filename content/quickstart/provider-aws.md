---
title: AWS Quickstart
---

Connect Crossplane to AWS to create and manage cloud resources from Kubernetes with the [AWS Official Provider](https://marketplace.upbound.io/providers/upbound/provider-aws).

This guide walks you through the steps required to get started with the AWS Official Provider. This includes installing Upbound Universal Crossplane, configuring the provider to authenticate to AWS and creating a _Managed Resource_ in AWS directly from your Kubernetes cluster.

- [Prerequisites](#prerequisites)
- [Copy and paste quickstart](#copy-and-paste-quickstart)
  - [Bash script](#bash-script)
- [Guided tour](#guided-tour)
  - [Install the official AWS provider](#install-the-official-aws-provider)
  - [Create a Kubernetes secret for AWS](#create-a-kubernetes-secret-for-aws)
    - [Generate an AWS key-pair file](#generate-an-aws-key-pair-file)
    - [Create a Kubernetes secret with the AWS credentials](#create-a-kubernetes-secret-with-the-aws-credentials)
  - [Create a ProviderConfig](#create-a-providerconfig)
  - [Create a managed resource](#create-a-managed-resource)
  - [Delete the managed resource](#delete-the-managed-resource)
  - [Next steps](#next-steps)

## Prerequisites
This quickstart requires:
* a Kubernetes cluster with at least 3 GB of RAM
* permissions to create pods and secrets in the Kubernetes cluster
* an AWS account with permissions to create an S3 storage bucket
* AWS [access keys](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html#cli-configure-quickstart-creds)

{{< hint type="tip" >}}
If you don't have a Kubernetes cluster create one locally with [minikube](https://minikube.sigs.k8s.io/docs/start/) or [kind](https://kind.sigs.k8s.io/).
{{< /hint >}}

You can use this guide in one of two methods:
* [_shell script_](#copy-and-paste-quickstart) - A single shell script prompts you for inputs and runs the commands. At the end you have a complete system to examine.  
* [_guided tour_](#guided-tour) - A step-by-step walk through of the required commands and descriptions on what the commands do.

Both methods create an identical environment. Choose the method that best fits your learning style.

## Copy and paste quickstart

You can either run a single Bash script or run each command individually.

{{< hint type="note" >}}
All commands use the current `kubeconfig` context and configuration. 
{{< /hint >}}

You need your:
* AWS Access Key ID
* AWS Secret Access Key

### Bash script
Download the script with `wget`.
```shell
wget {{< url "quickstart/aws-quickstart-script.sh" >}}
```
{{< expand "Click to view the complete Bash script" >}}

{{< hint type="warning" >}}
Paste this script into a text file and run it as a script. Some terminals don't handle lots of commands at once.
{{< /hint >}}

{{<include file="quickstart/scripts/aws-quickstart-script.sh" language="bash" >}}

Your Kubernetes cluster created this AWS S3 bucket.

Remove it with `kubectl delete bucket <bucket name>`

```shell
kubectl delete bucket upbound-bucket-$VAR
```
{{< /expand >}}

## Guided tour
These steps are the same as the preceding script, but provides more information for each action.

{{< hint type="note" >}}
All commands use the current `kubeconfig` context and configuration. 
{{< /hint >}}

You need your:
* AWS Access Key ID
* AWS Secret Access Key

{{< include file="quickstart/quickstart-common.md" type="page" >}}

### Install the official AWS provider

Install the official provider into the Kubernetes cluster with the `up` command-line or a Kubernetes configuration file. 
{{< tabs "provider-install" >}}

{{< tab "with the Up command-line" >}}
```shell {copy-lines="all"}
up controlplane \
provider install \
xpkg.upbound.io/upbound/provider-aws:v0.17.0
```
{{< /tab >}}

{{< tab "with a Kubernetes manifest" >}}
```shell {label="provider",copy-lines="all"}
cat <<EOF | kubectl apply -f -
apiVersion: pkg.crossplane.io/v1
kind: Provider
metadata:
  name: upbound-provider-aws
spec:
  package: xpkg.upbound.io/upbound/provider-aws:v0.17.0
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
upbound-provider-aws   True        True      xpkg.upbound.io/upbound/provider-aws:v0.17.0   73s
```

A provider installs their own Kubernetes _Custom Resource Definitions_ (CRDs). These CRDs allow you to create AWS resources directly inside Kubernetes.

You can view the new CRDs with `kubectl get crds`. Every CRD maps to a unique AWS service Crossplane can provision and manage.
<!-- vale gitlab.SubstitutionWarning = NO -->
<!-- disable "click" error. The user needs to actually click the button -->
{{< expand "Click to see the AWS CRDs" >}}
<!-- vale gitlab.SubstitutionWarning = YES -->
```shell
kubectl get crds
NAME                                                                      CREATED AT
accelerators.globalaccelerator.aws.upbound.io                             2022-09-30T03:16:56Z
accesskeys.iam.aws.upbound.io                                             2022-09-30T03:16:56Z
accesspoints.efs.aws.upbound.io                                           2022-09-30T03:16:55Z
accountaliases.iam.aws.upbound.io                                         2022-09-30T03:16:56Z
accountpasswordpolicies.iam.aws.upbound.io                                2022-09-30T03:16:56Z
accounts.apigateway.aws.upbound.io                                        2022-09-30T03:16:52Z
accountsettingdefaults.ecs.aws.upbound.io                                 2022-09-30T03:16:55Z
activities.sfn.aws.upbound.io                                             2022-09-30T03:16:59Z
addons.eks.aws.upbound.io                                                 2022-09-30T03:16:55Z
alertmanagerdefinitions.amp.aws.upbound.io                                2022-09-30T03:16:52Z
aliases.gamelift.aws.upbound.io                                           2022-09-30T03:16:56Z
aliases.kms.aws.upbound.io                                                2022-09-30T03:16:57Z
aliases.lambda.aws.upbound.io                                             2022-09-30T03:16:57Z
apikeys.apigateway.aws.upbound.io                                         2022-09-30T03:16:52Z
apimappings.apigatewayv2.aws.upbound.io                                   2022-09-30T03:16:52Z
apis.apigatewayv2.aws.upbound.io                                          2022-09-30T03:16:52Z
applications.kinesisanalytics.aws.upbound.io                              2022-09-30T03:16:56Z
applications.kinesisanalyticsv2.aws.upbound.io                            2022-09-30T03:16:57Z
applicationsnapshots.kinesisanalyticsv2.aws.upbound.io                    2022-09-30T03:16:57Z
associations.licensemanager.aws.upbound.io                                2022-09-30T03:16:57Z
attachments.autoscaling.aws.upbound.io                                    2022-09-30T03:16:53Z
attachments.elb.aws.upbound.io                                            2022-09-30T03:16:55Z
authorizers.apigateway.aws.upbound.io                                     2022-09-30T03:16:52Z
authorizers.apigatewayv2.aws.upbound.io                                   2022-09-30T03:16:52Z
autoscalinggroups.autoscaling.aws.upbound.io                              2022-09-30T03:16:53Z
backuppolicies.efs.aws.upbound.io                                         2022-09-30T03:16:55Z
basepathmappings.apigateway.aws.upbound.io                                2022-09-30T03:16:52Z
botaliases.lexmodels.aws.upbound.io                                       2022-09-30T03:16:57Z
bots.lexmodels.aws.upbound.io                                             2022-09-30T03:16:57Z
brokers.mq.aws.upbound.io                                                 2022-09-30T03:16:57Z
bucketaccelerateconfigurations.s3.aws.upbound.io                          2022-09-30T03:16:58Z
bucketacls.s3.aws.upbound.io                                              2022-09-30T03:16:58Z
bucketanalyticsconfigurations.s3.aws.upbound.io                           2022-09-30T03:16:58Z
bucketcorsconfigurations.s3.aws.upbound.io                                2022-09-30T03:16:58Z
bucketintelligenttieringconfigurations.s3.aws.upbound.io                  2022-09-30T03:16:58Z
bucketinventories.s3.aws.upbound.io                                       2022-09-30T03:16:58Z
bucketlifecycleconfigurations.s3.aws.upbound.io                           2022-09-30T03:16:58Z
bucketloggings.s3.aws.upbound.io                                          2022-09-30T03:16:58Z
bucketmetrics.s3.aws.upbound.io                                           2022-09-30T03:16:58Z
bucketnotifications.s3.aws.upbound.io                                     2022-09-30T03:16:58Z
bucketobjectlockconfigurations.s3.aws.upbound.io                          2022-09-30T03:16:58Z
bucketobjects.s3.aws.upbound.io                                           2022-09-30T03:16:58Z
bucketownershipcontrols.s3.aws.upbound.io                                 2022-09-30T03:16:58Z
bucketpolicies.s3.aws.upbound.io                                          2022-09-30T03:16:58Z
bucketpublicaccessblocks.s3.aws.upbound.io                                2022-09-30T03:16:58Z
bucketreplicationconfigurations.s3.aws.upbound.io                         2022-09-30T03:16:58Z
bucketrequestpaymentconfigurations.s3.aws.upbound.io                      2022-09-30T03:16:58Z
buckets.s3.aws.upbound.io                                                 2022-09-30T03:16:58Z
bucketserversideencryptionconfigurations.s3.aws.upbound.io                2022-09-30T03:16:58Z
bucketversionings.s3.aws.upbound.io                                       2022-09-30T03:16:58Z
bucketwebsiteconfigurations.s3.aws.upbound.io                             2022-09-30T03:16:58Z
builds.gamelift.aws.upbound.io                                            2022-09-30T03:16:56Z
cachepolicies.cloudfront.aws.upbound.io                                   2022-09-30T03:16:53Z
capacityproviders.ecs.aws.upbound.io                                      2022-09-30T03:16:55Z
catalogdatabases.glue.aws.upbound.io                                      2022-09-30T03:16:56Z
catalogtables.glue.aws.upbound.io                                         2022-09-30T03:16:56Z
certificateauthorities.acmpca.aws.upbound.io                              2022-09-30T03:16:52Z
certificateauthoritycertificates.acmpca.aws.upbound.io                    2022-09-30T03:16:52Z
certificates.acm.aws.upbound.io                                           2022-09-30T03:16:52Z
certificates.acmpca.aws.upbound.io                                        2022-09-30T03:16:52Z
certificatevalidations.acm.aws.upbound.io                                 2022-09-30T03:16:52Z
ciphertexts.kms.aws.upbound.io                                            2022-09-30T03:16:57Z
classifiers.glue.aws.upbound.io                                           2022-09-30T03:16:56Z
clientcertificates.apigateway.aws.upbound.io                              2022-09-30T03:16:52Z
clusteractivitystreams.rds.aws.upbound.io                                 2022-09-30T03:16:57Z
clusterauths.eks.aws.upbound.io                                           2022-09-30T03:16:55Z
clustercapacityproviders.ecs.aws.upbound.io                               2022-09-30T03:16:55Z
clusterendpoints.neptune.aws.upbound.io                                   2022-09-30T03:16:57Z
clusterendpoints.rds.aws.upbound.io                                       2022-09-30T03:16:57Z
clusterinstances.docdb.aws.upbound.io                                     2022-09-30T03:16:53Z
clusterinstances.neptune.aws.upbound.io                                   2022-09-30T03:16:57Z
clusterinstances.rds.aws.upbound.io                                       2022-09-30T03:16:57Z
clusterparametergroups.neptune.aws.upbound.io                             2022-09-30T03:16:57Z
clusterparametergroups.rds.aws.upbound.io                                 2022-09-30T03:16:57Z
clusterroleassociations.rds.aws.upbound.io                                2022-09-30T03:16:57Z
clusters.dax.aws.upbound.io                                               2022-09-30T03:16:53Z
clusters.docdb.aws.upbound.io                                             2022-09-30T03:16:53Z
clusters.ecs.aws.upbound.io                                               2022-09-30T03:16:55Z
clusters.eks.aws.upbound.io                                               2022-09-30T03:16:55Z
clusters.elasticache.aws.upbound.io                                       2022-09-30T03:16:55Z
clusters.kafka.aws.upbound.io                                             2022-09-30T03:16:56Z
clusters.neptune.aws.upbound.io                                           2022-09-30T03:16:57Z
clusters.rds.aws.upbound.io                                               2022-09-30T03:16:57Z
clusters.redshift.aws.upbound.io                                          2022-09-30T03:16:58Z
clustersnapshots.neptune.aws.upbound.io                                   2022-09-30T03:16:57Z
codesigningconfigs.lambda.aws.upbound.io                                  2022-09-30T03:16:57Z
cognitoidentitypoolproviderprincipaltags.cognitoidentity.aws.upbound.io   2022-09-30T03:16:53Z
compositealarms.cloudwatch.aws.upbound.io                                 2022-09-30T03:16:53Z
compositeresourcedefinitions.apiextensions.crossplane.io                  2022-09-30T02:09:11Z
compositionrevisions.apiextensions.crossplane.io                          2022-09-30T02:09:11Z
compositions.apiextensions.crossplane.io                                  2022-09-30T02:09:11Z
configurationrevisions.pkg.crossplane.io                                  2022-09-30T02:09:11Z
configurations.kafka.aws.upbound.io                                       2022-09-30T03:16:56Z
configurations.mq.aws.upbound.io                                          2022-09-30T03:16:57Z
configurations.pkg.crossplane.io                                          2022-09-30T02:09:11Z
contributorinsights.dynamodb.aws.upbound.io                               2022-09-30T03:16:54Z
controllerconfigs.pkg.crossplane.io                                       2022-09-30T02:09:11Z
dashboards.cloudwatch.aws.upbound.io                                      2022-09-30T03:16:53Z
databases.athena.aws.upbound.io                                           2022-09-30T03:16:52Z
datacatalogencryptionsettings.glue.aws.upbound.io                         2022-09-30T03:16:56Z
datacatalogs.athena.aws.upbound.io                                        2022-09-30T03:16:52Z
datalakesettings.lakeformation.aws.upbound.io                             2022-09-30T03:16:57Z
defaultroutetables.ec2.aws.upbound.io                                     2022-09-30T03:16:54Z
delegationsets.route53.aws.upbound.io                                     2022-09-30T03:16:58Z
deliverystreams.firehose.aws.upbound.io                                   2022-09-30T03:16:55Z
deployments.apigateway.aws.upbound.io                                     2022-09-30T03:16:52Z
deployments.apigatewayv2.aws.upbound.io                                   2022-09-30T03:16:52Z
distributions.cloudfront.aws.upbound.io                                   2022-09-30T03:16:53Z
documentationparts.apigateway.aws.upbound.io                              2022-09-30T03:16:52Z
documentationversions.apigateway.aws.upbound.io                           2022-09-30T03:16:52Z
domainnames.apigateway.aws.upbound.io                                     2022-09-30T03:16:52Z
domainnames.apigatewayv2.aws.upbound.io                                   2022-09-30T03:16:52Z
domainpolicies.opensearch.aws.upbound.io                                  2022-09-30T03:16:57Z
domains.cloudsearch.aws.upbound.io                                        2022-09-30T03:16:53Z
domains.opensearch.aws.upbound.io                                         2022-09-30T03:16:57Z
domainsamloptions.opensearch.aws.upbound.io                               2022-09-30T03:16:57Z
domainserviceaccesspolicies.cloudsearch.aws.upbound.io                    2022-09-30T03:16:53Z
ebssnapshots.ec2.aws.upbound.io                                           2022-09-30T03:16:54Z
ebsvolumes.ec2.aws.upbound.io                                             2022-09-30T03:16:54Z
egressonlyinternetgateways.ec2.aws.upbound.io                             2022-09-30T03:16:54Z
eipassociations.ec2.aws.upbound.io                                        2022-09-30T03:16:54Z
eips.ec2.aws.upbound.io                                                   2022-09-30T03:16:54Z
elbs.elb.aws.upbound.io                                                   2022-09-30T03:16:55Z
endpointgroups.globalaccelerator.aws.upbound.io                           2022-09-30T03:16:56Z
endpoints.route53resolver.aws.upbound.io                                  2022-09-30T03:16:58Z
eventsourcemappings.lambda.aws.upbound.io                                 2022-09-30T03:16:57Z
eventsubscriptions.neptune.aws.upbound.io                                 2022-09-30T03:16:57Z
externalkeys.kms.aws.upbound.io                                           2022-09-30T03:16:57Z
fargateprofiles.eks.aws.upbound.io                                        2022-09-30T03:16:55Z
fieldlevelencryptionconfigs.cloudfront.aws.upbound.io                     2022-09-30T03:16:53Z
fieldlevelencryptionprofiles.cloudfront.aws.upbound.io                    2022-09-30T03:16:53Z
filesystempolicies.efs.aws.upbound.io                                     2022-09-30T03:16:55Z
filesystems.efs.aws.upbound.io                                            2022-09-30T03:16:55Z
fleet.gamelift.aws.upbound.io                                             2022-09-30T03:16:56Z
flowlogs.ec2.aws.upbound.io                                               2022-09-30T03:16:54Z
frameworks.backup.aws.upbound.io                                          2022-09-30T03:16:53Z
functioneventinvokeconfigs.lambda.aws.upbound.io                          2022-09-30T03:16:57Z
functions.cloudfront.aws.upbound.io                                       2022-09-30T03:16:53Z
functions.lambda.aws.upbound.io                                           2022-09-30T03:16:57Z
functionurls.lambda.aws.upbound.io                                        2022-09-30T03:16:57Z
gamesessionqueues.gamelift.aws.upbound.io                                 2022-09-30T03:16:56Z
gatewayresponses.apigateway.aws.upbound.io                                2022-09-30T03:16:52Z
globalclusters.docdb.aws.upbound.io                                       2022-09-30T03:16:53Z
globalclusters.rds.aws.upbound.io                                         2022-09-30T03:16:58Z
globalsettings.backup.aws.upbound.io                                      2022-09-30T03:16:53Z
globaltables.dynamodb.aws.upbound.io                                      2022-09-30T03:16:54Z
grants.kms.aws.upbound.io                                                 2022-09-30T03:16:57Z
groupmemberships.iam.aws.upbound.io                                       2022-09-30T03:16:56Z
grouppolicyattachments.iam.aws.upbound.io                                 2022-09-30T03:16:56Z
groups.cloudwatchlogs.aws.upbound.io                                      2022-09-30T03:16:53Z
groups.iam.aws.upbound.io                                                 2022-09-30T03:16:56Z
groups.resourcegroups.aws.upbound.io                                      2022-09-30T03:16:58Z
healthchecks.route53.aws.upbound.io                                       2022-09-30T03:16:58Z
hostedzonednssecs.route53.aws.upbound.io                                  2022-09-30T03:16:58Z
httpnamespaces.servicediscovery.aws.upbound.io                            2022-09-30T03:16:59Z
identityproviderconfigs.eks.aws.upbound.io                                2022-09-30T03:16:55Z
identityproviders.cognitoidp.aws.upbound.io                               2022-09-30T03:16:53Z
instanceprofiles.iam.aws.upbound.io                                       2022-09-30T03:16:56Z
instanceroleassociations.rds.aws.upbound.io                               2022-09-30T03:16:58Z
instances.ec2.aws.upbound.io                                              2022-09-30T03:16:54Z
instances.rds.aws.upbound.io                                              2022-09-30T03:16:58Z
integrationresponses.apigateway.aws.upbound.io                            2022-09-30T03:16:52Z
integrationresponses.apigatewayv2.aws.upbound.io                          2022-09-30T03:16:52Z
integrations.apigateway.aws.upbound.io                                    2022-09-30T03:16:52Z
integrations.apigatewayv2.aws.upbound.io                                  2022-09-30T03:16:52Z
intents.lexmodels.aws.upbound.io                                          2022-09-30T03:16:57Z
internetgateways.ec2.aws.upbound.io                                       2022-09-30T03:16:54Z
invocations.lambda.aws.upbound.io                                         2022-09-30T03:16:57Z
jobs.glue.aws.upbound.io                                                  2022-09-30T03:16:56Z
keygroups.cloudfront.aws.upbound.io                                       2022-09-30T03:16:53Z
keypairs.ec2.aws.upbound.io                                               2022-09-30T03:16:54Z
keys.kms.aws.upbound.io                                                   2022-09-30T03:16:57Z
kinesisstreamingdestinations.dynamodb.aws.upbound.io                      2022-09-30T03:16:53Z
launchtemplates.ec2.aws.upbound.io                                        2022-09-30T03:16:54Z
layerversionpermissions.lambda.aws.upbound.io                             2022-09-30T03:16:57Z
layerversions.lambda.aws.upbound.io                                       2022-09-30T03:16:57Z
lblisteners.elbv2.aws.upbound.io                                          2022-09-30T03:16:55Z
lbs.elbv2.aws.upbound.io                                                  2022-09-30T03:16:55Z
lbtargetgroupattachments.elbv2.aws.upbound.io                             2022-09-30T03:16:55Z
lbtargetgroups.elbv2.aws.upbound.io                                       2022-09-30T03:16:55Z
licenseconfigurations.licensemanager.aws.upbound.io                       2022-09-30T03:16:57Z
lifecyclepolicies.ecr.aws.upbound.io                                      2022-09-30T03:16:55Z
listeners.globalaccelerator.aws.upbound.io                                2022-09-30T03:16:56Z
locks.pkg.crossplane.io                                                   2022-09-30T02:09:11Z
mainroutetableassociations.ec2.aws.upbound.io                             2022-09-30T03:16:54Z
managedprefixlistentries.ec2.aws.upbound.io                               2022-09-30T03:16:54Z
managedprefixlists.ec2.aws.upbound.io                                     2022-09-30T03:16:54Z
methodresponses.apigateway.aws.upbound.io                                 2022-09-30T03:16:52Z
methods.apigateway.aws.upbound.io                                         2022-09-30T03:16:52Z
methodsettings.apigateway.aws.upbound.io                                  2022-09-30T03:16:52Z
metricalarms.cloudwatch.aws.upbound.io                                    2022-09-30T03:16:53Z
metricstreams.cloudwatch.aws.upbound.io                                   2022-09-30T03:16:53Z
models.apigateway.aws.upbound.io                                          2022-09-30T03:16:52Z
models.apigatewayv2.aws.upbound.io                                        2022-09-30T03:16:52Z
monitoringsubscriptions.cloudfront.aws.upbound.io                         2022-09-30T03:16:53Z
mounttargets.efs.aws.upbound.io                                           2022-09-30T03:16:55Z
namedqueries.athena.aws.upbound.io                                        2022-09-30T03:16:52Z
natgateways.ec2.aws.upbound.io                                            2022-09-30T03:16:54Z
networkaclrules.ec2.aws.upbound.io                                        2022-09-30T03:16:54Z
networkacls.ec2.aws.upbound.io                                            2022-09-30T03:16:54Z
networkinterfaceattachments.ec2.aws.upbound.io                            2022-09-30T03:16:54Z
networkinterfaces.ec2.aws.upbound.io                                      2022-09-30T03:16:54Z
networkinterfacesgattachments.ec2.aws.upbound.io                          2022-09-30T03:16:54Z
nodegroups.eks.aws.upbound.io                                             2022-09-30T03:16:55Z
objects.s3.aws.upbound.io                                                 2022-09-30T03:16:58Z
openidconnectproviders.iam.aws.upbound.io                                 2022-09-30T03:16:56Z
optiongroups.rds.aws.upbound.io                                           2022-09-30T03:16:58Z
originaccessidentities.cloudfront.aws.upbound.io                          2022-09-30T03:16:53Z
originrequestpolicies.cloudfront.aws.upbound.io                           2022-09-30T03:16:53Z
parametergroups.dax.aws.upbound.io                                        2022-09-30T03:16:54Z
parametergroups.elasticache.aws.upbound.io                                2022-09-30T03:16:55Z
parametergroups.neptune.aws.upbound.io                                    2022-09-30T03:16:57Z
parametergroups.rds.aws.upbound.io                                        2022-09-30T03:16:58Z
permissions.lakeformation.aws.upbound.io                                  2022-09-30T03:16:57Z
permissions.lambda.aws.upbound.io                                         2022-09-30T03:16:57Z
placementgroups.ec2.aws.upbound.io                                        2022-09-30T03:16:54Z
plans.backup.aws.upbound.io                                               2022-09-30T03:16:53Z
policies.appautoscaling.aws.upbound.io                                    2022-09-30T03:16:52Z
policies.iam.aws.upbound.io                                               2022-09-30T03:16:56Z
policies.iot.aws.upbound.io                                               2022-09-30T03:16:56Z
poolrolesattachments.cognitoidentity.aws.upbound.io                       2022-09-30T03:16:53Z
pools.cognitoidentity.aws.upbound.io                                      2022-09-30T03:16:53Z
privatednsnamespaces.servicediscovery.aws.upbound.io                      2022-09-30T03:16:59Z
providerconfigs.aws.upbound.io                                            2022-09-30T03:16:53Z
providerconfigusages.aws.upbound.io                                       2022-09-30T03:16:53Z
providerrevisions.pkg.crossplane.io                                       2022-09-30T02:09:11Z
providers.pkg.crossplane.io                                               2022-09-30T02:09:11Z
provisionedconcurrencyconfigs.lambda.aws.upbound.io                       2022-09-30T03:16:57Z
proxies.rds.aws.upbound.io                                                2022-09-30T03:16:58Z
proxydefaulttargetgroups.rds.aws.upbound.io                               2022-09-30T03:16:58Z
proxyendpoints.rds.aws.upbound.io                                         2022-09-30T03:16:58Z
proxytargets.rds.aws.upbound.io                                           2022-09-30T03:16:58Z
publicdnsnamespaces.servicediscovery.aws.upbound.io                       2022-09-30T03:16:59Z
publickeys.cloudfront.aws.upbound.io                                      2022-09-30T03:16:53Z
pullthroughcacherules.ecr.aws.upbound.io                                  2022-09-30T03:16:55Z
queuepolicies.sqs.aws.upbound.io                                          2022-09-30T03:16:59Z
queues.sqs.aws.upbound.io                                                 2022-09-30T03:16:59Z
realtimelogconfigs.cloudfront.aws.upbound.io                              2022-09-30T03:16:53Z
records.route53.aws.upbound.io                                            2022-09-30T03:16:58Z
regionsettings.backup.aws.upbound.io                                      2022-09-30T03:16:53Z
registries.glue.aws.upbound.io                                            2022-09-30T03:16:56Z
registrypolicies.ecr.aws.upbound.io                                       2022-09-30T03:16:55Z
registryscanningconfigurations.ecr.aws.upbound.io                         2022-09-30T03:16:55Z
replicaexternalkeys.kms.aws.upbound.io                                    2022-09-30T03:16:57Z
replicakeys.kms.aws.upbound.io                                            2022-09-30T03:16:57Z
replicationconfigurations.ecr.aws.upbound.io                              2022-09-30T03:16:55Z
replicationgroups.elasticache.aws.upbound.io                              2022-09-30T03:16:55Z
reportplans.backup.aws.upbound.io                                         2022-09-30T03:16:53Z
repositories.ecr.aws.upbound.io                                           2022-09-30T03:16:55Z
repositories.ecrpublic.aws.upbound.io                                     2022-09-30T03:16:55Z
repositorypolicies.ecr.aws.upbound.io                                     2022-09-30T03:16:55Z
repositorypolicies.ecrpublic.aws.upbound.io                               2022-09-30T03:16:55Z
requestvalidators.apigateway.aws.upbound.io                               2022-09-30T03:16:52Z
resourcepolicies.glue.aws.upbound.io                                      2022-09-30T03:16:56Z
resources.apigateway.aws.upbound.io                                       2022-09-30T03:16:52Z
resources.lakeformation.aws.upbound.io                                    2022-09-30T03:16:57Z
resourceservers.cognitoidp.aws.upbound.io                                 2022-09-30T03:16:53Z
resourceshares.ram.aws.upbound.io                                         2022-09-30T03:16:57Z
responseheaderspolicies.cloudfront.aws.upbound.io                         2022-09-30T03:16:53Z
restapipolicies.apigateway.aws.upbound.io                                 2022-09-30T03:16:52Z
restapis.apigateway.aws.upbound.io                                        2022-09-30T03:16:52Z
roleassociations.grafana.aws.upbound.io                                   2022-09-30T03:16:56Z
rolepolicyattachments.iam.aws.upbound.io                                  2022-09-30T03:16:56Z
roles.iam.aws.upbound.io                                                  2022-09-30T03:16:56Z
routeresponses.apigatewayv2.aws.upbound.io                                2022-09-30T03:16:52Z
routes.apigatewayv2.aws.upbound.io                                        2022-09-30T03:16:52Z
routes.ec2.aws.upbound.io                                                 2022-09-30T03:16:54Z
routetableassociations.ec2.aws.upbound.io                                 2022-09-30T03:16:54Z
routetables.ec2.aws.upbound.io                                            2022-09-30T03:16:54Z
ruleassociations.route53resolver.aws.upbound.io                           2022-09-30T03:16:58Z
rulegroupnamespaces.amp.aws.upbound.io                                    2022-09-30T03:16:52Z
rules.route53resolver.aws.upbound.io                                      2022-09-30T03:16:58Z
samlproviders.iam.aws.upbound.io                                          2022-09-30T03:16:56Z
scheduledactions.appautoscaling.aws.upbound.io                            2022-09-30T03:16:52Z
scripts.gamelift.aws.upbound.io                                           2022-09-30T03:16:56Z
secretpolicies.secretsmanager.aws.upbound.io                              2022-09-30T03:16:58Z
secretrotations.secretsmanager.aws.upbound.io                             2022-09-30T03:16:58Z
secrets.secretsmanager.aws.upbound.io                                     2022-09-30T03:16:58Z
secretversions.secretsmanager.aws.upbound.io                              2022-09-30T03:16:59Z
securitygrouprules.ec2.aws.upbound.io                                     2022-09-30T03:16:54Z
securitygroups.ec2.aws.upbound.io                                         2022-09-30T03:16:54Z
securitygroups.rds.aws.upbound.io                                         2022-09-30T03:16:58Z
selections.backup.aws.upbound.io                                          2022-09-30T03:16:53Z
servercertificates.iam.aws.upbound.io                                     2022-09-30T03:16:56Z
servers.transfer.aws.upbound.io                                           2022-09-30T03:16:59Z
servicelinkedroles.iam.aws.upbound.io                                     2022-09-30T03:16:56Z
services.ecs.aws.upbound.io                                               2022-09-30T03:16:55Z
servicespecificcredentials.iam.aws.upbound.io                             2022-09-30T03:16:56Z
signingcertificates.iam.aws.upbound.io                                    2022-09-30T03:16:56Z
signingprofiles.signer.aws.upbound.io                                     2022-09-30T03:16:59Z
slottypes.lexmodels.aws.upbound.io                                        2022-09-30T03:16:57Z
snapshots.rds.aws.upbound.io                                              2022-09-30T03:16:58Z
spotdatafeedsubscriptions.ec2.aws.upbound.io                              2022-09-30T03:16:54Z
spotinstancerequests.ec2.aws.upbound.io                                   2022-09-30T03:16:54Z
stages.apigateway.aws.upbound.io                                          2022-09-30T03:16:52Z
stages.apigatewayv2.aws.upbound.io                                        2022-09-30T03:16:52Z
statemachines.sfn.aws.upbound.io                                          2022-09-30T03:16:59Z
storeconfigs.aws.upbound.io                                               2022-09-30T03:16:53Z
storeconfigs.secrets.crossplane.io                                        2022-09-30T02:09:11Z
streamconsumers.kinesis.aws.upbound.io                                    2022-09-30T03:16:56Z
streams.kinesis.aws.upbound.io                                            2022-09-30T03:16:56Z
streams.kinesisvideo.aws.upbound.io                                       2022-09-30T03:16:57Z
subnetgroups.dax.aws.upbound.io                                           2022-09-30T03:16:54Z
subnetgroups.docdb.aws.upbound.io                                         2022-09-30T03:16:54Z
subnetgroups.elasticache.aws.upbound.io                                   2022-09-30T03:16:55Z
subnetgroups.neptune.aws.upbound.io                                       2022-09-30T03:16:57Z
subnetgroups.rds.aws.upbound.io                                           2022-09-30T03:16:58Z
subnets.ec2.aws.upbound.io                                                2022-09-30T03:16:54Z
tableitems.dynamodb.aws.upbound.io                                        2022-09-30T03:16:54Z
tables.dynamodb.aws.upbound.io                                            2022-09-30T03:16:54Z
targets.appautoscaling.aws.upbound.io                                     2022-09-30T03:16:52Z
taskdefinitions.ecs.aws.upbound.io                                        2022-09-30T03:16:55Z
things.iot.aws.upbound.io                                                 2022-09-30T03:16:56Z
topics.sns.aws.upbound.io                                                 2022-09-30T03:16:59Z
topicsubscriptions.sns.aws.upbound.io                                     2022-09-30T03:16:59Z
trafficpolicies.route53.aws.upbound.io                                    2022-09-30T03:16:58Z
trafficpolicyinstances.route53.aws.upbound.io                             2022-09-30T03:16:58Z
transitgatewaymulticastdomainassociations.ec2.aws.upbound.io              2022-09-30T03:16:54Z
transitgatewaymulticastdomains.ec2.aws.upbound.io                         2022-09-30T03:16:54Z
transitgatewaymulticastgroupmembers.ec2.aws.upbound.io                    2022-09-30T03:16:54Z
transitgatewaymulticastgroupsources.ec2.aws.upbound.io                    2022-09-30T03:16:54Z
transitgatewaypeeringattachments.ec2.aws.upbound.io                       2022-09-30T03:16:54Z
transitgatewayprefixlistreferences.ec2.aws.upbound.io                     2022-09-30T03:16:54Z
transitgatewayroutes.ec2.aws.upbound.io                                   2022-09-30T03:16:54Z
transitgatewayroutetableassociations.ec2.aws.upbound.io                   2022-09-30T03:16:54Z
transitgatewayroutetablepropagations.ec2.aws.upbound.io                   2022-09-30T03:16:54Z
transitgatewayroutetables.ec2.aws.upbound.io                              2022-09-30T03:16:54Z
transitgateways.ec2.aws.upbound.io                                        2022-09-30T03:16:54Z
transitgatewayvpcattachmentaccepters.ec2.aws.upbound.io                   2022-09-30T03:16:54Z
transitgatewayvpcattachments.ec2.aws.upbound.io                           2022-09-30T03:16:54Z
triggers.glue.aws.upbound.io                                              2022-09-30T03:16:56Z
usageplankeys.apigateway.aws.upbound.io                                   2022-09-30T03:16:52Z
usageplans.apigateway.aws.upbound.io                                      2022-09-30T03:16:52Z
userdefinedfunctions.glue.aws.upbound.io                                  2022-09-30T03:16:56Z
usergroupmemberships.iam.aws.upbound.io                                   2022-09-30T03:16:56Z
usergroups.elasticache.aws.upbound.io                                     2022-09-30T03:16:55Z
userloginprofiles.iam.aws.upbound.io                                      2022-09-30T03:16:56Z
userpolicyattachments.iam.aws.upbound.io                                  2022-09-30T03:16:56Z
userpoolclients.cognitoidp.aws.upbound.io                                 2022-09-30T03:16:53Z
userpooldomains.cognitoidp.aws.upbound.io                                 2022-09-30T03:16:53Z
userpools.cognitoidp.aws.upbound.io                                       2022-09-30T03:16:53Z
userpooluicustomizations.cognitoidp.aws.upbound.io                        2022-09-30T03:16:53Z
users.cognitoidp.aws.upbound.io                                           2022-09-30T03:16:53Z
users.elasticache.aws.upbound.io                                          2022-09-30T03:16:55Z
users.iam.aws.upbound.io                                                  2022-09-30T03:16:56Z
users.transfer.aws.upbound.io                                             2022-09-30T03:16:59Z
usersshkeys.iam.aws.upbound.io                                            2022-09-30T03:16:56Z
vaultlockconfigurations.backup.aws.upbound.io                             2022-09-30T03:16:53Z
vaultnotifications.backup.aws.upbound.io                                  2022-09-30T03:16:53Z
vaultpolicies.backup.aws.upbound.io                                       2022-09-30T03:16:53Z
vaults.backup.aws.upbound.io                                              2022-09-30T03:16:53Z
virtualmfadevices.iam.aws.upbound.io                                      2022-09-30T03:16:56Z
volumeattachments.ec2.aws.upbound.io                                      2022-09-30T03:16:54Z
vpcassociationauthorizations.route53.aws.upbound.io                       2022-09-30T03:16:58Z
vpcdhcpoptions.ec2.aws.upbound.io                                         2022-09-30T03:16:55Z
vpcdhcpoptionsassociations.ec2.aws.upbound.io                             2022-09-30T03:16:55Z
vpcendpointconnectionnotifications.ec2.aws.upbound.io                     2022-09-30T03:16:55Z
vpcendpointroutetableassociations.ec2.aws.upbound.io                      2022-09-30T03:16:55Z
vpcendpoints.ec2.aws.upbound.io                                           2022-09-30T03:16:55Z
vpcendpointserviceallowedprincipals.ec2.aws.upbound.io                    2022-09-30T03:16:55Z
vpcendpointservices.ec2.aws.upbound.io                                    2022-09-30T03:16:55Z
vpcendpointsubnetassociations.ec2.aws.upbound.io                          2022-09-30T03:16:55Z
vpcipv4cidrblockassociations.ec2.aws.upbound.io                           2022-09-30T03:16:55Z
vpclinks.apigateway.aws.upbound.io                                        2022-09-30T03:16:52Z
vpclinks.apigatewayv2.aws.upbound.io                                      2022-09-30T03:16:52Z
vpcpeeringconnections.ec2.aws.upbound.io                                  2022-09-30T03:16:55Z
vpcs.ec2.aws.upbound.io                                                   2022-09-30T03:16:55Z
workflows.glue.aws.upbound.io                                             2022-09-30T03:16:56Z
workgroups.athena.aws.upbound.io                                          2022-09-30T03:16:53Z
workspaces.amp.aws.upbound.io                                             2022-09-30T03:16:52Z
workspaces.grafana.aws.upbound.io                                         2022-09-30T03:16:56Z
workspacesamlconfigurations.grafana.aws.upbound.io                        2022-09-30T03:16:56Z
zones.route53.aws.upbound.io                                              2022-09-30T03:16:58Z
```
{{< /expand >}}

### Create a Kubernetes secret for AWS
The provider requires credentials to create and manage AWS resources. Providers use a Kubernetes _Secret_ to connect the credentials to the provider.

First generate a Kubernetes _Secret_ from your AWS key-pair and then configure the Provider to use it.

#### Generate an AWS key-pair file
For basic user authentication, use an AWS Access keys key-pair file. 

{{< hint type="tip" >}}
The [AWS documentation](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html#cli-configure-quickstart-creds) provides information on how to generate AWS Access keys.
{{< /hint >}}

Create a text file containing the AWS account `aws_access_key_id` and `aws_secret_access_key`.  

```ini {copy-lines="all"}
[default]
aws_access_key_id = <aws_access_key>
aws_secret_access_key = <aws_secret_key>
```

Save this text file as `aws-credentials.txt`.

{{< hint type="note" >}}
The [Configuration](https://marketplace.upbound.io/providers/upbound/provider-aws/latest/docs/configuration) section of the Provider documentation describes other authentication methods.
{{< /hint >}}

#### Create a Kubernetes secret with the AWS credentials
A Kubernetes generic secret has a name and contents. Use {{< hover label="kube-create-secret" line="1">}}kubectl create secret{{< /hover >}} to generate the secret object named {{< hover label="kube-create-secret" line="2">}}aws-secret{{< /hover >}} in the {{< hover label="kube-create-secret" line="3">}}upbound-system{{</ hover >}} namespace.  
Use the {{< hover label="kube-create-secret" line="4">}}--from-file={{</hover>}} argument to set the value to the contents of the  {{< hover label="kube-create-secret" line="4">}}aws-credentials.txt{{< /hover >}} file.

```shell {label="kube-create-secret",copy-lines="all"}
kubectl create secret \
generic aws-secret \
-n upbound-system \
--from-file=creds=./aws-credentials.txt
```

View the secret with `kubectl describe secret`

{{< hint type="note" >}}
The size may be larger if there are extra blank spaces in your text file.
{{< /hint >}}

```shell
kubectl describe secret aws-secret -n upbound-system
Name:         aws-secret
Namespace:    upbound-system
Labels:       <none>
Annotations:  <none>

Type:  Opaque

Data
====
creds:  114 bytes
```

### Create a ProviderConfig
A `ProviderConfig` customizes the settings of the AWS Provider.  

Apply the {{< hover label="providerconfig" line="2">}}ProviderConfig{{</ hover >}} with the command:
```yaml {label="providerconfig",copy-lines="all"}
cat <<EOF | kubectl apply -f -
apiVersion: aws.upbound.io/v1beta1
kind: ProviderConfig
metadata:
  name: default
spec:
  credentials:
    source: Secret
    secretRef:
      namespace: upbound-system
      name: aws-secret
      key: creds
EOF
```

This attaches the AWS credentials, saved as a Kubernetes secret, as a {{< hover label="providerconfig" line="9">}}secretRef{{</ hover>}}.

The {{< hover label="providerconfig" line="11">}}spec.credentials.secretRef.name{{< /hover >}} value is the name of the Kubernetes secret containing the AWS credentials in the {{< hover label="providerconfig" line="10">}}spec.credentials.secretRef.namespace{{< /hover >}}.


### Create a managed resource
A _managed resource_ is anything Crossplane creates and manages outside of the Kubernetes cluster. This creates an AWS S3 bucket with Crossplane. The S3 bucket is a _managed resource_.

{{< hint type="note" >}}
AWS S3 bucket names must be globally unique. To generate a unique name the example uses a random hash. 
Any unique name is acceptable.
{{< /hint >}}

```yaml {label="xr"}
bucket=$(echo "upbound-bucket-"$(head -n 4096 /dev/urandom | openssl sha1 | tail -c 10))
cat <<EOF | kubectl apply -f -
apiVersion: s3.aws.upbound.io/v1beta1
kind: Bucket
metadata:
  name: $bucket
spec:
  forProvider:
    region: us-east-1
  providerConfigRef:
    name: default
EOF
```

Notice the {{< hover label="xr" line="3">}}apiVersion{{< /hover >}} and {{< hover label="xr" line="4">}}kind{{</hover >}} are from the `Provider's` CRDs.


The {{< hover label="xr" line="6">}}metadata.name{{< /hover >}} value is the name of the created S3 bucket in AWS.  
This example uses the generated name `upbound-bucket-<hash>` in the {{< hover label="xr" line="6">}}`$bucket`{{</hover >}} variable.

The {{< hover label="xr" line="9">}}spec.forProvider.region{{< /hover >}} tells AWS which AWS region to use when deploying resources. The region can be any [AWS Regional endpoint](https://docs.aws.amazon.com/general/latest/gr/rande.html#regional-endpoints) code.

Use `kubectl get buckets` to verify Crossplane created the bucket.

{{< hint type="tip" >}}
Upbound created the bucket when the values `READY` and `SYNCED` are `True`.  
This may take up to 5 minutes.  
{{< /hint >}}

```shell
kubectl get buckets
NAME                       READY   SYNCED   EXTERNAL-NAME              AGE
upbound-bucket-45eed4ae0   True    True     upbound-bucket-45eed4ae0   61s
```

Optionally, log into the [AWS Console](https://s3.console.aws.amazon.com/s3/buckets) and see the bucket inside AWS.

{{< img src="images/s3-bucket-create.png" alt="AWS console shows an S3 bucket with the name upbound-bucket-45eed4ae0 that matches the bucket created by Crossplane." size="xtiny" >}}

<br />

<!-- vale gitlab.SubstitutionWarning = NO -->
<!-- disable "click" error. The user needs to actually click the button -->
{{< expand "Is the bucket not SYNCED? Click here for troubleshooting tips" >}}
<!-- vale gitlab.SubstitutionWarning = YES -->
If the `READY` or `SYNCED` are blank or `False` use `kubectl describe bucket` to understand why.

A common issue is incorrect AWS credentials or not having permissions to create the S3 bucket.

The following output is an example of the `kubectl describe bucket` output when using the wrong AWS credentials.

```shell {label="bad-auth"}
kubectl describe bucket
Name:         upbound-bucket-ff2ce7e86
Annotations:  crossplane.io/external-name: upbound-bucket-ff2ce7e86
API Version:  s3.aws.upbound.io/v1beta1
Kind:         Bucket
# Output trimmed for brevity
Spec:
  Deletion Policy:  Delete
  For Provider:
    Region:  us-east-1
    Tags:
      Crossplane - Kind:            bucket.s3.aws.upbound.io
      Crossplane - Name:            upbound-bucket-ff2ce7e86
      Crossplane - Providerconfig:  default
  Provider Config Ref:
    Name:  default
Status:
  At Provider:
  Conditions:
    Last Transition Time:  2022-09-30T15:47:18Z
    Message:               connect failed: cannot get terraform setup: cannot get the caller identity: GetCallerIdentity query failed: GetCallerIdentity query failed: operation error STS: GetCallerIdentity, https response error StatusCode: 403, RequestID: bc190d08-20fc-40c2-82ba-875ecb98bef6, api error InvalidClientTokenId: The security token included in the request is invalid.
    Reason:                ReconcileError
    Status:                False
    Type:                  Synced
Events:
  Type     Reason                           Age               From                                            Message
  ----     ------                           ----              ----                                            -------
  Warning  CannotConnectToProvider          0s (x12 over 2s)  managed/s3.aws.upbound.io/v1beta1, kind=bucket  (combined from similar events): cannot get terraform setup: cannot get the caller identity: GetCallerIdentity query failed: GetCallerIdentity query failed: operation error STS: GetCallerIdentity, https response error StatusCode: 403, RequestID: bc190d08-20fc-40c2-82ba-875ecb98bef6, api error InvalidClientTokenId: The security token included in the request is invalid.
  ```
<!-- vale alex.Ablist = NO --> 
<!-- allow "invalid" since it quotes the error -->
The error message in the _Events_ log indicates the problem.  
{{< hover label="bad-auth" line="28">}}api error InvalidClientTokenId: The security token included in the request is invalid.{{< /hover >}}
<!-- vale alex.Ablist = YES --> 

To fix the problem:

* Update your AWS credentials in the `aws-credentials.txt` text file.
* Delete the original Kubernetes _secret_ with  
* `kubectl delete secret aws-secret -n upbound-system`
* Create a new _secret_ with   
`kubectl create secret generic aws-secret -n upbound-system --from-file=creds=aws.txt`
* Delete the `ProviderConfig` with  
`kubectl delete providerconfig.aws.upbound.io/default`
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
bucket.s3.aws.upbound.io "upbound-bucket-45eed4ae0" deleted
```

Look in the [AWS Console](https://s3.console.aws.amazon.com/s3/buckets) to confirm Crossplane deleted the bucket from AWS.

{{< img alt="AWS console showing no buckets exist, indicating Crossplane deleted the S3 bucket managed resource." src="images/s3-bucket-delete.png" >}}



### Next steps 
* Explore AWS resources that can Crossplane can configure in the [Provider CRD reference](https://marketplace.upbound.io/providers/upbound/provider-aws/v0.15.0/crds).
* Learn about [Crossplane configuration packages]({{<ref "uxp/crossplane-concepts/packages">}}) to make your cloud platform fully portable.
* Join the [Crossplane Slack](https://slack.crossplane.io/) and the `#Upbound` room to connect with Crossplane users and contributors.