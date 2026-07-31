---
title: Start a troubleshooting session
sidebar_position: 3
description: Create a session, ask about a failing resource, and read the streamed reply.
draft: true
---

This guide walks through one use case: a composite resource somewhere in the
fleet isn't becoming `Ready`, and you want to find it and understand why without
knowing which control plane it's on.

## Before you start
<!-- vale write-good.Passive = NO -->
- [Enable agent sessions](../../../reference/feature-flags.md) and confirm the API group responds.
- An account in an organization admin group. No other role is granted the
  session resources.
<!-- vale write-good.Passive = YES -->

The examples use two shell variables. Set `HUB_URL` to the base URL clients use
to reach `hub-core`, the same value as `hub-core.api.externalURL`:

```shell
HUB_URL=https://api.<your-domain>
```

`TOKEN` is a **hub** token, not the token your identity provider issued.
`hub-core` rejects an IdP access or ID token presented directly with a `401`.
Exchange the IdP token for a hub token first, using the [RFC
8693](https://datatracker.ietf.org/doc/html/rfc8693) endpoint:

```shell
TOKEN=$(curl -sS -X POST \
  "$HUB_URL/apis/tokenexchange.hub.upbound.io/v1alpha1/tokenexchangerequests" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:token-exchange" \
  -d "subject_token=$IDP_TOKEN" \
  -d "subject_token_type=urn:ietf:params:oauth:token-type:jwt" \
  -d "scope=upbound:org:default" | jq -r .access_token)
```

`$IDP_TOKEN` is an access token for the identity provider you registered with
Hub, given by your provider. Hub tokens are short-lived, so
repeat the exchange when calls start returning `401`.

`scope` names the organization. A self-hosted Hub is a single organization named
`default`. See [Access and authorization](../../../howtos/rbac.md).

## Step 1: Create a session

Post a `Session`. The `Session` spec contains only the `title` field and Hub assigns the name:

```shell
SESSION=$(curl -sS "$HUB_URL/apis/agent.hub.upbound.io/v1alpha1/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "apiVersion": "agent.hub.upbound.io/v1alpha1",
        "kind": "Session",
        "spec": {"title": "Composites stuck not ready"}
      }' | jq -r '.metadata.name')

echo "$SESSION"
```

The name looks like `ses_2f9k...`. Hub ignores a name you set yourself, so read
it back from the response rather than choosing one.

## Step 2: Ask a question

Post to the `messages` subresource. The reply streams back on the same request
as server-sent events, so pass `-N` to stop curl buffering it:

```shell
curl -sSN "$HUB_URL/apis/agent.hub.upbound.io/v1alpha1/sessions/$SESSION/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Which composite resources are not ready across the fleet, and what is the most common reason?"}'
```

Each frame is a `data:` line holding one JSON event, and the stream ends with a
literal `data: [DONE]`:

```text
data: {"type":"tool_call","content":"{\"tool\":\"query_resources\",\"arguments\":{\"crossplaneType\":\"xr\",\"ready\":false}}"}

data: {"type":"tool_result","content":"..."}

data: {"type":"text_delta","content":"Three composites"}

data: {"type":"text_delta","content":" are not ready."}

data: [DONE]
```

| Event `type` | Meaning |
| --- | --- |
| `message` | A complete message. |
| `text_delta` | One chunk of the reply. Concatenate these in order. |
| `tool_call` | The agent called a tool. `content` holds `{"tool": ..., "arguments": ...}`. |
| `tool_result` | What the tool returned. |
| `error` | The turn failed. The reply ends here. |

The `tool_call` events are worth reading. They show which query the agent ran,
which tells you whether it looked where you meant.

## Step 3: Narrow the conversation

Sessions are stateful, so the next message continues the same thread. Post again
to the same session and refer to the earlier answer:

```shell
curl -sSN "$HUB_URL/apis/agent.hub.upbound.io/v1alpha1/sessions/$SESSION/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Show me the full object for the first one, and explain the Synced condition."}'
```

The agent calls `get_resource` for that resource and answers from the full
Kubernetes object.

## Step 4: Read the history

A get returns the conversation in `status.messages`:

```shell
curl -sS "$HUB_URL/apis/agent.hub.upbound.io/v1alpha1/sessions/$SESSION" \
  -H "Authorization: Bearer $TOKEN" | jq '.status.messages'
```

Each entry has a `role` of `user`, `assistant`, or `tool`, a `timestamp`, and
either `content` or `toolCalls`.

Listing sessions omits the messages for performance, so use a get when you want
the transcript:

```shell
curl -sS "$HUB_URL/apis/agent.hub.upbound.io/v1alpha1/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.items[] | "\(.metadata.name)\t\(.spec.title)"'
```

## Step 5: Clean up

Rename a session with a `PUT`, which updates the title and nothing else, or
delete it:

```shell
curl -sS -X DELETE \
  "$HUB_URL/apis/agent.hub.upbound.io/v1alpha1/sessions/$SESSION" \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

<!-- vale alex.Race = NO -->
| Symptom | Cause |
| --- | --- |
| `404` on the messages endpoint | The session doesn't exist, or it belongs to another user. Sessions are private to their creator, and posting a message never creates one. Create the session first. |
| `400 content is required` | The body was empty or only whitespace. |
| `401` | No authenticated user on the request. |
| One `error` event, then the stream ends | The turn failed. An invalid Anthropic API key surfaces here rather than at startup. |
| `agent produced no response` | The agent returned no events at all. Check the `hub-core` logs and that the Anthropic API is reachable from the `hub-core` namespace. |
| The reply stops mid-thought after 30 seconds | A tool call hit its 30 second timeout. |
<!-- vale alex.Race = YES -->

## See also

- [Agent sessions overview](overview.md)
- [Filtering resource lists](../resource-exploration/filtering-resources.md), which
  uses the same query surface the agent's `query_resources` tool calls.
