---
title: "Permissions Model"
metaTitle: "Permissions Model"
metaDescription: "Permissions Model"
rank: 44
---

This page describes the different types of permissions and access rights Upbound
customers can setup in organizations on Upbound Cloud. Broad permissions are
managed at the organization scope, while fine-grained access to control planes
and repositories is managed via teams.

## Permission Types

Users in an organization are given one of two distinct roles:

- `Administrator`: Administrators have full management access to the
  organization, meaning that they can:
  - Create, update, and delete any control plane.
  - Create, update, and delete any repository.
  - Invite new organization members and remove existing ones.
  - Create, update, and delete team members and permissions.
  - View and manage organization settings.
- `Member`: Members are able to access the organization, but all additional
  permissions must be given via teams.

Organization administrators may create teams, and add users and robot accounts
to those teams. User accounts are added to a team with one of the following
roles:

- `Owner`: Owners can add and removes members of the team, and are given all
  permissions allocated to the team.
- `Member`: Members are given all permissions allocated to the team. 

Robot accounts are considered members of a team and cannot be given owner
access.

Teams are used to govern permissions to individual control planes and
repositories in an organization:

- **Control Planes**: Permissions on control planes grant users create, update,
  delete, or view rights to them. For information on how Upbound uses these
  permissions and impersonates actions, see our [security documentation].
- **Repositories**: Repositories in Upbound are what power Upbound Marketplace
  listings. To list something publicly or privately in Upbound Marketplace,
  users need to create a Repository and [push a package] to it first.

Organization administrators may allocate control plane permissions to all
members of a team by adding one of the following roles for each control plane:

* `Viewer`: Viewers may view and connect to the control plane, but are limited
  by [RBAC] to 'view-only' operations. A viewer may see what resources are
  managed by the control plane, but may not create, update, or delete resources.
* `Editor`: Editors may view and connect to control planes, and are granted full
  access to operate on Crossplane resources.
* `Owner`: Owners are granted the same level of access to a control plane as
  editors, but may also edit and delete the control plane itself.

Likewise, organization administrators can also allocate permissions for each
repository:

- `Admin`: Users and robot accounts in teams with admin permissions can push to,
  rename, and delete packages in the specified repository. Admins can also
  delete or rename the repository as well as set it to public or private.
- `Write`: Users and robot accounts in teams with write permissions can push
  packages to the specified repository. These packages will update the Registry
  listing generated from the repository.
- `Read`: Users and robot accounts in teams with read permission can consume the
  packages in the repository. They will be able to view the private listing
  generated from the repository when browsing the Upbound Registry if the
  repository is set as private.

<!-- Links -->
[security documentation]: ../security
[push a package]: ../../upbound-marketplace/publishing-a-listing
