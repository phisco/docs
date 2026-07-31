---
title: Build your first platform with UXP
description: Deploy a real app with a cloud database, observe drift detection, enforce policies, and change infrastructure live, all from a single control plane.
weight: 5
validation:
  type: walkthrough
  owner: docs@upbound.io
  environment: local-upbound
  timeout: 30m
---

In this tutorial, you deploy an application with a PostgreSQL database on AWS.
You use Upbound Crossplane to manage resources, enforce security policy, and
change infrastructure.

By the end of this tutorial, you can:

- Deploy a composite resource that creates multiple AWS resources from a single manifest
- Explore the providers and ProviderConfigs that connect your platform to AWS
- Trigger drift detection and watch Crossplane correct an out-of-band change
- Block non-compliant requests with Kyverno before they reach Crossplane
- Update live infrastructure by changing desired state

## Prerequisites

Install the following tools before starting:

- [`kubectl`][kubectl-install]
- [AWS CLI][aws-cli], configured with credentials for an account where you can create VPCs, IAM roles, and RDS instances
- [kind][kind]
- [`up CLI`][up-cli] v0.44.3 or later

## Create the project

Scaffold a new project with `up project init`. This creates the `app-w-db/`
directory with a valid `upbound.yaml` and the standard project layout
(`apis/`, `functions/`, `examples/`, `tests/`):

```bash
up project init --scratch app-w-db
cd app-w-db
```

All commands from this point run from inside the `app-w-db` directory.

The platform composes AWS resources and uses `function-auto-ready` so composite
resources report ready status. Add them as project dependencies:

```bash
up dependency add 'xpkg.upbound.io/upbound/provider-family-aws:v2.4.0'
up dependency add 'xpkg.upbound.io/upbound/provider-aws-iam:v2.4.0'
up dependency add 'xpkg.upbound.io/upbound/provider-aws-rds:v2.4.0'
up dependency add 'xpkg.upbound.io/upbound/provider-aws-ec2:v2.4.0'
up dependency add 'xpkg.upbound.io/crossplane-contrib/function-auto-ready:v0.6.1'
```

`up dependency add` records each dependency in `upbound.yaml`.

The platform exposes two APIs: `AppWDB` (a basic app with a database) and
`AppWDBSecure` (the same API with an optional security context, used later for
policy enforcement).

Create the `AppWDB` XRD:

```bash
mkdir -p apis/appwdb
cat > apis/appwdb/definition.yaml <<'EOF'
apiVersion: apiextensions.crossplane.io/v2
kind: CompositeResourceDefinition
metadata:
  name: appwdbs.demo.upbound.io
spec:
  group: demo.upbound.io
  names:
    categories:
    - crossplane
    kind: AppWDB
    plural: appwdbs
  scope: Namespaced
  versions:
  - name: v1alpha1
    referenceable: true
    schema:
      openAPIV3Schema:
        description: AppWDB is the Schema for the AppWDB API.
        properties:
          spec:
            description: AppWDBSpec defines the desired state of AppWDB.
            type: object
            properties:
              parameters:
                type: object
                description: AppWDB configuration parameters
                properties:
                  replicas:
                    type: integer
                    default: 2
                    description: Number of app replicas
                  dbSize:
                    type: string
                    default: db.t3.micro
                    enum:
                    - db.t3.micro
                    - db.t3.small
                    - db.t3.medium
                    description: RDS instance class
                  region:
                    type: string
                    default: us-east-1
                    description: AWS region
            required:
            - parameters
          status:
            description: AppWDBStatus defines the observed state of AppWDB.
            type: object
        required:
        - spec
        type: object
    served: true
EOF
```

Create the `AppWDBSecure` XRD:

```bash
mkdir -p apis/appwdbsecure
cat > apis/appwdbsecure/definition.yaml <<'EOF'
apiVersion: apiextensions.crossplane.io/v2
kind: CompositeResourceDefinition
metadata:
  name: appwdbsecures.demo.upbound.io
spec:
  group: demo.upbound.io
  names:
    categories:
    - crossplane
    kind: AppWDBSecure
    plural: appwdbsecures
  scope: Namespaced
  versions:
  - name: v1alpha1
    referenceable: true
    schema:
      openAPIV3Schema:
        description: AppWDBSecure is the Schema for the AppWDBSecure API.
        properties:
          spec:
            description: AppWDBSecureSpec defines the desired state of AppWDBSecure.
            type: object
            properties:
              parameters:
                type: object
                description: AppWDBSecure configuration parameters
                properties:
                  replicas:
                    type: integer
                    default: 2
                    description: Number of app replicas
                  dbSize:
                    type: string
                    default: db.t3.micro
                    enum:
                    - db.t3.micro
                    - db.t3.small
                    - db.t3.medium
                    description: RDS instance class
                  region:
                    type: string
                    default: us-east-1
                    description: AWS region
                  securityContext:
                    type: object
                    description: Optional security context for the application container
                    properties:
                      privileged:
                        type: boolean
                        description: Run container as privileged. Blocked by platform policy.
            required:
            - parameters
          status:
            description: AppWDBSecureStatus defines the observed state of AppWDBSecure.
            type: object
        required:
        - spec
        type: object
    served: true
EOF
```

The composition function is a KCL program that maps the user's 10-line request
to the full set of AWS resources.

```bash
mkdir -p functions/compose-resources
cat > functions/compose-resources/kcl.mod <<'EOF'
[package]
name = "compose-resources"
version = "0.1.0"
EOF
```

Create `main.k`. This file is the entire composition logic. It reads the
composite resource and outputs every managed resource Crossplane creates:

```bash
cat > functions/compose-resources/main.k <<'EOF'
oxr = option("params").oxr
ocds = option("params").ocds

params = oxr.spec.parameters
appName = oxr.metadata.name
region = params.region or "us-east-1"
dbSize = params.dbSize or "db.t3.micro"
replicas = params.replicas or 2

_is_deleting = bool(oxr.metadata?.deletionTimestamp)
_db_key = "${appName}-db"
_instance_still_exists = _db_key in ocds

_metadata = lambda name: str -> any {
    {
        namespace: oxr.metadata.namespace
        annotations: {"krm.kcl.dev/composition-resource-name": name}
    }
}

_defaults = {
    managementPolicies: ["*"]
    providerConfigRef: {kind: "ProviderConfig", name: "default"}
}

_subnets = [
    {cidrBlock: "10.0.1.0/24", availabilityZone: "${region}a", suffix: "a"}
    {cidrBlock: "10.0.2.0/24", availabilityZone: "${region}b", suffix: "b"}
    {cidrBlock: "10.0.3.0/24", availabilityZone: "${region}c", suffix: "c"}
]

_sg_items = [{
    apiVersion: "rds.aws.m.upbound.io/v1beta1"
    kind: "SubnetGroup"
    metadata: _metadata("${appName}-subnet-group") | {name: "${appName}-subnet-group"}
    spec: _defaults | {
        forProvider: {
            region: region
            description: "${appName} DB subnet group"
            subnetIdSelector: {matchControllerRef: True}
        }
    }
}] if not _is_deleting or _instance_still_exists else []

_db_items = [{
    apiVersion: "rds.aws.m.upbound.io/v1beta1"
    kind: "Instance"
    metadata: _metadata("${appName}-db") | {
        name: "${appName}-db"
        annotations: {"crossplane.io/external-name": "${appName}-db"}
    }
    spec: _defaults | {
        forProvider: {
            region: region
            identifier: "${appName}-db"
            engine: "postgres"
            engineVersion: "16.6"
            instanceClass: dbSize
            username: "demoadmin"
            dbName: "appdb"
            autoGeneratePassword: True
            passwordSecretRef: {namespace: oxr.metadata.namespace, name: "${appName}-db-password", key: "password"}
            applyImmediately: True
            skipFinalSnapshot: True
            allocatedStorage: 20
            storageType: "gp3"
            storageEncrypted: False
            publiclyAccessible: False
            backupRetentionPeriod: 0
            dbSubnetGroupNameSelector: {matchControllerRef: True}
        }
        initProvider: {identifier: "${appName}-db"}
    }
}] if not _is_deleting else []

_items = [
    {
        apiVersion: "ec2.aws.m.upbound.io/v1beta1"
        kind: "VPC"
        metadata: _metadata("${appName}-vpc") | {name: "${appName}-vpc"}
        spec: _defaults | {
            forProvider: {
                region: region
                cidrBlock: "10.0.0.0/16"
                enableDnsHostnames: True
                enableDnsSupport: True
                tags: {"Name": "${appName}-vpc"}
            }
        }
    }
] + [
    {
        apiVersion: "ec2.aws.m.upbound.io/v1beta1"
        kind: "Subnet"
        metadata: _metadata("${appName}-subnet-${s.suffix}") | {name: "${appName}-subnet-${s.suffix}"}
        spec: _defaults | {
            forProvider: {
                region: region
                cidrBlock: s.cidrBlock
                availabilityZone: s.availabilityZone
                vpcIdSelector: {matchControllerRef: True}
                tags: {"Name": "${appName}-subnet-${s.suffix}"}
            }
        }
    } for s in _subnets
] + _sg_items + _db_items + [
    {
        apiVersion: "iam.aws.m.upbound.io/v1beta1"
        kind: "Role"
        metadata: _metadata("${appName}-role") | {name: "${appName}-role"}
        spec: _defaults | {
            forProvider: {
                assumeRolePolicy: '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
            }
        }
    }
    {
        apiVersion: "apps/v1"
        kind: "Deployment"
        metadata: _metadata("${appName}-deployment") | {name: appName}
        spec: {
            replicas: replicas
            selector: {matchLabels: {app: appName}}
            template: {
                metadata: {labels: {app: appName}}
                spec: {
                    containers: [
                        {
                            name: "app"
                            image: "public.ecr.aws/nginx/nginx:stable-alpine"
                            ports: [{containerPort: 80}]
                        } | ({securityContext: {privileged: params.securityContext.privileged}} if params?.securityContext?.privileged != None else {})
                    ]
                }
            }
        }
    }
]

items = _items
EOF
```

Create the base example and the variants used in later steps:

```bash
mkdir -p examples/appwdb
cat > examples/appwdb/example.yaml <<'EOF'
apiVersion: demo.upbound.io/v1alpha1
kind: AppWDB
metadata:
  name: demo-01
  namespace: demo
spec:
  parameters:
    replicas: 2
    dbSize: db.t3.micro
    region: us-east-1
EOF

cat > examples/appwdb/variant-bigger-db.yaml <<'EOF'
apiVersion: demo.upbound.io/v1alpha1
kind: AppWDB
metadata:
  name: demo-01
  namespace: demo
spec:
  parameters:
    replicas: 2
    dbSize: db.t3.medium
    region: us-east-1
EOF

cat > examples/appwdb/variant-more-replicas.yaml <<'EOF'
apiVersion: demo.upbound.io/v1alpha1
kind: AppWDB
metadata:
  name: demo-01
  namespace: demo
spec:
  parameters:
    replicas: 5
    dbSize: db.t3.micro
    region: us-east-1
EOF
```

Create the secure examples used in the policy enforcement step:

```bash
mkdir -p examples/appwdbsecure
cat > examples/appwdbsecure/example-1.yaml <<'EOF'
apiVersion: demo.upbound.io/v1alpha1
kind: AppWDBSecure
metadata:
  name: kyverno-demo-01
  namespace: demo
spec:
  parameters:
    replicas: 2
    dbSize: db.t3.micro
    region: us-east-1
    securityContext:
      privileged: true
EOF

cat > examples/appwdbsecure/example-2.yaml <<'EOF'
apiVersion: demo.upbound.io/v1alpha1
kind: AppWDBSecure
metadata:
  name: kyverno-demo-01
  namespace: demo
spec:
  parameters:
    replicas: 2
    dbSize: db.t3.micro
    region: us-east-1
    securityContext:
      privileged: false
EOF
```

The `ProviderConfig` tells the AWS providers where to find credentials.

```bash
mkdir -p setup/config
cat > setup/config/aws-provider-config.yaml <<'EOF'
apiVersion: aws.m.upbound.io/v1beta1
kind: ProviderConfig
metadata:
  name: default
  namespace: demo
spec:
  credentials:
    source: Secret
    secretRef:
      namespace: demo
      name: aws-secret
      key: creds
EOF
```

## Configure AWS credentials

The demo creates real AWS resources. Create a file named `aws-credentials.txt`
in the project directory with credentials that have permissions to create VPCs,
subnets, IAM roles, and RDS instances:

```ini
[default]
aws_access_key_id = <your-access-key-id>
aws_secret_access_key = <your-secret-access-key>
```

:::warning
This tutorial uses static AWS credentials for convenience. Don't use static
credentials in production. Use IAM roles, IRSA, or another short-lived
credential mechanism instead. See [AWS authentication][aws-auth-docs] for
secure alternatives.
:::

## Start the project

Open a dedicated terminal window and run from inside `app-w-db`:

```bash
up project run --local --ingress
```

This command:

- Creates a kind cluster named `up-app-w-db`
- Installs UXP into the cluster
- Builds and deploys the KCL composition function
- Installs the AWS providers declared in `upbound.yaml`
- Applies the XRDs from `apis/`
- Installs an ingress controller for the UXP console

Startup takes several minutes. Keep this terminal open throughout the tutorial.

:::warning
`up project run --local` may print `traces export: context deadline exceeded`.
This message reports a telemetry timeout and doesn't affect the cluster setup.
:::

Verify the connection:

```bash
kubectl get nodes
```

Apply your AWS credentials so providers can authenticate:

1. Create the `demo` namespace:

   ```bash
   kubectl create namespace demo
   ```

2. Create a secret with your AWS credentials:

   ```bash
   kubectl create secret generic aws-secret \
     -n demo \
     --from-file=creds=./aws-credentials.txt
   ```

Check that all four providers report healthy:

```bash
kubectl get providers
```

Wait until all four providers show `HEALTHY: True` before continuing.

:::warning
If this returns **No resources found**, `up project run --local` didn't
complete. Delete the cluster with `kind delete cluster --name up-app-w-db` and
restart.
:::

Check that the composition function is healthy:

```bash
kubectl get functions
```

The KCL function should show `HEALTHY: True`.

:::warning
If this returns **No resources found**, the KCL function wasn't built or
deployed. Check the `up project run` terminal and restart.
:::

Capture the function name assigned by `up project run`:

```bash
FUNC_NAME=$(kubectl get functions --no-headers | grep -v 'crossplane-contrib' | awk '{print $1}')
echo $FUNC_NAME
```

Apply both Compositions using that name:

```bash
cat > apis/appwdb/composition.yaml <<EOF
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  labels:
    provider: aws
    type: app-w-db
  name: appwdbs.demo.upbound.io
spec:
  compositeTypeRef:
    apiVersion: demo.upbound.io/v1alpha1
    kind: AppWDB
  mode: Pipeline
  pipeline:
  - step: compose-resources
    functionRef:
      name: \${FUNC_NAME}
  - step: automatically-detect-ready-composed-resources
    functionRef:
      name: crossplane-contrib-function-auto-ready
EOF

cat > apis/appwdbsecure/composition.yaml <<EOF
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  labels:
    provider: aws
    type: app-w-db-secure
  name: appwdbsecures.demo.upbound.io
spec:
  compositeTypeRef:
    apiVersion: demo.upbound.io/v1alpha1
    kind: AppWDBSecure
  mode: Pipeline
  pipeline:
  - step: compose-resources
    functionRef:
      name: \${FUNC_NAME}
  - step: automatically-detect-ready-composed-resources
    functionRef:
      name: crossplane-contrib-function-auto-ready
EOF

kubectl apply -f apis/appwdb/composition.yaml
kubectl apply -f apis/appwdbsecure/composition.yaml
```

Verify both XRDs reach the `Established` condition:

```bash
kubectl get xrds
```

Both XRDs should show `ESTABLISHED: True` before continuing.

:::warning
If this returns **No resources found**, stop here. Return to the
`up project run` terminal to diagnose the failure.
:::

Apply the `ProviderConfig` only after all providers are healthy:

```bash
kubectl apply -f setup/config/
```

:::info
AWS resource provisioning takes 5 to 8 minutes for RDS. Each section of this
tutorial gives you something to read while AWS works.
:::

The UXP console provides a visual interface for browsing composite resources,
viewing resource relationship graphs, and checking sync status.

1. Enable the web UI:

   ```bash
   up uxp web-ui enable
   ```

2. In a new terminal, port-forward to the service:

   ```bash
   kubectl port-forward -n crossplane-system svc/webui 8080:80
   ```

3. Open `http://localhost:8080` in your browser.

The console shows every composite resource, the tree of composed resources it
manages, and their sync status. Use it throughout this tutorial to complement
`kubectl` output.

## Deploy an app with a database

The end-user interface for this platform is a 10-line manifest. A developer
fills in three fields: replica count, database size, and AWS region. The
platform handles the VPC, subnets, IAM role, and RDS configuration.

1. Apply the example manifest:

   ```bash
   kubectl apply -f examples/appwdb/example.yaml
   ```

2. Check the composite resource status:

   ```bash
   kubectl get appwdb demo-01 -n demo
   ```

3. Verify the `Deployment` came up:

   ```bash
   kubectl get pods -n demo
   ```

Those 10 lines create:

- VPC + 3 subnets (`us-east-1a`, `us-east-1b`, `us-east-1c`)
- RDS subnet group + PostgreSQL instance (gp3 storage)
- IAM role
- Kubernetes `Deployment` scaled to `replicas: 2`

Open the AWS Console and set your region to **`us-east-1`**. Look for
`demo-01-role` under **IAM → Roles**, `demo-01-vpc` under **VPC → Your VPCs**,
and `demo-01-db` under **RDS → Databases** (about 5 to 8 minutes).

In the UXP console, click into `demo-01` and open the **relationship view** to
see all composed resources and their sync status.

Now look at the files that produced those resources.

Open `apis/appwdb/definition.yaml`.

The XRD defines the API your end users interact with. The `dbSize` field is
an enum, not a free-text field, so users can't request a size the platform
doesn't support.

Open `apis/appwdb/composition.yaml`.

The Composition maps those 10 lines to all the AWS resources. It calls the
KCL function you created. You can also write Composition functions in
[Go][fn-go], [Python][fn-python], or [Go Templating][fn-go-template], and mix
languages within a single pipeline.

Open `functions/compose-resources/main.k`.

The logic layer reads `dbSize` and `replicas` from the composite resource and
outputs every managed resource Crossplane creates. The platform team owns and
maintains this file. End users never edit it.

## Explore the control plane

A **control plane** is software that continuously watches desired state and
reconciles actual state to match it. Crossplane turns a Kubernetes cluster
into a control plane for all infrastructure and applications.

**Composite Resources** are the custom APIs your platform exposes. The file you
applied in `examples/appwdb/example.yaml` is a Composite Resource. Instead of
giving end users raw AWS access, the platform team defines higher-level
abstractions like `AppWDB`, and end users request those.

**Providers** are how Crossplane talks to external systems like AWS. Each
provider is a Kubernetes controller that manages a specific service such as
EC2, RDS, or IAM. In Crossplane 2.0, Crossplane composes the Kubernetes
`Deployment` for your app natively, with no separate Kubernetes provider
needed.

**ProviderConfigs** tell providers how to authenticate. This demo uses a
`Secret`-based `ProviderConfig`, but each provider supports multiple
authentication methods:

| Provider | Authentication methods |
|----------|----------------------|
| AWS | OIDC (Upbound), access keys, WebIdentity, IRSA |
| Azure | OIDC (Upbound), service principal, managed identity |
| GCP | OIDC (Upbound), service account keys, workload identity |
| Helm | Injected identity with cloud provider credentials |

More details in [provider authentication][auth-docs].

1. Confirm all four providers are healthy:

   ```bash
   kubectl get providers
   ```

   All four should show `HEALTHY: True`.

2. Confirm the `ProviderConfig` is present:

   ```bash
   kubectl get providerconfigs.aws.m.upbound.io default -n demo
   ```

In the UXP console, navigate to `demo-01` and open the relationship view to see
all 8 composed resources, their sync status, and how they connect.

## Drift detection

If someone changes a resource directly in AWS, Crossplane detects the
difference between desired state and actual state and corrects it. Crossplane
calls this drift detection.

Trigger drift by changing a VPC tag in AWS, then watch Crossplane revert it:

1. Verify the VPC reached `SYNCED: True`:

   ```bash
   kubectl get vpcs.ec2.aws.m.upbound.io demo-01-vpc -n demo
   ```

   Wait until `SYNCED: True`.

2. In the AWS Console, go to **VPC → Your VPCs** and find `demo-01-vpc`.

3. Click the **Name** tag and change it to something else, such as
   `demo-01-vpc-hacked`. Refresh to confirm the change took effect.

4. Tell Crossplane to reconcile immediately instead of waiting for the next loop:

   ```bash
   kubectl annotate vpcs.ec2.aws.m.upbound.io demo-01-vpc -n demo \
     reconcile.crossplane.io/trigger="$(date)" \
     --overwrite
   ```

5. Watch the sync status:

   ```bash
   kubectl get vpcs.ec2.aws.m.upbound.io demo-01-vpc -n demo -w \
     -o custom-columns='NAME:.metadata.name,SYNCED:.status.conditions[?(@.type=="Synced")].reason'
   ```

6. Switch to the AWS Console and watch the Name tag snap back to `demo-01-vpc`.

The control plane detected the drift and corrected it.

Confirm the composite resource is back in sync:

```bash
kubectl get appwdb demo-01 -n demo
```

`SYNCED: True` confirms the control plane corrected the drift.

## Add policy enforcement

Kyverno is a policy engine that intercepts Kubernetes admission requests before
they're accepted. Kyverno blocks a policy violation before Crossplane runs, so
nothing reaches AWS.

Install the Kyverno add-on and a policy that blocks privileged containers:

1. Create the Kyverno add-on manifest:

   ```bash
   mkdir -p w-kyverno
   cat > w-kyverno/addon-kyverno.yaml <<'EOF'
   apiVersion: pkg.upbound.io/v1beta1
   kind: AddOn
   metadata:
     name: upbound-addon-kyverno
   spec:
     package: xpkg.upbound.io/upbound/addon-kyverno:3.7.0
   EOF
   ```

2. Apply it:

   ```bash
   kubectl apply -f w-kyverno/addon-kyverno.yaml
   ```

3. In the UXP console, select **AddOns** in the left navigation. The
   `upbound-addon-kyverno` entry appears and becomes healthy in about two
   minutes. Or watch from the terminal:

   ```bash
   kubectl get addons.pkg.upbound.io upbound-addon-kyverno -w
   ```

   Wait until `HEALTHY: True` before continuing. Press Ctrl+C when it does.

   If it stays `HEALTHY: False` after 5 minutes, check
   `kubectl describe addons.pkg.upbound.io upbound-addon-kyverno` for events.

4. Create the no-privileged-containers policy:

   ```bash
   cat > w-kyverno/policy-no-privileged.yaml <<'EOF'
   apiVersion: kyverno.io/v1
   kind: ClusterPolicy
   metadata:
     name: disallow-privileged-containers
     annotations:
       policies.kyverno.io/title: Disallow Privileged Containers
       policies.kyverno.io/category: Pod Security
       policies.kyverno.io/severity: high
       policies.kyverno.io/description: >-
         Privileged containers have unrestricted access to the host system.
         This policy blocks any AppWDBSecure request with securityContext.privileged: true
         before Crossplane composes any resources, so nothing reaches AWS.
   spec:
     validationFailureAction: Enforce
     background: false
     rules:
     - name: no-privileged-platform-api
       match:
         any:
         - resources:
             kinds:
             - AppWDBSecure
       validate:
         message: "Privileged containers are not allowed on this platform. Remove securityContext.privileged: true from your request."
         pattern:
           spec:
             parameters:
               =(securityContext):
                 =(privileged): "false"
     - name: no-privileged-deployment
       match:
         any:
         - resources:
             kinds:
             - Deployment
       validate:
         message: "Privileged containers are not allowed on this platform. Remove securityContext.privileged: true from your request."
         pattern:
           spec:
             template:
               spec:
                 containers:
                 - =(securityContext):
                     =(privileged): "false"
   EOF
   ```

5. Apply the policy:

   ```bash
   kubectl apply -f w-kyverno/policy-no-privileged.yaml
   ```

   You may see this warning:

   ```
   Warning: the kind defined in the all match resource is invalid: unable to convert GVK to GVR for kinds AppWDBSecure
   ```

   You can ignore this warning if Crossplane recently created the XRDs. Once
   the CRD is ready, the policy enforces.

6. Verify the policy is active:

   ```bash
   kubectl get clusterpolicy disallow-privileged-containers
   ```

   `READY: True` means the policy is enforcing.

Now confirm the policy blocks a privileged request and accepts a compliant one.

:::warning
Kyverno can only check requests for resource types whose CRDs already exist in
the cluster. If you see `no matches for kind "AppWDBSecure"`, the XRD isn't
ready yet. Confirm `kubectl get xrds` shows both XRDs as `ESTABLISHED: True`.
:::

1. Try to apply a request with `privileged: true`:

   ```bash
   kubectl apply -f examples/appwdbsecure/example-1.yaml
   ```

   Kyverno blocks the request immediately. The error references
   `disallow-privileged-containers`. Crossplane never sees the request, so
   nothing reaches AWS.

   `demo-01`, which you deployed before adding Kyverno, still has a running
   RDS instance. This request didn't start one.

Now try the same request with `privileged: false`:

1. Apply the compliant version:

   ```bash
   kubectl apply -f examples/appwdbsecure/example-2.yaml
   ```

   The request passes the policy check and starts provisioning (~10 minutes).

2. Watch the status:

   ```bash
   kubectl get appwdbsecure -n demo -w
   ```

## Change it live

To change infrastructure, update the desired state. Crossplane figures out
what needs to change and does it. Try scaling the database first, then the
replicas.

1. Scale the database by applying the larger-db variant:

   ```bash
   kubectl apply -f examples/appwdb/variant-bigger-db.yaml
   ```

2. `DESIRED` updates immediately; `ACTUAL` updates once AWS finishes (~5 minutes):

   ```bash
   kubectl get instances.rds.aws.m.upbound.io demo-01-db -n demo -w \
     -o custom-columns='NAME:.metadata.name,DESIRED:.spec.forProvider.instanceClass,ACTUAL:.status.atProvider.instanceClass,SYNCED:.status.conditions[?(@.type=="Synced")].reason'
   ```

3. In the AWS Console, check the **Status** and **Size** columns for `demo-01-db`.

4. Confirm the change:

   ```bash
   kubectl get appwdb demo-01 -n demo
   ```

5. Scale the app replicas by applying the more-replicas variant:

   ```bash
   kubectl apply -f examples/appwdb/variant-more-replicas.yaml
   ```

6. Watch the `Deployment` scale (~30 seconds):

   ```bash
   kubectl get deployment demo-01 -n demo -w \
     -o custom-columns='NAME:.metadata.name,DESIRED:.spec.replicas,READY:.status.readyReplicas'
   ```

7. Confirm the change:

   ```bash
   kubectl get appwdb demo-01 -n demo
   ```

In the UXP console, navigate to `demo-01` to see the full resource tree with
your updated values.

## Clean up

Delete the composite resources. Crossplane deletes all composed AWS resources
before removing each composite resource.

```shell
kubectl delete appwdbsecure kyverno-demo-01 -n demo
kubectl delete appwdb demo-01 -n demo
```

RDS deletion takes 5 to 10 minutes. Wait until both are fully removed:

```shell
kubectl get appwdb -n demo -w
kubectl get appwdbsecure -n demo -w
```

Delete the cluster:

```shell
kind delete cluster --name up-app-w-db
```

## Next steps

In this tutorial, you:

- Created a Crossplane project with XRDs, Compositions, and a KCL function
- Deployed a composite resource that created a VPC, subnets, IAM role, RDS
  instance, and Kubernetes `Deployment` from a 10-line manifest
- Explored the providers and ProviderConfigs that connected your platform to AWS
- Watched Crossplane detect and correct an out-of-band change to a VPC tag
- Blocked a privileged container request with Kyverno before it reached the cluster
- Updated live infrastructure by changing desired state

Continue with:

- [Composite Resource Definitions][xrd-concept]: design your own platform APIs
- [Composition functions][fn-docs]: write the logic that maps user requests to resources
- [Provider authentication][auth-docs]: connect providers to your own cloud account
- [Upbound Marketplace][marketplace]: providers and add-ons for AWS, Azure, GCP, and more

[up-cli]: /manuals/cli/overview/
[kubectl-install]: https://kubernetes.io/docs/tasks/tools/
[up-cli-releases]: https://github.com/upbound/up/releases
[aws-cli]: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
[kind]: https://kind.sigs.k8s.io/docs/user/quick-start/#installation
[fn-go]: /manuals/cli/howtos/compositions/go/
[fn-python]: /manuals/cli/howtos/compositions/python/
[fn-go-template]: /manuals/cli/howtos/compositions/go-template/
[xrd-concept]:/manuals/uxp/concepts/composition/composite-resource-definitions/ 
[fn-docs]: /manuals/uxp/concepts/composition/overview/
[auth-docs]: /manuals/packages/providers/authentication/
[aws-auth-docs]: /manuals/packages/providers/authentication/#aws-authentication
[marketplace]: https://marketplace.upbound.io/

