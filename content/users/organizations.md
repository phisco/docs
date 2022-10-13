---
title: Organizations
draft: True
weight: 45
---

Organizations allow multiple user accounts to share Upbound resources.  

All registered Upbound users have a **user account**.

User accounts can [push packages]({{< ref "/upbound-marketplace/packages" >}}), create [repositories]({{<ref "/cli/command-reference/repository" >}}) and download packages from their own private repository.  

User accounts can create **organizations**. 

{{< hint type="important" >}}
Only paid Upbound subscribers can create more than one organization.
{{< /hint >}}

Organizations can access and create the same resources as user accounts. Only organizations can create **robot accounts** or **teams**. 

| | **Users** | **Organizations** |
| --- | --- | --- |
| Create repositories | **Yes** | **Yes** |
| Push packages | **Yes** | **Yes** |
| Download private packages | **Yes** | **Yes** |
| Download Official Providers | No | **Yes** |
| Create Robot accounts | No | **Yes** | 
| Create Teams | No | **Yes** |

A user account may belong to multiple organizations. Each organization creates their own permissions for the user account's access.

## Creating an organization
Create an organization with the [Up command-line]({{<ref "cli">}}).  
Use the command [`up organization create <organization name>`]({{<ref "cli/command-reference/organization#up-organization-create" >}}) to create a new organization.

```shell
up org create my-org
```

## User roles
Users in an organization are **Admins** or **Members**.

**Admins** can view and change all repositories, teams, members and robots.  
**Members** can only view resources admins grant access to.  

Admins can change a user's role in the _Users_ settings. Select the user, _Edit_ and _Role_.

![Modifying a user's role](/users/images/user-role-change.png "User role change")

## Robot accounts
Robot accounts are non-user accounts with unique credentials and permissions. Organization _admins_ grant robot accounts access to individual repositories. Robot accounts access the repositories without using credentials tied to an individual user. 

{{< hint type="warning" >}}
Upbound strongly recommends using robot accounts for any Kubernetes related authentication. For example, providing secrets required to install Kubernetes manifests. 

Only use user accounts with the Up command-line or [Upbound Cloud](https://cloud.upbound.io/).
{{< /hint >}}

Create robot accounts with the [`up robot create`]({{<ref "cli/command-reference/robot/create" >}}) command.

Robot accounts use a _robot token_ to authenticate. Create a _robot token_ with [`up robot token create`]({{<ref "/cli/command-reference/robot/token#up-robot-token-create" >}}).

{{< hint type="important" >}}
Only robot accounts can download and install [Upbound Official Providers]({{<ref "upbound-marketplace/providers" >}}).
{{< /hint >}}

## Teams
Teams provide a more fine-grained permissions controls for users and robots accessing repositories.

Admins assign members to teams. Admins set access levels for repositories and robots per-team.

Users can be members of more than one organization and more than one team inside an organization.

The following illustrates a user that's a member of two different organizations and multiple teams. 
![A user in multiple groups and multiple organizations.](/users/images/user-org-team.png "A user can be in multiple orgs and multiple groups")
<!-- vale Upbound.Spelling = NO -->
<!-- ignore "Lando" -->
The user _Lando_ has a unique _user account_.  
Lando is a member of both _Organization-1_ and _Organization-2_.  
Inside _Organization-1_, Lando belongs to _Team-A_ and _Team-B_.  
Lando is only a member of _Team-Y_ inside _Organization-2_.
<!-- vale Upbound.Spelling = YES -->


### Repository permissions
<!-- vale Google.WordList = NO -->
<!-- wordlist will flag "admin". In this case the label is "admin" -->
Teams can set repository permissions as **read**, **write** or **admin**.
<!-- vale Google.WordList = YES -->

**Read** permissions allow members to view or access packages in the repository.  
**Write** permissions allow members to push packages and updates to the repository.   
**Admin** permissions allow members to push packages and updates to the repository and delete the repository.

