---
name: mcp-elicitation
description: Use when implementing mid-call user interaction, prompt autocomplete, progress tracking, or cancellation in the TypeScript SDK v2.
user-invocable: false
metadata:
  category: technique
  triggers: elicitation, progress, cancellation, autocomplete, completable, inputRequired
---

# MCP Elicitation

Mid-call communication between server and user, and prompt autocomplete.

## When to Use

- Tool needs mid-call operator input, confirmation, or progress tracking.
- Client needs to register auto-fulfillment handlers.
- Prompt arguments require dynamic autocompletion.

## Steps

1. **Elicit Input**: Return `inputRequired(...)` from your tool callback when user input is needed.
2. **Handle Stateless Return**: Store multi-round session parameters in the `requestState` object so callbacks can resume seamlessly once the responses are accepted.
3. **Emit Progress**: Emit operation updates using `notify()` in the handler's execution.
4. **Guard Cancellation**: Pass `signal` to database or HTTP calls, and verify `signal.aborted` within recursive functions or loop conditions.
5. **Autocompletion**: Wrap input properties within standard `completable(...)` schema builders to allow prompt suggestions dynamically.

## Completion Criteria

To consider elicitation and mid-call interaction complete, you must verify:

- [ ] No mid-call tool handlers block threads or run synchronously while awaiting user actions.
- [ ] All forms, input widgets, and prompt arguments are clear, validated, and do NOT request credentials or access key secrets.
- [ ] The engine verifies `signal.aborted` on every iteration of loops or long database inquiries.
- [ ] All 2026-era interaction flows return modern `inputRequired` descriptors instead of invoking deprecated `elicitInput()`.
- [ ] Deprecated stateful push APIs (such as push sampling, roots, or logging) are replaced with modern alternatives (e.g. `inputRequired.createMessage()`, `inputRequired.listRoots()`).

## Reference Guides

- [Mechanics](references/mechanics.md): Protocol details for input, progress, client, and autocomplete.
- [Advanced Patterns](references/advanced-interaction-patterns.md): Cross-round state (`requestState`) and deprecated features.
- [Code Examples](references/examples.md): Implementation code blocks.
