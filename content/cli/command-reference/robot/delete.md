---
title: "up robot delete"
---

Delete a robot account with `up robot delete`.

<!-- vale gitlab.SubstitutionWarning = NO-->
<!-- don't flag an error on shortcode information argument -->
{{< hint type="info" >}}
<!-- vale gitlab.SubstitutionWarning = YES-->
The Upbound Cloud Platform requires authentication to an organization with [`up login -a`]({{<ref "login" >}}) before using `up robot delete`.
{{< /hint >}}

### `up robot delete`

#### Arguments
* `<robot name>` _(required)_ - name of the robot
  
Delete the robot with the given name. Any associated robot tokens are also deleted. 

#### Examples
```shell
up robot delete my-robot
Are you sure you want to delete this robot? [y/n]: y
Deleting robot my-org/my-robot. This cannot be undone.
my-org/my-robot deleted
```