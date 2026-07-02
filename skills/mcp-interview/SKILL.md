---
name: mcp-interview
description: Use when planning a new MCP server or client before any code exists and design decisions (transport, auth, tool surface) are still open. Also the Clarify step of the /mcp build workflow.
user-invocable: false
metadata:
  category: technique
  triggers: architectural choices, mcp transport, hosting, capability discovery, state management, auth requirements
---

# MCP Interview

Make and record all MCP design decisions before writing any code.

## When to Use

- Planning a brand-new MCP server or client before any implementation code exists.
- Working on the "Clarify" step of the `/mcp build` workflow.
- Designing transport, auth, tool surface, or distribution strategy.

## How It Works

**Goal:** Make and record all MCP design decisions before writing any code.
**Rule:** ONLY make decisions. NEVER write, change, or save code.

```
Search -> ask triggered questions (one at a time) -> record 9 decisions -> save + show docs/mcp-decisions.md
```

### Rules

- **Search First:** Check project files for `@modelcontextprotocol/` code to guide your choices. Skip if no files exist.
- **Follow Triggers:** Only ask a question if its "Trigger" happens. Otherwise, use the "Safe Default" silently.
- **One by One:** Ask one question at a time. Wait for the answer before moving on.
- **Two Choices Only:** Always offer exactly two choices: (1) your top pick, (2) the next best pick. Never offer "Other".
- **No Vague Answers:** If the user is unclear, ask again. If they say "you choose," pick your top choice and record it.

### Decision Table

| #   | Decision       | Safe Default                         | Trigger to Ask                                         | Two Choices (Pick 1 / Pick 2)                        |
| :-- | :------------- | :----------------------------------- | :----------------------------------------------------- | :--------------------------------------------------- |
| 1   | Scope          | server                               | Request is not clear about direction                   | Server (shares tools) / Client (uses tools)          |
| 2   | Transport      | stdio                                | User mentions remote access, multi-user, or deployment | stdio (local, no login) / HTTP (remote, needs login) |
| 3   | Auth           | none (stdio)                         | Transport is HTTP                                      | OAuth tokens / Machine-to-machine login              |
| 4   | Tool surface   | Few simple tools                     | User wants >3 tools or one "do everything" tool        | Many simple tools / Few big tools with settings      |
| 5   | Input schemas  | Zod schema on every tool             | NEVER ask (always record this)                         | —                                                    |
| 6   | Interaction    | Plain request-response               | User mentions long tasks or needing user input         | Progress & cancel / Fail fast & retry                |
| 7   | Error strategy | Protocol errors only for real faults | NEVER ask (always record this)                         | —                                                    |
| 8   | Distribution   | Local project                        | User wants to publish or share                         | npm package / Keep local                             |
| 9   | Testing        | One test per tool                    | NEVER ask (always record this)                         | —                                                    |

### Steps

1. **Search** the project files.
2. **Check** the Decision Table to see which questions trigger.
3. **Ask** triggered questions one at a time.
4. **Record** all 9 decisions. Mark each as `(asked)` or `(default)`.
5. **Save** to `docs/mcp-decisions.md`; if it exists, append a dated record below the old ones — never delete old choices.
6. **Show** the final record.

## Examples

### Record Format Example

```markdown
# MCP Decision Record — YYYY-MM-DD

1. Scope: server exposing 4 tools. (asked)
2. Transport: stdio. (default)
3. Auth: none — stdio transport. (default)
```

## Common Mistakes

- Writing or editing implementation code during the interview/Clarify phase.
- Asking a question from the Decision Table if its trigger condition did not happen.
- Leaving any of the 9 decisions blank or undocumented in `docs/mcp-decisions.md`.
