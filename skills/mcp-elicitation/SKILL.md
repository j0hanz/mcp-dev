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

## Core Concepts

> Flow: handler ➔ `inputRequired(...)` ➔ client prompts user ➔ handler re-runs ➔ `acceptedContent(answer)`

- **Stateless**: Handlers return `inputRequired(...)` instead of blocking; they re-run from scratch when the user responds.
- **Progress/Cancel**: Send progress via `notify()` and check `signal.aborted` in loops.
- **Autocomplete**: Wrap prompt Zod schemas with `completable()` for typing suggestions.

## Reference Guides

- [Mechanics](file:///C:/mcp-dev/skills/mcp-elicitation/references/mechanics.md): Protocol details for input, progress, client, and autocomplete.
- [Advanced Patterns](file:///C:/mcp-dev/skills/mcp-elicitation/references/advanced-interaction-patterns.md): Cross-round state (`requestState`) and deprecated features.
- [Code Examples](file:///C:/mcp-dev/skills/mcp-elicitation/references/examples.md): Implementation code blocks.

## Red Flags & Iron Laws

- **Secrets**: NEVER request credentials or keys via forms; redirect to URL.
- **Cancellation**: ALWAYS check `signal.aborted` in loops and pass `signal` to async/DB calls.
- **Elicitation**: Return `inputRequired(...)` for modern. Blocking `elicitInput()` throws on 2026-era links.
- **Deprecated**: Avoid sampling, root requests, and MCP logging (`log`).
