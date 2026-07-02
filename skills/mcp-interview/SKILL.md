---
name: mcp-interview
description: This skill should be used when planning a new MCP server or client before any code exists — when the user asks to "plan an MCP server", "clarify MCP requirements", "decide stdio vs HTTP", "lock MCP design decisions", "spec out MCP tools", or when the mcp-new-server or mcp-new-client workflow reaches its Clarify step. Locks hard-to-reverse decisions one gated question at a time and writes a Decision Record to docs/mcp-decisions.md.
user-invocable: false
---

# MCP Interview

**Goal:** Lock every hard-to-reverse MCP design decision before any code is scaffolded, and record all of them — asked or defaulted — so nothing is left assumed.
**Rule:** Decisions only. Never scaffold, implement, or commit.

## Strict Execution Rules

- **Search First:** Grep/Read the repo for existing `@modelcontextprotocol/` code, configs, and conventions. Ground every recommendation in findings. Skip if no repository exists.
- **Gated:** Ask a question only when its Trigger fires. Otherwise record the Safe Default silently. Silence is never ambiguity — every row ends up in the record.
- **One at a Time:** Exactly one `AskUserQuestion` per question, in table order. Await the answer before the next.
- **Strictly Two Options:** (1) your recommended answer, grounded in the repo scan; (2) the most likely alternative. Never add a third "Other" — the tool provides one.
- **No Shrugging:** Re-ask vague answers with sharper options. If the user defers to your judgment, take the recommendation and record it as decided.

## Decision Map

| #   | Decision       | Safe default                                                | Trigger to ask                                     | Ask as (recommended / alternative)                                               |
| :-- | :------------- | :---------------------------------------------------------- | :------------------------------------------------- | :------------------------------------------------------------------------------- |
| 1   | Scope          | server                                                      | request ambiguous about direction                  | expose capabilities as a server / consume another server as a client             |
| 2   | Transport      | stdio                                                       | remote access, multi-user, or deployment mentioned | stdio (local, no auth needed) / streamable HTTP (remote, needs auth)             |
| 3   | Auth           | none (stdio)                                                | transport = HTTP                                   | OAuth bearer tokens with scopes / machine-to-machine client credentials          |
| 4   | Tool surface   | few narrow single-purpose tools                             | >3 candidate tools, or one "do everything" verb    | N narrow tools with tight schemas / fewer broad tools with mode parameters       |
| 5   | Input schemas  | zod schema on every tool input                              | never — always recorded                            | —                                                                                |
| 6   | Interaction    | plain request-response                                      | long-running work or mid-call user input implied   | elicitation + progress + cancellation / fail fast with `isError`, caller retries |
| 7   | Error strategy | `isError` results; protocol errors only for protocol faults | never — always recorded                            | —                                                                                |
| 8   | Distribution   | local project, run from source                              | publishing or sharing mentioned                    | npm package with a `bin` entry / keep local to this repo                         |
| 9   | Testing bar    | `InMemoryTransport` test per tool                           | never — always recorded                            | —                                                                                |

## Flow

1. Scan the repo (Search First).
2. Evaluate each row's trigger against the request and the scan findings.
3. Ask the fired questions one at a time, in table order.
4. Record all nine decisions, each marked `asked` or `default`.
5. Write the Decision Record to `docs/mcp-decisions.md` in the target project.
6. Hand the record back to the calling workflow, or present it in chat if invoked directly.

## Decision Record Format

One definitive implementation instruction per line — no open questions may remain:

```markdown
# MCP Decision Record — YYYY-MM-DD

1. Scope: server exposing 4 tools. (asked)
2. Transport: stdio. (default)
3. Auth: none — stdio transport. (default)
   ...
```

## Strict Rules

- **Never** scaffold or edit code — hand off to `/mcp-new-server` or `/mcp-new-client`.
- **Never** ask a question whose trigger did not fire.
- **Never** finish with an unrecorded row or an ambiguous decision.
