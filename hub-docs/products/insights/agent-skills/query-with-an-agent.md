---
title: Query your fleet with an agent
sidebar_position: 2
description: Install the upbound-hub skill, sign in to Hub, and ask a coding agent questions about the resources running across your fleet.
---

This guide walks through asking a coding agent about your fleet: installing the
`upbound-hub` skill, letting it sign you in, asking a first question and
checking that the answer came from where you think it did.

:::note
The steps use Claude Code, the supported agent today. See [Supported
agents](overview.md#supported-agents) for the state of the others.
:::

## Prerequisites

- Claude Code, and the tools the skill's scripts call: `bash`, `curl`, `jq`,
  `column` and `shasum`
- The base URL clients use to reach `hub-core`, the same value as
  `hub-core.api.externalURL`
- An account with read access to at least one realm. See [Access and
  authorization](../../../iam/access-management/overview.md)
- At least one [connected control plane](../../../howtos/connect-control-plane.md),
  or the answers have nothing to report on

## Step 1: Install the skill

1. Register the marketplace and install the plugin.

   ```text
   /plugin marketplace add upbound/skills
   /plugin install upbound@upbound
   ```

2. Confirm the agent picked up the skill.

   Ask it what skills it has available. `upbound-hub` should appear, described
   as the skill for querying and mutating Upbound Hub.

## Step 2: Point the skill at your Hub

The skill sets itself up the first time you ask it a fleet question. It installs
its credential helper, checks the download against a published SHA-256 and signs
you in, so there's no setup command for you to run. All it needs from you is the
endpoint and a browser.

1. Ask an ordinary question to trigger setup.

   > How many resources are unhealthy across the fleet?

2. Give the agent your Hub API endpoint when it asks.

   The skill has nowhere to discover this on its own, so it asks. It saves the
   value to `${XDG_CONFIG_HOME:-~/.config}/upbound/hub.env` and doesn't
   ask again on this machine.

3. Complete the sign-in in your browser.

   The setup script opens a browser window. Finish the sign-in there and the
   agent carries on with your question. The credential lasts about 90 days.

## Step 3: Read the first answer

Fleet health is the question agents get wrong most often, which makes the first
answer a good test of whether the skill loaded. A correct one separates three
figures rather than collapsing them into a single percentage:

| Figure | What it counts |
|---|---|
| Assessable | Resources reporting `Ready` explicitly, either `True` or `False` |
| Failing | Resources where `Ready` is explicitly `False` |
| Not reporting | Resources carrying no conditions, or reporting `Unknown` |

Most records in a fleet fall in that last row, so an "X% unhealthy" figure
divides by a denominator that doesn't mean anything. If your agent answers
with one percentage it isn't using the skill, so check that the plugin installed
and that `upbound-hub` loaded for the question you asked.

A fleet-wide answer counts `Ready` alone, because the aggregation endpoint counts
each condition on its own axis and a resource can fail more than one, so the
counters overlap and you can't add them up. A per-control-plane answer does treat
`Synced` or `Healthy` being `False` as failing, so the two scopes report different
totals. Ask which one a number uses.

`Unknown` isn't a failure. It's the normal state for the whole window a managed resource takes to come up, and `Synced=False` with a
reason of `ReconcilePaused` means someone chose to pause the resource.

## Step 4: Narrow the question

The conversation carries context, so follow up in your own words rather than
restating the whole question. Questions the skill handles well:

> List the control planes and group them by phase.
>
> List the unhealthy resources in `prod-1`, with the reason for each.
>
> What CRDs and XRDs exist for AWS?
>
> What changed in the last hour?

Name the control plane, realm or kind you care about, because a question with no
scope leaves the agent to choose one for you. Ask for the reason alongside the
count: condition messages are filterable, so the same question that returns a
count of three can tell you which three and why.

## Step 5: Check what the agent ran

The agent reports what it found without showing how it got there, so an answer
you plan to act on is worth a second look.

1. Ask the agent to show its work.

   > What endpoint did you call to get that?

   It should name a script or a Hub API path. That tells you the scope it
   queried, which is where a plausible wrong answer usually originates.

2. Reproduce the query yourself when the answer matters.

   The same data comes straight from the API. See [Query your
   fleet](../resource-exploration/query.md) for the endpoints and the CEL filter
   syntax.

3. Check the age of the data before trusting an absence.

   Hub's view lags its sources, so a resource created moments ago may not appear
   yet. Each `resources` record carries `hub.lastSyncTime`, and the agent should
   check it against the clock before telling you something doesn't exist. Hub's
   own objects, such as control planes, spaces and realms, carry no such
   freshness field.

## Step 6: Know where querying stops

Every step so far reads. Hub serves the fleet resources Insights aggregates as
read-only, so asking the agent to fix a failing resource gets you a diagnosis
rather than a change, and making the change means working in the control plane
that owns the resource.

Hub's own objects are a different matter. The skill can create and delete control
planes, realms, spaces and lenses, and update control planes and lenses. Neither
`realms` nor `spaces` has an `update` verb. [What the agent can
change](overview.md#what-the-agent-can-change) covers that along with the
permissions and quirks that come with each.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| The agent asks for a Hub API endpoint | The skill has no endpoint for this machine yet. Give it the base URL of `hub-core`. It asks once. |
| Sign-in opens again, or calls start failing after about 90 days | The credential expired. Complete the browser sign-in and the agent continues. |
| Certificate or TLS verification errors | Your system trust store doesn't include Hub's CA. Set `HUB_CA_FILE` to a PEM bundle. Don't reach for `HUB_INSECURE=1`. |
| A resource you just created doesn't appear | Hub hasn't synced it yet. Check `hub.lastSyncTime` and ask again. |
| A count stops at 1000 | The agent paged a list to count instead of using the aggregation endpoint. Ask which endpoint it called. |
| Type definitions and resource stats report different totals for the same thing | Type definitions and resource stats disagree by design, partly because composition fans one logical resource out into several records. Ask for both numbers. |

## See also

- [Agent skills](overview.md)
- [Query your fleet](../resource-exploration/query.md)
- [Resource filtering](../resource-exploration/overview.md)
- [Insights](../overview.md)
