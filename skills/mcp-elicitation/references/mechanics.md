---
description: Detailed explanation of MCP mid-call interaction mechanics (input required, progress, cancellation, client setup, and autocomplete).
metadata:
  tags: [mcp, mechanics, input-required, autocomplete]
  source: internal
---

# MCP Elicitation Mechanics

## 1. Legacy vs. Modern Interaction Era

Modern 2026-era connections use stateless, multi-round return patterns rather than blocking the execution thread. The SDK transparently handles legacy clients if `inputRequired.legacyShim` is enabled (default `true`).

| Feature  | Legacy (2025)                    | Modern (2026)               |
| :------- | :------------------------------- | :-------------------------- |
| Ask User | `await ctx.mcpReq.elicitInput()` | `return inputRequired(...)` |
| Progress | `ctx.mcpReq.notify(...)`         | `ctx.mcpReq.notify(...)`    |
| Cancel   | `ctx.mcpReq.signal`              | `ctx.mcpReq.signal`         |

## 2. Asking for Input: `input_required` (Modern)

Instead of blocking mid-call, the handler returns `inputRequired(...)` and the client re-runs the entire call from the top once the user answers.

- **Check Responses First**: Check `ctx.mcpReq.inputResponses` before prompting. The handler re-runs from scratch, so answered fields must not be re-requested.
- **Request Formats**: Build requests with `inputRequired.elicit()` (form fields), `inputRequired.elicitUrl()` (URL redirection), `inputRequired.createMessage()` (stateless replacement for legacy sampling — ask the client's model to complete a prompt), or `inputRequired.listRoots()` (stateless replacement for legacy roots — ask the client for its workspace paths).
- **Read Answers**: Read using `acceptedContent(ctx.mcpReq.inputResponses, key, schema)`, which returns `undefined` if missing, declined, or cancelled.
- **Check Refusals**: Use `inputResponse(ctx.mcpReq.inputResponses, key)` to inspect action states (`accept`, `decline`, `cancel`) and prevent infinite prompting loops.

## 3. Legacy Elicitation (`elicitInput`)

The blocking `ctx.mcpReq.elicitInput()` API pauses handler execution until the client responds. **This throws on modern 2026-era connections.**

- Requires the client to support the `elicitation` capability.
- **Form Mode**: Used for standard inputs. NEVER request secrets (credentials, API keys) via forms.
- **URL Mode**: Redirects the user outside the chat (e.g. for OAuth login).

## 4. Progress Notifications

Call `ctx.mcpReq.notify(...)` with a `notifications/progress` message keyed on `progressToken`. The `progress` value must strictly increase across updates for the same token.

## 5. Client-Side Setup

Clients must register the `elicitation/create` handler at construction. Configure `inputRequired: { maxRounds }` to set a boundary on how many round trips auto-fulfillment attempts before failing.

## 6. Prompt Autocompletion (`completable`)

While `input_required` handles mid-call interaction, gathering prompt arguments beforehand uses `completable` schemas. Use the `completable` wrapper on Zod schemas to register autocomplete suggestion handlers.
