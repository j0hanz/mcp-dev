---
name: mcp-elicitation
description: Use when an MCP tool call needs mid-call interaction with the user — eliciting input, confirming before acting, reporting progress, cancellation, or sampling in the TypeScript SDK v2.
user-invocable: false
---

# MCP Elicitation (TypeScript SDK v2)

Covers mid-call communication between server and user: asking for input, reporting progress, and cancellation.

```
handler -> return inputRequired(...) -> client asks the user -> handler re-runs -> acceptedContent(answer)
```

## Legacy vs. modern

Write handlers against the modern surface (`input_required`); the SDK negotiates the era per connection and serves legacy (2025-era) clients transparently — `inputRequired.legacyShim` (a server option, default `true`) pushes real `elicitation/create` requests and re-enters the handler.

| Need            | Legacy (2025)                    | Modern (2026)                        |
| --------------- | -------------------------------- | ------------------------------------ |
| Ask the user    | `await ctx.mcpReq.elicitInput()` | `return inputRequired(...)`          |
| Report progress | `ctx.mcpReq.notify(...)`         | `ctx.mcpReq.notify(...)` (unchanged) |
| Cancel          | `ctx.mcpReq.signal`              | `ctx.mcpReq.signal` (unchanged)      |

## Asking for input: `input_required` (modern)

Instead of blocking on a mid-call round trip, the handler returns `inputRequired(...)` and the whole call re-runs from the top once the user answers — with the answer available via `acceptedContent`.

See [`input_required` return example](references/examples.md#input_required-return).

- Check `ctx.mcpReq.inputResponses` for an answer before asking — only request what's still missing (the handler re-runs from scratch, so already-answered fields shouldn't re-prompt).
- Build requests with `inputRequired.elicit()` (form) or `inputRequired.elicitUrl()` (redirect to a URL).
- Read answers with `acceptedContent(ctx.mcpReq.inputResponses, key, schema)` — it returns `undefined` for missing, declined, and cancelled alike.
- To tell a refusal from a first entry, use `inputResponse(ctx.mcpReq.inputResponses, key)` — a discriminated view (`missing` / `elicit` / `sampling` / `roots`) — and stop re-prompting on a non-accept:

```ts
const view = inputResponse(ctx.mcpReq.inputResponses, "confirm");
if (view.kind === "elicit" && view.action !== "accept") {
  return {
    content: [{ type: "text", text: "Cancelled by the operator" }],
    isError: true,
  };
}
```

## Asking for input: elicitation (legacy)

`ctx.mcpReq.elicitInput()` blocks the handler until the client responds. **Throws on 2026-era connections** — new code should use `input_required` instead.

See [Form elicitation example](references/examples.md#form-elicitation).

- Requires the client's `elicitation` capability for the mode used; without it, `elicitInput` throws before the wire and surfaces as an `isError` result.
- `mode: 'form'` — never request secrets (passwords, payment details) through a form.
- `mode: 'url'` — send the user to a page outside the chat (e.g. an OAuth login).

```ts
const result = await ctx.mcpReq.elicitInput({
  mode: "url",
  message: "Sign in to link your account",
  url: "https://billing.example.com/connect/provider",
  elicitationId: "12345",
});
```

## Progress

Call `ctx.mcpReq.notify(...)` with a `notifications/progress` message keyed on `progressToken`. `progress` must strictly increase across calls for the same token.

See [Progress notifications example](references/examples.md#progress-notifications).

## Cancellation

Check `ctx.mcpReq.signal.aborted` inside any loop and return promptly; forward the signal to `fetch`/child calls so they abort too.

```ts
async ({ pages }, ctx) => {
  for (let page = 0; page < pages; page++) {
    if (ctx.mcpReq.signal.aborted) break;
    await scanPage(page, { signal: ctx.mcpReq.signal });
  }
};
```

## Client setup

Register the `elicitation/create` handler once at client construction. Set `inputRequired: { maxRounds }` to bound how many round trips auto-fulfillment will attempt before giving up.

See [Client-side interaction example](references/examples.md#client-side-interaction).

## Deprecated

Sampling (`requestSampling`) and MCP logging (`ctx.mcpReq.log`) are deprecated (SEP-2577) — call the LLM provider directly, and log to stderr or OpenTelemetry instead. See `references/advanced-interaction-patterns.md`.

## Reference files

- `references/advanced-interaction-patterns.md` — `requestState` for cross-round data, and the sampling/logging deprecation.

## Related skills

- `mcp-server-build` / `mcp-client-build` — where these handlers get registered.
