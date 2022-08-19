---
title: "UXP Concepts"
metaTitle: "Concepts"
metaDescription: "UXP Concepts"
rank: 11
---

Our belief at Upbound is that among the many innovations brought about by
Kubernetes, the Kubernetes control plane is it's crowning achievement, and will
be what the project is ultimately remembered for building. From our perspective,
container orchestration was simply the first use case for this powerful control
plane, but its applications will be far more wide-ranging.

Upbound Universal Crossplane (UXP) installs into any Kubernetes cluster and
extends the Kubernetes API, or Kubernetes Resource Model (KRM), with the
Crossplane Resource Model (XRM).

UXP enables platform teams to define their own opinionated control plane - their
own APIs - that can orchestrate anything with an API. These control plane APIs
can then be offered to app teams to enable safe, guided self-service.

![Separation of concerns](../images/separation-of-concerns.png)

Platform teams configure UXP by installing Providers and Configurations.

**Providers** extend Crossplane with support for new _managed resources_.
Managed resources are the building blocks of Crossplane; each managed resource
represents an API Crossplane can manage. For example `provider-aws` extends
Crossplane by defining managed resources like `Bucket`, `RDSInstance`, and
`IAMRole` and adding controllers that know how to reconcile them with AWS.

**Configurations** extend Crossplane with support for new _composite resources_
(XRs). XRs compose one or more managed resources into a new API defined by the
Configuration author. Specifically, a Configuration delivers _composite resource
definitions_ (XRDs) and Compositions, which define the schema of an XR and how
an XR may be composed of managed resources respectively. Platform teams can
browse popular Configurations in the Upbound Marketplace or define their own.

**Claims** or _composite resource claims_ (XRCs) are how app teams consume the
managed and composite resources defined by Providers and Configurations. Each
XR may offer a kind of claim - for example an `AcmeSQLInstance` - in order to
consume the APIs defined by their platform teams. Platform teams can see what
claims exist, their health, and how they are composed by connecting their UXP
control planes to Upbound.

## Concepts in Action

One powerful way to leverage UXP as your control plane is to take advantage of
GitOps practices and integrate it with your existing CI/CD pipelines.

![GitOps and UXP](../images/gitops-and-uxp.png)

Platform teams typically define their XRs and Compositions in git, using a CI/CD
system to build and push Configurations to the Upbound Marketplace. The deployed
versions of these Configurations can be managed by the Upbound package manager -
which can in turn be configured declaratively via GitOps.

App teams often also manage the infrastructure upon which their applications
depend using a GitOps model, for example by deploying [Helm] charts using
[ArgoCD]. With UXP app teams can include templates for the composite resource
claims (the `AcmeSQLInstance`) their apps need right alongside the templates for
the deployments that run their app.

[Helm]: https://helm.sh/
[ArgoCD]: https://argoproj.github.io/argo-cd/
