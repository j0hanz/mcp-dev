---
name: mcp-elicitation
description: Use when an MCP tool call needs mid-call interaction with the user (eliciting input, confirming before acting, reporting progress, cancellation) or when providing prompt argument autocompletion (completable) in the TypeScript SDK v2.
user-invocable: false
metadata:
  category: technique
  triggers: input elicitation, progress reporting, client-side cancellation, user interaction, cancel tool, prompt autocomplete, completable, inputRequired
---

# MCP Elicitation (TypeScript SDK v2)

Covers mid-call communication between server and user: asking for input, reporting progress, and cancellation.

```
handler -> return inputRequired(...) -> client asks the user -> handler re-runs -> acceptedContent(answer)
```

## When to Use

- An MCP tool call needs mid-call interaction with the user (eliciting input, confirming before acting).
- Reporting long-running progress or checking for cancellation mid-call.
- Implementing client-side registration for elicitation or sampling handlers.
- This skill is typically loaded as part of the interaction workflow from `/mcp-server-build` or `/mcp-client-build`.

## How It Works

### 1. Legacy vs. modern

Write handlers against the modern surface (`input_required`); the SDK negotiates the era per connection and serves legacy (2025-era) clients transparently — `inputRequired.legacyShim` (a server option, default `true`) pushes real `elicitation/create` requests and re-enters the handler.

| Need            | Legacy (2025)                    | Modern (2026)                        |
| --------------- | -------------------------------- | ------------------------------------ |
| Ask the user    | `await ctx.mcpReq.elicitInput()` | `return inputRequired(...)`          |
| Report progress | `ctx.mcpReq.notify(...)`         | `ctx.mcpReq.notify(...)` (unchanged) |
| Cancel          | `ctx.mcpReq.signal`              | `ctx.mcpReq.signal` (unchanged)      |

### 2. Asking for input: `input_required` (modern)

Instead of blocking on a mid-call round trip, the handler returns `inputRequired(...)` and the whole call re-runs from the top once the user answers — with the answer available via `acceptedContent`.

- Check `ctx.mcpReq.inputResponses` for an answer before asking — only request what's still missing (the handler re-runs from scratch, so already-answered fields shouldn't re-prompt).
- Build requests with `inputRequired.elicit()` (form) or `inputRequired.elicitUrl()` (redirect to a URL).
- Read answers with `acceptedContent(ctx.mcpReq.inputResponses, key, schema)` — it returns `undefined` for missing, declined, and cancelled alike.
- To tell a refusal from a first entry, use `inputResponse(ctx.mcpReq.inputResponses, key)` — a discriminated view (`missing` / `elicit` / `sampling` / `roots`) — and stop re-prompting on a non-accept:

```ts
const view = inputResponse(ctx.mcpReq.inputResponses, 'confirm');
if (view.kind === 'elicit' && view.action !== 'accept') {
  return {
    content: [{ type: 'text', text: 'Cancelled by the operator' }],
    isError: true,
  };
}
```

### 3. Asking for input: elicitation (legacy)

`ctx.mcpReq.elicitInput()` blocks the handler until the client responds. **Throws on 2026-era connections** — new code should use `input_required` instead.

- Requires the client's `elicitation` capability for the mode used; without it, `elicitInput` throws before the wire and surfaces as an `isError` result.
- `mode: 'form'` — never request secrets (passwords, payment details) through a form.
- `mode: 'url'` — send the user to a page outside the chat (e.g. an OAuth login).

```ts
const result = await ctx.mcpReq.elicitInput({
  mode: 'url',
  message: 'Sign in to link your account',
  url: 'https://billing.example.com/connect/provider',
  elicitationId: '12345',
});
```

### 4. Progress

Call `ctx.mcpReq.notify(...)` with a `notifications/progress` message keyed on `progressToken`. `progress` must strictly increase across calls for the same token.

### 5. Cancellation

Check `ctx.mcpReq.signal.aborted` inside any loop and return promptly; forward the signal to `fetch`/child calls so they abort too.

```ts
async ({ pages }, ctx) => {
  for (let page = 0; page < pages; page++) {
    if (ctx.mcpReq.signal.aborted) break;
    await scanPage(page, { signal: ctx.mcpReq.signal });
  }
};
```

### 6. Client setup

Register the `elicitation/create` handler once at client construction. Set `inputRequired: { maxRounds }` to bound how many round trips auto-fulfillment will attempt before giving up.

### 7. Deprecated

The 2025 push-style server-to-client request model is deprecated (SEP-2577) and replaced by `input_required` results or other alternatives in the 2026-07-28 protocol:

- **Sampling** (`requestSampling`): Call the LLM provider directly instead.
- **Roots** (`listRoots` / `requestRoots`): Migrate to passing paths via tool parameters, resource URIs, configuration, or use `inputRequired` (multi-round-trip).
- **Logging** (`ctx.mcpReq.log`): Migrate to stderr logging (STDIO servers) or OpenTelemetry.

See `references/advanced-interaction-patterns.md`.

### 8. Prompt Autocompletion (Completable)

While `input_required` is for mid-call tool interaction, gathering prompt arguments interactively before the call can use `completable` schemas:

```ts
import { completable } from '@modelcontextprotocol/server';
import { z } from 'zod';

server.registerPrompt(
  'review-code',
  {
    title: 'Code Review',
    argsSchema: z.object({
      language: completable(z.string().describe('Programming language'), (value) =>
        ['typescript', 'javascript', 'python', 'rust', 'go'].filter((lang) =>
          lang.startsWith(value),
        ),
      ),
    }),
  },
  ({ language }) => ({/* ... */}),
);
```

## Examples

Code implementation examples are located in:

- `input_required` return, form elicitation, progress, client-side: [references/examples.md](references/examples.md)
- Cross-round state management with `requestState`: [references/advanced-interaction-patterns.md](references/advanced-interaction-patterns.md)

## Common Mistakes

- Using blocking `ctx.mcpReq.elicitInput()` on 2026-era connections, which will throw (use `input_required` instead).
- Requesting secrets (passwords, payment details) via the insecure `mode: 'form'` elicitation.
- Continuing tool execution after `ctx.mcpReq.signal.aborted` is true.
- Relying on deprecated features like sampling (`requestSampling`), listRoots/requestRoots, or MCP logging (`ctx.mcpReq.log`).
- Forgetting to use `completable` when prompt arguments require dynamic autocomplete suggestions.
