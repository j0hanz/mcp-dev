---
name: mcp-interview
description: Plan MCP server/client before coding.
user-invocable: false
metadata:
  category: technique
  triggers: architectural choices, mcp transport, hosting, capability discovery, state management, auth requirements
---

# MCP Interview

Make and record all MCP design decisions before writing any code.

## When to Use

- Planning new MCP server/client.
- "Clarify" step of `/mcp build`.
- Designing transport, auth, tools, or distribution.

## How It Works

**Goal:** Record decisions before coding.
**Rule:** ONLY make decisions; never code.

`Search -> Ask triggered questions -> Record 10 decisions -> Save docs/mcp-decisions.md`

### Rules

- **Search First**: Check project for `@modelcontextprotocol/`.
- **Triggers**: Ask only if triggered; else use "Safe Default".
- **One by One**: Ask one question at a time.
- **Two Choices**: Offer exactly two options (no "Other").
- **Vague Input**: Re-ask if vague; if they say "you choose," use option 1.

### Decision List

See [references/decisions.md](file:///C:/mcp-dev/skills/mcp-interview/references/decisions.md) for the 10 decisions, safe defaults, triggers, and choices.

### Steps

1. **Search** project files.
2. **Check** [decisions.md](file:///C:/mcp-dev/skills/mcp-interview/references/decisions.md) for triggers.
3. **Ask** triggered questions one at a time.
4. **Record** all 10 decisions (`asked` or `default`).
5. **Save** to `docs/mcp-decisions.md` (append dated record; never delete old).
6. **Show** final record.
7. **Next Step**: Load `/mcp-server-build` (server) or `/mcp-client-build` (client).

## Example

`docs/mcp-decisions.md` format:

```markdown
# MCP Decision Record — YYYY-MM-DD

1. Scope: server exposing 4 tools. (asked)
2. Transport: stdio. (default)
3. Auth: none. (default)
```

## Common Mistakes

- Coding during interview/Clarify.
- Asking untriggered questions.
- Leaving decisions blank in `docs/mcp-decisions.md`.
