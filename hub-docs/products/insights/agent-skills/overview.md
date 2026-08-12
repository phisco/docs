---
title: Agent skills
sidebar_position: 1
description: Install the upbound-hub Agent Skill so your coding agent answers questions about your fleet from Hub's API instead of guessing.
---

An [Agent Skill](https://agentskills.io/) is a set of instructions a coding agent
loads when a task matches it. Upbound publishes skills for the Upbound Platform
in [upbound/skills](https://github.com/upbound/skills), where `upbound-hub`
teaches an agent to work with Hub: how to query control planes, spaces, realms,
types, packages, resources, identity providers and the image catalog, and how to
avoid the handful of quirks that turn a reasonable query into a wrong answer.

The skill installs on your local machine, not your Hub cluster. It doesn't
require a feature gate to enable or additional configuration. Once the plugin is in
place you ask your agent an ordinary question about the fleet's health, and it
signs itself in and answers from your fleet instead of from a guess.

## Why an agent needs a skill

Hub presents a Kubernetes-shaped API, so an agent treats it like any other
cluster and gets the ordinary questions right. Counting and health are the
exceptions. Hub handles both differently than a Kubernetes cluster does, and an
agent gives you a confident wrong answer.

### Counting

A resource list reports `metadata.total.count`, but that value caps at 1000 and
then sets `relation` to `gt` without saying by how much. An agent that pages the
list to count returns a lower bound and presents it as a fleet total. 

The skill sends counting questions to the aggregation endpoint, which returns an
exact count.

### Health

Most aggregated records carry no conditions at all, and `Ready=Unknown` is the
state a managed resource holds for the whole window it takes to come up. Divide
failing resources by the fleet total and the result looks precise but is
meaningless. 

The skill has the agent report three numbers instead: how many resources are
assessable, how many explicitly fail and how many never reported.

## Install

Add the marketplace, then install the plugin:

```text
/plugin marketplace add upbound/skills
/plugin install upbound@upbound
```

The first command registers Upbound as a plugin source and the second installs
the skills it publishes.

To try the skill without installing it, clone the repository and point your agent
at the working copy:

```shell
git clone https://github.com/upbound/skills upbound-skills
claude --plugin-dir upbound-skills
```

## Supported agents

Claude Code is the supported agent today, and Upbound plans to add others. The
skills carry no vendor-specific front matter, so copying `skills/upbound-hub/`
into another agent's skills directory should load it. Upbound doesn't test that
path though, and the scripts assume `bash`, `curl`, `jq` and `column`.

## Prerequisites

The skill's scripts call `bash`, `curl`, `jq`, `column` and `shasum`, which most
developer machines already have. Add `kubectl` if you plan to write.
Reads don't need it.

Beyond that you need the base URL clients use to reach `hub-core`, the same value
as `hub-core.api.externalURL`, and a browser for the first sign-in. The skill
asks for the endpoint the first time it runs and saves the answer, so there's
nothing to set up in advance.

## What runs on your machine

:::warning
A skill is a set of instructions your agent follows on your own machine. The
scripts run with your credentials and your network access, and anything they
print reaches the agent's transcript. Read the skill and its scripts before you install them, and see
[SECURITY.md](https://github.com/upbound/skills/blob/main/SECURITY.md) in the
repository.
:::

On its first run the skill downloads a credential helper from
`storage.googleapis.com/upbound-hub-artifacts` and checks it against a published
SHA-256. That checksum shares an origin with the binary, so it catches a
corrupted download rather than a compromised source.

The skill saves your endpoint to `${XDG_CONFIG_HOME:-~/.config}/upbound/hub.env`
and the credential it obtains lasts about 90 days. Set `HUB_API_URL` to override
the saved endpoint for a one-off query against another deployment, and
`HUB_CA_FILE` to a PEM bundle when your system trust store doesn't include Hub's
CA. `HUB_INSECURE=1` disables TLS verification, so don't set it.

## What the agent can see

The agent acts with your Hub token, so it sees the realms your permissions grant
and nothing else. The same question returns different answers for users with 
different access, so account for that before you compare fleet numbers with a
colleague. See [Access and authorization](../../../iam/access-management/overview.md).

## What the agent can change

Hub has two surfaces and only one of them accepts writes.

| Surface | Verbs |
|---|---|
| Hub's own objects: `controlplanes`, `lenses`, `realmrolebindings` and the registration resources | Create, update, delete |
| `realms` and `spaces` | Create, delete. Neither has an `update` verb |
| The fleet resources Insights aggregates: `resources`, `resourcestats`, `resourcerelationships` and `resourcerelationshiptrees` | Read only |

The practical consequence is that you can't change a Crossplane resource through
Hub. Insights indexes what the connectors report, so a managed or composite
resource is a read-only record there, and changing one means talking to the
control plane that owns it. Ask the agent to fix a failing resource and you get a
diagnosis rather than a fix.

Writes that Hub does accept go through `kubectl` against the Hub API. The skill
builds its own kubeconfig pointing at your Hub endpoint, so it ignores the
contexts in your `KUBECONFIG` and you need no cluster access to any control
plane. What it does need is `kubectl` on your `PATH`, network reach to Hub and
Hub permissions for the verb. To keep a `hub` context of your own alongside it,
[Configure kubectl for the Hub](../../../howtos/configure-kubectl.md) sets one up
with the same credential helper.

Hub's differences from a cluster show up here. It serves no `patch` verb, so
`kubectl apply` against an object that already exists returns a `405` and the
skill uses `replace` instead. The missing `update` verb on realms matters more
than it looks: deleting a realm removes the namespace every control plane in it
lives in, so the skill treats realm deletion as something to agree on first
rather than a way to edit one. Before any write it asks
`selfsubjectaccessreviews` whether you're permitted, rather than attempting the
operation to find out.

## Related resources

**How-to guides**

- [Query your fleet with an agent](query-with-an-agent.md)
- [Query your fleet](../resource-exploration/query.md)
- [Access and authorization](../../../iam/access-management/overview.md)

**Linked concepts**

- [Insights](../overview.md)
- [Hub architecture](../../../concepts/architecture.md)
