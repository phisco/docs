---
title: "up alpha controlplane"
---

_Alias_: `up alpha ctp`

Use commands under `controlplane` to interact with managed control planes hosted in the Upbound Cloud Platform.  

{{<hint type="warning" >}}
This command set is different than [`up controlplane`]({{<ref "../controlplane" >}}).  
`up alpha controlplane` is for interacting with Upbound hosted control planes.
{{< /hint >}}

- [`up alpha controlplane create`](#up-alpha-controlplane-create)
- [`up alpha controlplane delete`](#up-alpha-controlplane-delete)
- [`up alpha controlplane list`](#up-alpha-controlplane-list)

### `up alpha controlplane create`

<!-- omit in toc -->
#### Arguments
* `<control plane name>` _(required)_ - name of the control plane to create.

Creates a managed control plane in the Upbound Cloud Platform.  

<!-- vale gitlab.SubstitutionWarning = NO-->
<!-- don't flag an error on shortcode information argument -->
{{< hint type="info" >}}
<!-- vale gitlab.SubstitutionWarning = YES-->
The Upbound Cloud Platform requires authentication with [`up login`]({{<ref "login" >}}) before using `up alpha controlplane`.
{{< /hint >}}


<!-- omit in toc -->
#### Example 
```shell
up alpha controlplane create my-controlplane
```

### `up alpha controlplane delete`

<!-- omit in toc -->
#### Arguments
- `<control plane ID>` _(required)_ - ID of the control plane to delete.

Deletes a managed control plane from the Upbound Cloud Platform.

<!-- vale gitlab.SubstitutionWarning = NO -->
<!-- don't flag an error on shortcode information argument -->
{{< hint type="info" >}}
<!-- vale gitlab.SubstitutionWarning = YES -->
The Upbound Cloud Platform requires authentication with [`up login`]({{<ref "login" >}}) before using `up alpha controlplane`.
{{< /hint >}}

<!-- omit in toc -->
#### Example
```shell
up alpha controlplane delete 1d6f3556-85cc-4ccd-936c-7722baad8d45
```

### `up alpha controlplane list`
<!-- omit in toc -->
#### Arguments
- _none_

Lists all managed control planes associated with the user's account.

<!-- vale gitlab.SubstitutionWarning = NO-->
<!-- don't flag an error on shortcode information argument -->
{{< hint type="info" >}}
<!-- vale gitlab.SubstitutionWarning = YES -->
The Upbound Cloud Platform requires authentication with [`up login`]({{<ref "login" >}}) before using `up alpha controlplane`.
{{< /hint >}}

<!-- omit in toc -->
#### Example
```shell
up alpha controlplane list
NAME                                           ID                                     SELF-HOSTED    STATUS
upbound-1d6f3556-85cc-4ccd-936c-7722baad8d45   1d6f3556-85cc-4ccd-936c-7722baad8d45   false          ready
```