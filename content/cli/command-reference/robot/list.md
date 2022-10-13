---
title: "up robot list"
---

List all robot accounts in an organization with `up robot delete`.

<!-- vale gitlab.SubstitutionWarning = NO-->
<!-- don't flag an error on shortcode information argument -->
{{< hint type="info" >}}
<!-- vale gitlab.SubstitutionWarning = YES-->
The Upbound Cloud Platform requires authentication to an organization with [`up login -a`]({{<ref "login" >}}) before using `up robot list`.
{{< /hint >}}

### `up robot list`

#### Arguments
_None_
  
Lists all robots within an organization.

```shell
up robot list
NAME              ID                                     DESCRIPTION   CREATED
my-robot          3f76eec5-b7e0-4f6e-aeec-8adbec2c44a6                 28m
```