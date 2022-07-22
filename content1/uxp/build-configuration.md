---
title: "Build a Configuration"
metaTitle: "Build a Configuration"
metaDescription: "Build a Configuration"
rank: 12
---

In the [previous section] our app team was able to create a PostgreSQL database
because our platform team had installed a configuration package that defined the
`PostgreSQLInstance` XR and a `Composition` of managed resources that mapped to
it. UXP allows you to define your own composite resources (XRs) and
compositions, then package them up to be easily distributed as OCI images. This
allows you to construct a reproducible platform that exposes infrastructure APIs
at your desired level of abstraction, and can be installed into any deployment
of UXP.

## Create a Configuration Directory

We are going to build the same configuration package that we previously
installed. It will consist of three files:

* `crossplane.yaml` - Metadata about the configuration.
* `definition.yaml` - The XRD.
* `composition.yaml` - The Composition.

You can create a configuration from any directory with a valid `crossplane.yaml`
metadata file at its root, and one or more XRDs or Compositions. The directory
structure does not matter, as long as the `crossplane.yaml` file is at the root.
Note that a configuration need not contain one XRD and one composition - it
could include only an XRD, only a composition, several compositions, or any
combination thereof.

Before we go any further, we must create a directory in which to build our
configuration:

```console
mkdir uxp-config
cd uxp-config
```

We'll create the aforementioned three files in this directory, then build them
into a package.

Note that `definition.yaml` and `composition.yaml` could be created directly in
the UXP cluster without packaging them into a configuration. This can be
useful for testing compositions before pushing them to a registry.

## Define a Composite Resource

First we'll create a `CompositeResourceDefinition` (XRD) to define the schema of
our `CompositePostgreSQLInstance` and its `PostgreSQLInstance` resource claim.

```yaml
apiVersion: apiextensions.crossplane.io/v1
kind: CompositeResourceDefinition
metadata:
  name: compositepostgresqlinstances.database.example.org
  annotations:
    uxp-guide: getting-started
spec:
  group: database.example.org
  names:
    kind: CompositePostgreSQLInstance
    plural: compositepostgresqlinstances
  claimNames:
    kind: PostgreSQLInstance
    plural: postgresqlinstances
  connectionSecretKeys:
    - username
    - password
    - endpoint
    - port
  versions:
  - name: v1alpha1
    served: true
    referenceable: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            properties:
              parameters:
                type: object
                properties:
                  storageGB:
                    type: integer
                required:
                  - storageGB
            required:
              - parameters
```

```console
curl -OL https://raw.githubusercontent.com/upbound/universal-crossplane/main/docs/getting-started/configuration/definition.yaml
```

You might notice that the XRD we created specifies both "names" and "claim
names". This is because the composite resource it defines offers a composite
resource claim (XRC).

```yaml
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: vpcpostgresqlinstances.aws.database.example.org
  labels:
    uxp-guide: getting-started
spec:
  writeConnectionSecretsToNamespace: upbound-system
  compositeTypeRef:
    apiVersion: database.example.org/v1alpha1
    kind: CompositePostgreSQLInstance
  resources:
    - name: vpc
      base:
        apiVersion: ec2.aws.crossplane.io/v1beta1
        kind: VPC
        spec:
          forProvider:
            region: us-east-1
            cidrBlock: 192.168.0.0/16
            enableDnsSupport: true
            enableDnsHostNames: true
    - name: subnet-a
      base:
        apiVersion: ec2.aws.crossplane.io/v1beta1
        kind: Subnet
        metadata:
          labels:
            zone: us-east-1a
        spec:
          forProvider:
            region: us-east-1
            cidrBlock: 192.168.64.0/18
            vpcIdSelector:
              matchControllerRef: true
            availabilityZone: us-east-1a
    - name: subnet-b
      base:
        apiVersion: ec2.aws.crossplane.io/v1beta1
        kind: Subnet
        metadata:
          labels:
            zone: us-east-1b
        spec:
          forProvider:
            region: us-east-1
            cidrBlock: 192.168.128.0/18
            vpcIdSelector:
              matchControllerRef: true
            availabilityZone: us-east-1b
    - name: subnet-c
      base:
        apiVersion: ec2.aws.crossplane.io/v1beta1
        kind: Subnet
        metadata:
          labels:
            zone: us-east-1c
        spec:
          forProvider:
            region: us-east-1
            cidrBlock: 192.168.192.0/18
            vpcIdSelector:
              matchControllerRef: true
            availabilityZone: us-east-1c
    - name: dbsubnetgroup
      base:
        apiVersion: database.aws.crossplane.io/v1beta1
        kind: DBSubnetGroup
        spec:
          forProvider:
            region: us-east-1
            description: An excellent formation of subnetworks.
            subnetIdSelector:
              matchControllerRef: true
    - name: internetgateway
      base:
        apiVersion: ec2.aws.crossplane.io/v1beta1
        kind: InternetGateway
        spec:
          forProvider:
            region: us-east-1
            vpcIdSelector:
              matchControllerRef: true
    - name: routetable
      base:
        apiVersion: ec2.aws.crossplane.io/v1beta1
        kind: RouteTable
        spec:
          forProvider:
            region: us-east-1
            vpcIdSelector:
              matchControllerRef: true
            routes:
              - destinationCidrBlock: 0.0.0.0/0
                gatewayIdSelector:
                  matchControllerRef: true
            associations:
              - subnetIdSelector:
                  matchLabels:
                    zone: us-east-1a
              - subnetIdSelector:
                  matchLabels:
                    zone: us-east-1b
              - subnetIdSelector:
                  matchLabels:
                    zone: us-east-1c
    - name: securitygroup
      base:
        apiVersion: ec2.aws.crossplane.io/v1beta1
        kind: SecurityGroup
        spec:
          forProvider:
            region: us-east-1
            vpcIdSelector:
              matchControllerRef: true
            groupName: crossplane-getting-started
            description: Allow access to PostgreSQL
            ingress:
              - fromPort: 5432
                toPort: 5432
                ipProtocol: tcp
                ipRanges:
                  - cidrIp: 0.0.0.0/0
                    description: Everywhere
    - name: rdsinstance
      base:
        apiVersion: database.aws.crossplane.io/v1beta1
        kind: RDSInstance
        spec:
          forProvider:
            region: us-east-1
            dbSubnetGroupNameSelector:
              matchControllerRef: true
            vpcSecurityGroupIDSelector:
              matchControllerRef: true
            dbInstanceClass: db.t2.small
            masterUsername: masteruser
            engine: postgres
            engineVersion: "9.6"
            skipFinalSnapshotBeforeDeletion: true
            publiclyAccessible: true
          writeConnectionSecretToRef:
            namespace: upbound-system
      patches:
        - fromFieldPath: "metadata.uid"
          toFieldPath: "spec.writeConnectionSecretToRef.name"
          transforms:
            - type: string
              string:
                fmt: "%s-postgresql"
        - fromFieldPath: "spec.parameters.storageGB"
          toFieldPath: "spec.forProvider.allocatedStorage"
      connectionDetails:
        - fromConnectionSecretKey: username
        - fromConnectionSecretKey: password
        - fromConnectionSecretKey: endpoint
        - fromConnectionSecretKey: port
```

```console
curl -OL https://raw.githubusercontent.com/upbound/universal-crossplane/main/docs/getting-started/configuration/composition.yaml
```

Note that this `Composition` for AWS also includes several networking managed
resources that are required to provision a publicly available PostgreSQL
instance. Composition enables scenarios such as this, as well as far more
complex ones. See the [composition] documentation for more information.

## Build The Configuration

Finally, we'll author our metadata file then build and push our configuration
so that UXP users may install it.

```yaml
apiVersion: meta.pkg.crossplane.io/v1
kind: Configuration
metadata:
  name: getting-started-with-aws
  annotations:
    uxp-guide: getting-started
spec:
  crossplane:
    version: ">=v1.2.1"
  dependsOn:
    - provider: xpkg.upbound.io/crossplane/provider-aws
      version: "v0.18.1"
```

```console
curl -OL https://raw.githubusercontent.com/upbound/universal-crossplane/main/docs/getting-started/configuration/crossplane.yaml

up xpkg build --name getting-started.xpkg
```

You should see a file in your working directory with a `.xpkg` extension.
That's it! You've now built your configuration. Take a look at the Crossplane
[packages] documentation for more information about installing and working with
packages, and check out our [guide to pushing] your configuration to the Upbound
Marketplace.

[previous section]: ../provision-infrastructure
[composition]: https://crossplane.io/docs/master/concepts/composition.html
[packages]: https://crossplane.io/docs/master/concepts/packages.html
[guide to pushing]: ../../upbound-marketplace/publishing-a-listing