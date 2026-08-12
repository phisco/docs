---
title: Simulate changes to your Control Plane Projects
sidebar_position: 100
description: Use the Up CLI to mock operations before deploying to your environments.
---


:::important
The Simulations feature is in private preview. For more information, [reach out to Upbound][reach-out-to-upbound].
:::

Control plane simulations allow you to preview changes to your resources before
applying them to your control planes. Like a plan or dry-run operation,
simulations expose the impact of updates to compositions or claims without
changing your actual resources.

A control plane simulation creates a temporary copy of your control plane and
returns a preview of the desired changes. The simulation change plan helps you
reduce the risk of unexpected behavior based on your changes.

## Simulation benefits

Control planes are dynamic systems that automatically reconcile resources to
match your desired state. Simulations provide visibility into this
reconciliation process by showing:


* New resources to create
* Existing resources to change
* Existing resources to delete
* How configuration changes propagate through the system

These insights are crucial when planning complex changes or upgrading Crossplane
packages.

## Requirements

Simulations are available to select customers on Upbound Cloud with Team
Tier or higher. For more information, [reach out to Upbound][reach-out-to-upbound-1].

## How to simulate your control planes

Before you start a simulation, build your project and use the `up
project run` command to run your control plane.

Use the `up project simulate` command with your control plane name to start the
simulation:

```ini {copy-lines="all"}
up project simulate <your_control_plane_name> --complete-after=60s --terminate-on-finish
```

The `complete-after` flag determines how long to run the simulation before it completes and calculates the results. Depending on the change, a simulation may not complete within your defined interval leaving unaffected resources as `unchanged`. 

The `terminate-on-finish` flag terminates the simulation after the time
you set - deleting the control plane that ran the simulation.

At the end of your simulation, your CLI returns:
* A summary of the resources created, modified, or deleted
* Diffs for each resource affected

## View your simulation in the Upbound Console
You can also view your simulation results in the Upbound Console:

1. Navigate to your base control plane in the Upbound Console
2. Select the "Simulations" tab in the menu
3. Select a simulation object for a change list of all
   resources affected.

The Console provides visual indications of changes:

- Created Resources: Marked with green
- Modified Resources: Marked with yellow
- Deleted Resources: Marked with red
- Unchanged Resources: Displayed in gray

![Upbound Console Simulation](/img/simulations.png)

## Considerations 

Simulations is a **private preview** feature. 

Be aware of the following limitations:

- Simulations can't predict the exact behavior of external systems due to the
    complexity and non-deterministic reconciliation pattern in Crossplane.

- The only completion criteria for a simulation is time. Your simulation may not
    receive a conclusive result within that interval. Upbound recommends the
    default `60s` value.

- Providers don't run in simulations. Simulations can't compose resources that
    rely on the status of Managed Resources.


The Upbound team is working to improve these limitations. Your feedback is always appreciated.

## Next steps

For more information, follow the [tutorial][tutorial] on Simulations.


[tutorial]: /manuals/cli/howtos/simulations
[reach-out-to-upbound]: https://www.upbound.io/contact-us
[reach-out-to-upbound-1]: https://www.upbound.io/contact-us
