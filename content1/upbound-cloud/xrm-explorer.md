---
title: "XRM Explorer"
metaTitle: "XRM Explorer"
metaDescription: "XRM Explorer"
rank: 43
---

[UXP] extends the Kubernetes control plane with a diverse set of vendors,
resources, and abstractions. To enable a single consistent API across all of
them, it exposes the Crossplane Resource Model (XRM), which extends the
Kubernetes Resource Model (KRM) in an opinionated way, resulting in a universal
experience for managing resources, regardless of where they reside.

When interacting with the XRM, things like credentials, workload identity,
connection secrets, status conditions, deletion policies, and references to
other resources work the same no matter what provider or level of abstraction
they are a part of.

Upbound's management console contains a rich experience to interact with and
gain insight from the XRM, which we call the XRM Explorer. Let's learn more
about how to use it!

## Exploring Types

From your list of control planes, simply click one of them to be taken into the
XRM Explorer. At this high level view, we can see all of the types that have
been installed into your control plane via providers and configurations. We can
even search for types to more easily find the one we are looking for.

The type browser will display both composed resource types as well as the
managed resources they are made of.

![Exploring Types](../images/upbound/xrm-explorer-types.gif)

### Favorites

To make navigation easier to the types that matter most to you, you can mark
types as "favorites". Doing so will cause the type to appear in the navigation
for quick access later on. This essentially enables you to build out your own
custom console of the types that you use frequently.

![Favoriting](../images/upbound/xrm-explorer-favorites.gif)

## Creating Resources

After you've identified some resource types of interest, you can create
instances of them directly in the UI of the XRM Explorer. On a resource type
page, simply click the "Create New" button in the top right corner of the page.

You can also always create instances of any resource from the command line by
[connecting] to your control plane and using `kubectl` or GitOps workflows.

## Exploring Resources

In addition to exploring the available types in your control plane, you can also
explore instances of them to gain even deeper insight into the infrastructure
resources that your organization has provisioned. After clicking on a particular
resource, more details about it will be displayed on the right side of the page.
You will be able to see the status conditions of the resource as well as all
events that have occurred for it.

If the given resource is a composite resource, then all of the resources that
compose it will be displayed, along with their individual status. Clicking these
composed resources will take you to the details page for them as well,
effectively enabling you to navigate through your composite resource hierarchies
and explore their status and relationships in real time.

![Exploring Resources](../images/upbound/xrm-explorer-resources.gif)

<!-- Links -->
[UXP]: ../../uxp
[connecting]: ../connecting-to-control-planes
