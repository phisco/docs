---
title: "Security"
metaTitle: "Security"
metaDescription: "Security"
rank: 59
---

## Organization Administration

Upbound Enterprise is a single-tenant product, meaning that there is only one
organization, and all users must be members of it. The first user that signs up
after installing Upbound Enterprise must create the organization during the sign
up process. This user is automatically made an administrator of the organization
and may invite subsequent users as either administrators or members.

Administrators are also able to remove any user at any time, which will cause
that user to have their permissions revoked and be unable to login to the
platform. Administrators may not remove themselves from the organization;
another administrator must remove them from the organization, ensuring that the
org always has at least one administrator.

A user may be re-added to the org by sending them another invite. They will be
able to login and will not be required to register again.

## Domain Restrictions

Upbound Enterprise requires all users to sign up with an email address that
contains one of the allowed domains [configured] in
`global.registerEmailDomains`. This requirement is imposed on the first user and
all subsequent users they invite to the platform.

## Authentication Mechanisms

Upbound Enterprise currently supports authentication using email and password,
but additional methods will be supported in the future. The first user that
signs up will be required to verify their email address using a PIN that they
are sent during registration. When subsequent users are invited to the platform,
the unique link they receive via email serves as verification during
registration. Users must sign up using the email address that their invite was
sent to.

## Data Storage

- MySQL 
  - Upbound Enterprise stores all user, team, and organization data as well as
    information about connected control planes in a MySQL database. User data
    includes sensitive information, such as email addresses and password hashes,
    so appropriate security measures should be taken to restrict access.
- Redis
  - Redis is used by Upbound Enterprise to store auto-expiring session
    information for authenticated users.

<!-- Named Links -->
[configured]: ../globals#configure-allowed-registration-domains