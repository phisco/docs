---
title: "up robot"
geekdocCollapseSection: true
geekdocFileTreeSortBy: title
---
Upbound `robots` are identities used for authentication that are independent from a single user and aren't tied to specific usernames or passwords.

Robots have their own authentication credentials and configurable permissions.

{{<hint type="important" >}}
Robot accounts are only supported for [organizations]({{<ref "../organization" >}}).  
User accounts can't create robots.
{{< /hint >}}

### `up robot` commands
|   |   |
| --- | --- | 
| [`up robot create`]({{<ref "create"  >}}) | Creates robot accounts. | 
| [`up robot delete`]({{<ref "delete" >}}) | Deletes robot accounts. | 
| [`up robot list`]({{<ref "list" >}}) | List all robot accounts.  |
| [`up robot token`]({{<ref "token" >}}) | Manage authentication tokens for robot accounts. |

