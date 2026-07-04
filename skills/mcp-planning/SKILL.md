---
name: mcp-planning
description: Use when planning a new MCP server or client before writing any code to make and record architectural design decisions.
user-invocable: false
metadata:
  category: technique
  triggers: architectural choices, mcp transport, hosting, capability discovery, state management, auth requirements
---

# MCP Planning

Make and record all MCP design decisions before writing any code.

## When to Use

- Planning new MCP server/client.
- "Clarify" step of `/mcp build`.
- Designing transport, auth, tools, or distribution.

## How It Works

**Goal:** Record decisions before coding.
**Rule:** ONLY make decisions; never code.

`Search -> Ask triggered questions -> Record 12 decisions -> Save docs/mcp-decisions.md`

### Rules

- **Search First**: Check project for `@modelcontextprotocol/`.
- **Triggers**: Ask only if triggered; else use "Safe Default".
- **One by One**: Ask one question at a time.
- **Two Choices**: Offer exactly two options (no "Other").
- **Vague Input**: Re-ask if vague; if they say "you choose," use option 1.

### Decision List

See [references/decisions.md](references/decisions.md) for the 12 decisions, safe defaults, triggers, and choices.

### Steps

1. **Search** project files for existing `@modelcontextprotocol/` imports to understand current scope.
2. **Determine** trigger needs by reviewing trigger parameters in [references/decisions.md](references/decisions.md).
3. **Query** triggered questions to the user, strictly one at a time, providing exactly two choices for each.
4. **Synthesize** a record of all 12 decision points, identifying each parameter as either `(asked)` or `(default)`.
5. **Acknowledge** any vague input by re-asking, or defaulting safely to option 1 if the user delegates choice.
6. **Append** the finalized dated markdown record directly onto `docs/mcp-decisions.md` without modifying any legacy records.
7. **Present** the completed decision document to the user.

### Completion Criteria

To consider the interview phase complete, you must verify:

- [ ] Existing codebase has been fully searched for imports of `@modelcontextprotocol/` or dependencies.
- [ ] Decisions have been resolved or defaulted for all 12 core design criteria from [references/decisions.md](references/decisions.md).
- [ ] No more than one clarification question was asked at a time.
- [ ] `docs/mcp-decisions.md` exists or has been appended to, containing the new dated decision record.
- [ ] All 12 decisions in the record are explicitly marked as either `(asked)` or `(default)`.
- [ ] The full formatted decision summary has been outputted to the user.

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

### Anti-Rationalization Table

| Rationalization / Excuse                                                       | Red Flag / Reality                                                                     |
| :----------------------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| "The user is in a hurry, so I'll ask all questions at once."                   | **Violates One-by-One.** You must ask exactly one question at a time.                  |
| "I'll suggest three options to give the user more choices."                    | **Violates Two Choices.** You must offer exactly two options, or use the Safe Default. |
| "I will write some boilerplate code to help them visualize."                   | **Violates ONLY make decisions.** Never write any code during the interview.           |
| "There is no need to search project files first for `@modelcontextprotocol/`." | **Violates Search First.** You must always perform the initial search.                 |
