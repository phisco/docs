---
title: Deployment Workflow
sidebar_position: 3
description: A quickstart guide for Upbound Spaces
tier: "business"
---
import GlobalLanguageSelector, { CodeBlock } from '@site/src/components/GlobalLanguageSelector';
import ThemeCodeBlock from '@theme/CodeBlock';
import { versions } from '@site/src/components/Version.js';

<GlobalLanguageSelector />

<CodeBlock cloud="aws">

This guide deploys a self-hosted Upbound cluster in AWS.

</CodeBlock>

<CodeBlock cloud="azure">

This guide deploys a self-hosted Upbound cluster in Azure.

</CodeBlock>

<CodeBlock cloud="gcp">

This guide deploys a self-hosted Upbound cluster in GCP.

</CodeBlock>

Disconnected Spaces allows you to host control planes in your preferred environment.

## Prerequisites

To get started deploying your own Disconnected Space, you need:

- An Upbound organization account string, provided by your Upbound account representative
- A `token.json` license, provided by your Upbound account representative

<CodeBlock cloud="aws">

- An AWS account and the AWS CLI

</CodeBlock>

<CodeBlock cloud="azure">

- An Azure account and the Azure CLI

</CodeBlock>

<CodeBlock cloud="gcp">

- An GCP account and the GCP CLI

</CodeBlock>

<!-- vale Microsoft.Wordiness = NO -->
:::important
Disconnected Spaces are a business critical feature of Upbound and requires a license token to successfully complete the installation. [Contact Upbound][contact-upbound] if you want to try out Upbound with Disconnected Spaces.
:::
<!-- vale Microsoft.Wordiness = YES -->

## Provision the hosting environment

### Create a cluster

<CodeBlock cloud="aws">

Configure the name and target region you want the EKS cluster deployed to.

```ini
export SPACES_CLUSTER_NAME=upbound-space-quickstart
export SPACES_REGION=us-east-1
```

Provision a 3-node cluster using eksctl.

```bash
cat <<EOF | eksctl create cluster -f -
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: ${SPACES_CLUSTER_NAME}
  region: ${SPACES_REGION}
  version: "1.34"
managedNodeGroups:
  - name: ng-1
    instanceType: m5.xlarge
    desiredCapacity: 3
    volumeSize: 100
    iam:
      withAddonPolicies:
        ebs: true
iam:
  withOIDC: true
  serviceAccounts:
    - metadata:
        name: aws-load-balancer-controller
        namespace: kube-system
      wellKnownPolicies:
        awsLoadBalancerController: true
    - metadata:
        name: efs-csi-controller-sa
        namespace: kube-system
      wellKnownPolicies:
        efsCSIController: true
addons:
  - name: vpc-cni
    attachPolicyARNs:
      - arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy
  - name: aws-ebs-csi-driver
    wellKnownPolicies:
      ebsCSIController: true
    configurationValues: |-
      defaultStorageClass:
        enabled: true
EOF
```

</CodeBlock>

<CodeBlock cloud="azure">

Configure the name and target region you want the AKS cluster deployed to.

```ini
export SPACES_RESOURCE_GROUP_NAME=upbound-space-quickstart
export SPACES_CLUSTER_NAME=upbound-space-quickstart
export SPACES_LOCATION=westus
```

Provision a new Azure resource group.

```bash
az group create --name ${SPACES_RESOURCE_GROUP_NAME} --location ${SPACES_LOCATION}
```

Provision a 3-node cluster.

```bash
az aks create -g ${SPACES_RESOURCE_GROUP_NAME} -n ${SPACES_CLUSTER_NAME} \
  --enable-managed-identity \
  --node-count 3 \
  --node-vm-size Standard_D4s_v4 \
  --enable-addons monitoring \
  --enable-msi-auth-for-monitoring \
  --generate-ssh-keys \
  --network-plugin kubenet \
  --network-policy calico
```

Get the kubeconfig of your AKS cluster.

```bash
az aks get-credentials --resource-group ${SPACES_RESOURCE_GROUP_NAME} --name ${SPACES_CLUSTER_NAME}
```

</CodeBlock>

<CodeBlock cloud="gcp">

Configure the name and target region you want the GKE cluster deployed to.

```ini
export SPACES_PROJECT_NAME=upbound-spaces-project
export SPACES_CLUSTER_NAME=upbound-spaces-quickstart
export SPACES_LOCATION=us-west1-a
```

Create a new project and set it as the current project.

```bash
gcloud projects create ${SPACES_PROJECT_NAME}
gcloud config set project ${SPACES_PROJECT_NAME}
```

Provision a 3-node cluster.

```bash
gcloud container clusters create ${SPACES_CLUSTER_NAME} \
  --enable-network-policy \
  --num-nodes=3 \
  --zone=${SPACES_LOCATION} \
  --machine-type=e2-standard-4
```

Get the kubeconfig of your GKE cluster.

```bash
gcloud container clusters get-credentials ${SPACES_CLUSTER_NAME} --zone=${SPACES_LOCATION}
```

</CodeBlock>

## Configure the pre-install

### Set your Upbound organization account details

Set your Upbound organization account string as an environment variable for use in future steps

```ini
export UPBOUND_ACCOUNT=<your-upbound-org>
```

### Set up pre-install configurations

Export the path of the license token JSON file provided by your Upbound account representative.

```ini {copy-lines="2"}
# Change the path to where you saved the token.
export SPACES_TOKEN_PATH="/path/to/token.json"
```

Set the version of Spaces software you want to install.


<ThemeCodeBlock language="ini">
{`export SPACES_VERSION="${versions.spaces}"`}
</ThemeCodeBlock>

Set the router host and cluster type. The `SPACES_ROUTER_HOST` is the domain name that's used to access the control plane instances. It's used by the load balancer or ingress to route requests.

```ini
export SPACES_ROUTER_HOST="proxy.upbound-127.0.0.1.nip.io"
```

:::important
Make sure to replace the placeholder text in `SPACES_ROUTER_HOST` and provide a real domain that you own.
:::

<!-- vale off -->
## Install the Spaces software
<!-- vale on -->

### Install cert-manager

Install cert-manager. Replace `<version>` with the [latest release](https://github.com/cert-manager/cert-manager/releases).

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/<version>/cert-manager.yaml
kubectl wait deployment -n cert-manager cert-manager-webhook --for condition=Available=True --timeout=360s
```

<CodeBlock cloud="aws">

### Install AWS Load Balancer Controller

The AWS Load Balancer Controller provisions a Network Load Balancer when you expose the spaces-router Service with the annotations in the next step.

```bash
helm install aws-load-balancer-controller aws-load-balancer-controller --namespace kube-system \
  --repo https://aws.github.io/eks-charts \
  --set clusterName=${SPACES_CLUSTER_NAME} \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --wait
```

</CodeBlock>

### Expose Spaces with LoadBalancer (recommended)

This guide exposes Spaces using a LoadBalancer Service on the spaces-router. You don't need an ingress or gateway.

:::important
Use a Network Load Balancer (L4), not an Application Load Balancer (L7). Spaces uses long-lived connections for watch traffic that L7 load balancers may timeout.
:::

Create a values file using `SPACES_ROUTER_HOST` (or use the same `--set` flags in the Helm install below). Run the command for your cloud:

<CodeBlock cloud="aws">

```bash
cat <<EOF > values.yaml
externalTLS:
  host: ${SPACES_ROUTER_HOST}

router:
  proxy:
    service:
      type: LoadBalancer
      annotations:
        service.beta.kubernetes.io/aws-load-balancer-type: external
        service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing
        service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
EOF
```

</CodeBlock>

<CodeBlock cloud="azure">

```bash
cat <<EOF > values.yaml
externalTLS:
  host: ${SPACES_ROUTER_HOST}

router:
  proxy:
    service:
      type: LoadBalancer
      # Azure uses L4 by default; add annotations if needed for your setup
      annotations: {}
EOF
```

</CodeBlock>

<CodeBlock cloud="gcp">

```bash
cat <<EOF > values.yaml
externalTLS:
  host: ${SPACES_ROUTER_HOST}

router:
  proxy:
    service:
      type: LoadBalancer
      annotations:
        cloud.google.com/l4-rbs: enabled
EOF
```

</CodeBlock>

:::tip
To use Gateway API or Ingress instead of LoadBalancer, see [Exposing Spaces externally][expose].
:::

### Install Upbound Spaces software

Create an image pull secret so that the cluster can pull Upbound Spaces images.

```bash
kubectl create ns upbound-system
kubectl -n upbound-system create secret docker-registry upbound-pull-secret \
  --docker-server=https://xpkg.upbound.io \
  --docker-username="$(jq -r .accessId $SPACES_TOKEN_PATH)" \
  --docker-password="$(jq -r .token $SPACES_TOKEN_PATH)"
```

Log in with Helm to be able to pull chart images for the installation commands.

```bash
jq -r .token $SPACES_TOKEN_PATH | helm registry login xpkg.upbound.io -u $(jq -r .accessId $SPACES_TOKEN_PATH) --password-stdin
```

Install the Spaces software. Use the `values.yaml` file you created in the previous step (with `externalTLS.host` and `router.proxy.service`).

```bash
helm -n upbound-system upgrade --install spaces \
  oci://xpkg.upbound.io/spaces-artifacts/spaces \
  --version "${SPACES_VERSION}" \
  -f values.yaml \
  --set "account=${UPBOUND_ACCOUNT}" \
  --set "authentication.hubIdentities=true" \
  --set "authorization.hubRBAC=true" \
  --wait
```

### Create a DNS record

:::important
Create a DNS record for the spaces-router load balancer before you create your first control plane.
:::

Get the load balancer address for the spaces-router Service:

<CodeBlock cloud="aws">

```bash
kubectl get svc -n upbound-system spaces-router \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

</CodeBlock>

<CodeBlock cloud="azure">

```bash
kubectl get svc -n upbound-system spaces-router \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

</CodeBlock>

<CodeBlock cloud="gcp">

```bash
kubectl get svc -n upbound-system spaces-router \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

</CodeBlock>

If the preceding command doesn't return a load balancer address then your
provider may not have allocated it yet. Once it's available, add a DNS record
for the `ROUTER_HOST` to point to the given load balancer address. If it's an
IPv4 address, add an A record. If it's a domain name, add a CNAME record.

## Configure the up CLI

With your kubeconfig pointed at the Kubernetes cluster where you installed
Upbound Spaces, create a new profile in the `up` CLI. This profile interacts
with your Space:

```bash
up profile create --use ${SPACES_CLUSTER_NAME} --type=disconnected --organization ${UPBOUND_ACCOUNT}
```

Optionally, log in to your Upbound account using the new profile so you can use the Upbound Marketplace with this profile as well:

```bash
up login
```

<!-- vale Google.Headings = NO -->
## Connect to your Space
<!-- vale Google.Headings = YES -->

Use `up ctx` to create a kubeconfig context pointed at your new Space:

```bash
up ctx disconnected/$(kubectl config current-context)
```

## Create your first control plane

You can now create a control plane with the `up` CLI:

```bash
up ctp create ctp1
```

You can also create a control plane with kubectl:

```yaml
cat <<EOF | kubectl apply -f -
apiVersion: spaces.upbound.io/v1beta1
kind: ControlPlane
metadata:
  name: ctp1
  namespace: default
spec:
  writeConnectionSecretToRef:
    name: kubeconfig-ctp1
    namespace: default
EOF
```

The first control plane you create in a Space takes around 5 minutes to get into a `condition=READY` state. Wait until it's ready using the following command:

```bash
kubectl wait controlplane ctp1 --for condition=Ready=True --timeout=360s
```

## Connect to your control plane

<!-- vale Upbound.Spelling = NO -->
Connect to your control plane with the up ctx command. With your kubeconfig
still pointed at the Kubernetes cluster where you installed the Upbound Space,
run the following:
<!-- vale Upbound.Spelling = YES -->


```bash
up ctx ./default/ctp1
```

This command updates your current kubectl context. You're now connected to your control plane directly. Confirm this is the case by trying to list the CRDs in your control plane:

```bash
kubectl get crds
```

To disconnect from your control plane and switch back to your previous context:

```bash
up ctx -
```

:::tip
Learn how to use the up CLI to navigate around Upbound by reading the [up ctx command reference][up-ctx-command-reference].
:::

[up-ctx-command-reference]: /reference/cli-reference
[contact-upbound]: https://www.upbound.io/contact-us
[expose]: /self-hosted-spaces/howtos/ingress/
