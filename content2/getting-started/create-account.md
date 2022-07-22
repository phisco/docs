---
title: "Create Account"
metaTitle: "Create Account"
metaDescription: "Create an Upbound Account"
rank: 2
---

Once you have access to Upbound, whether using Upbound Cloud or running your own
Upbound Enterprise instance, you'll need to create an account.

# Accounts Overview

Upbound offers three types of accounts to users: personal, organization, and
robots.

- **Personal**: contains a user's information, settings, and login details. If
  using Upbound Cloud, a user may also create and attach control planes to their
  personal accounts on a trial basis. Upbound Enterprise requires that all
  control planes are attached to an organization account.

- **Organization**: contains groups of users, robots, teams, and control planes.
  Upbound Cloud also offers the ability to create repositories where
  [`Configuration` and `Provider` packages] can be published.

- **Robot**: an automation account scoped to a single organization.

Upbound Cloud allows a single user to be a member of potentially many
organizations. Upbound Enterprise, on the other hand, is made up of a single
organization, and a user must be invited to the organization before they can
register.

# Create Your Personal Account

Every user must start by registering for a personal account. This can be
accomplished by navigating to Upbound Cloud at https://cloud.upbound.io or your
local installation at https://upbound.local.upbound.io.

Upbound Cloud users have the option to register using their email address,
GitHub account, or Google account. If a user chooses to sign up with one, they
may add the other login providers later, and may disable the provider they chose
initially if others have been added.

Upbound Enterprise users must sign up with their email address.

Sign up using your provider of choice by following the prompts.

![Register](../images/cloud-register.png)

# Create an Organization

After signing up for a personal account, you will be prompted to create an
organization. This is an optional step on Upbound Cloud, but is required for the
first user when setting up Upbound Enterprise.

Upbound Cloud users have the option to create an organization when they sign up.
If a user opts not to create an organization, they may choose to do so later.

The first user of an Upbound Enterprise installation _must_ create an
organization. All subsequent users must be invited to that organization in order
to register.

To experience the full capabilities of Upbound, go ahead and create an
organization while registering. 

![Organization](../images/enterprise-org.png)

# Invite a Teammate

Building control planes is all about collaboration. Once you have registered for
your personal account and created an organization, you may invite teammates to
join your organization as either a _Member_ or an _Admin_. The invited user will
receive an email with a link to join the organization. If they do not already
have an account, they will be prompted to register before joining.

![Invite](../images/org-invite.png)

# Login with `up`

If you are using Upbound Enterprise, you installed `up` during setup. If you are
using Upbound Cloud and do not have `up` installed, go ahead and [install] it
now.

Once installed, you can login to your account from the command line:

```bash
# If using Upbound Enterprise, you must set your endpoint.
# Otherwise, do not set this environment variable.
export UP_ENDPOINT=https://api.local.upbound.io

up login
```

# Next Steps

Now that you have your own Upbound account, it's time to start [building your
first control plane]!

<!-- Named Links -->
[`Configuration` and `Provider` packages]: ../../uxp/concepts
[install]: ../../cli
[building your first control plane]: ../build-control-plane
