---
title: "Security"
metaTitle: "Security"
metaDescription: "Security"
rank: 46
---

Upbound’s products are designed from the ground up with security in mind, so
that platform teams can collaborate with developers without compromise. This
document outlines our approach to accounts, user management, and connecting the
self-hosted Upbound Universal Crossplane ([UXP]) clusters to Upbound.

## Upbound Accounts

Upbound Cloud is a globally available service designed for both individuals and
organizations. Our account model is similar to other enterprise SaaS products
like GitHub or Atlassian. It has four key concepts:

* _Users_: Your Upbound user account is your online identity that exists
    independent of your subscription.
* _Robots_: A robot is an account used by automation, such as a CI/CD system.
* _Teams_: Upbound users can belong to multiple teams inside of an Organization.
    Access to control planes and their namespaces managed by Upbound is assigned
    at the team level.
* _Organizations_: Upbound organizations bring together Upbound user accounts
    and product features unlocked through our Business and Enterprise plans. As
    an organization owner, you manage the Upbound accounts connected to your
    organization, and which products they can use.

### Managing User Accounts in Organizations

Every user in Upbound Cloud has their own unique account which can be invited to
different organizations. Users can be members of multiple organizations, and
because users aren’t tied to a single Upbound product they can access products
both within and outside of their organizations.

An organization's creator is its `Admin`. `Admin`s may choose to invite other users
as `Admin`s rather than members. `Admin`s can administer an organization, and their
`Admin` privileges apply to any control planes created within the organization.

Organization `Admin`s can also create robots. A robot account is like a user, but
is intended for use in automation - like a CI/CD system - rather than by a
person. Robot accounts may only have API tokens - not passwords and therefore
cannot login to Upbound Cloud or perform certain operations like creating a
control plane.

An organization's users and robots can be grouped into teams. Organization
`Admin`s can create as many teams as they like. Users may be members or owners of
a team, which grants them access to manage the team's membership. A robot cannot
be an owner of a team.

### Access to Control Planes

All control planes in Upbound Cloud are powered by [UXP]. Control planes can be
associated with a user or an organization. Upbound Cloud allows three levels of
access to a control plane:

* _Viewers_ may view and connect to the control plane, but are limited by [RBAC]
  to 'view-only' operations. A viewer may see what resources are managed by the
  control plane, but may not create, update, or delete resources.
* _Editors_ may view and connect to control planes, and are granted full access
  to operate on Crossplane resources. Editors may create, update, and delete
  Crossplane configurations, composite resources (XRs).
* _Owners_ are granted the same level of access to a control plane as editors,
  but may also edit and delete the control plane itself.

When a control plane is part of an organization access is granted to teams, not
to users and robots directly. Control planes that aren't part of an organization
use a simplified model in which the control plane's creator is its owner and its
only user.

Upbound Cloud users are restricted by RBAC to interacting with Crossplane
resources - that is an Upbound Cloud user can interact with configurations,
providers, XRs, etc but cannot view or interact with common Kubernetes resources
like deployments and services. The exceptions to this rule are:

* _Custom Resource Definitions_. All Upbound Cloud users may view CRDs.
* _Events_. All Upbound Cloud users may view events.
* _Secrets_. All Upbound Cloud users may view secrets, and editors and owners
  may create, update, and delete secrets, but __only in the `upbound-system`
  namespace__.
* _Pods_. Upbound Cloud users may view the pods and pod logs of hosted control
  planes, in order to help debug [UXP]. Upbound Cloud users may not view the pods
  or logs of self-hosted control planes.

## Control Plane Hosting and Security

Upbound Cloud supports both hosted and self-hosted deployments of Universal 
Crossplane ([UXP]). Hosted UXPs are fully managed by Upbound, and are
highly available and reliable. Self-hosted UXPs run outside of Upbound’s VPCs,
but are managed using Upbound Cloud. Upbound Cloud uses the same secure
communication architecture for both hosted and self-hosted deployments of UXP.

![Security Diagram](../images/security-diagram.png)

The Upbound Agent - an open source component of UXP - establishes a connection
to Upbound Cloud using [NATS]. Upbound Cloud uses short lived [JSON Web
Tokens][JWT] (JWTs) signed with Upbound Cloud's public key to interact with the
Agent, ensuring the Agent only accepts requests from Upbound Cloud.

When an Upbound Cloud user operates on a control plane their requests are
handled by the Agent, which is granted access to impersonate two Kubernetes
groups - `upbound:edit` and `upbound:view`. These groups are bound to RBAC
cluster roles that have permission to interact with Crossplane resources like
providers, configurations, XRs, and managed resources. The UXP RBAC manager is
responsible for updating these cluster roles as configurations and providers are
installed and removed from the control plane.

## View-Only Control Planes

Self-hosted control planes may optionally be connected to UXP in 'view-only'
mode. In this mode UXP guarantees that Upbound Cloud and its users will be
granted no more than 'viewer' access to the self-hosted control plane (and thus
to the Kubernetes cluster to which you installed it).

To create a view-only control plane, install UXP with the control plane
permission set to view, then attach it to Upbound Cloud as usual.

```console
# Use https://github.com/upbound/up to install UXP.
up uxp install --set upbound.controlPlane.permission=view
```

Once you've attached UXP, browse to its control plane settings in Upbound Cloud
and toggle 'View Only' to on. This tells Upbound Cloud to expect the control
plane to be view-only, but the restriction itself is enforced by UXP.

### User Data

Upbound user accounts are online identities which exist independent of
organizations. User profile data (name and email) as well as mappings for the
organizations and teams a user belongs to are stored by Upbound. The data for
these personal accounts are stored using GCP regions in North America. Upbound
does not log, store, or receive any information about individual user usage data
inside of their organizations.

### Securing Data

Upbound stores Upbound user account data using GCP regions in North America.
Data stored on our infrastructure is automatically encrypted in transit and at
rest using AES-256 encryption. Stored data is distributed for reliability and
availability, helping guard against intrusion and service outages. Hosted UXP
instance data is encrypted at rest using the Vault transit engine configured
with a default key type of 256-bit AES-GCM.

[RBAC]: https://kubernetes.io/docs/reference/access-authn-authz/rbac/
[NATS]: https://nats.io/
[JWT]: https://jwt.io/
[UXP]: /uxp
