---
name: mcp
description: Use when starting any MCP SDK v2 job — building, migrating, auditing, or debugging a server or client — and the right mcp-* skill or order is unclear.
user-invocable: true
argument-hint: plan | build | audit | migrate | auth | test | elicit | protocol | publish
disable-model-invocation: true
metadata:
  category: technique
  triggers: mcp sdk v2, building server, migrating server, auditing mcp, debugging client, mcp workflow
---

# MCP Entry Point

Entry point and router for MCP SDK v2 skills.

## When to Use

- Starting any MCP SDK v2 task (building, migrating, auditing, or debugging).
- The correct `mcp-*` skill to load is unclear.

## How It Works

No argument: offer the Job column as a menu. `/mcp <job>`: follow its Routing row. Load each skill ONLY at its named step — never upfront, never twice.

### Routing

| Job                                    | Do                                                             |
| :------------------------------------- | :------------------------------------------------------------- |
| Plan / clarify requirements            | Load `mcp-interview`, then the Build Workflow                  |
| Build a new server or client           | [Build Workflow](#build-workflow-server-or-client)             |
| Audit existing MCP code                | [Audit](#audit)                                                |
| Migrate SDK v1 → v2                    | Load `mcp-migrate`, then `mcp-test`                            |
| Auth / tokens / OAuth                  | Load `mcp-auth`                                                |
| Test / debug / error codes             | Load `mcp-test`                                                |
| Elicitation / progress / cancellation  | Load `mcp-elicitation`                                         |
| Low-level protocol / custom transports | Load `mcp-advanced-protocol`                                   |
| Package / publish / register with host | Load `mcp-server-build`, then its `references/distribution.md` |

### Build Workflow (Server or Client)

```
Clarify -> Scaffold -> [Auth] -> [Interaction] -> Test -> [Distribute] -> Verify
```

`[step]` = conditional; skip it unless its condition below holds. Every other step is mandatory, in order.

1. **Clarify** — load `mcp-interview`; obtain the Decision Record (`docs/mcp-decisions.md`).
2. **Scaffold** — load `mcp-server-build` or `mcp-client-build`.
3. **Auth** _(HTTP servers or protected clients)_ — load `mcp-auth`.
4. **Interaction** _(tools that ask the user, report progress, or run long)_ — load `mcp-elicitation`.
5. **Test** — load `mcp-test`.
6. **Distribute** _(server npm only)_ — read `mcp-server-build`'s `references/distribution.md`.
7. **Verify** — done only when tests pass and an end-to-end run succeeds.

### Audit

```
Locate -> Version -> Design -> [Security] -> [Interactions] -> Tests -> Intent -> Report
```

READ-ONLY: report findings; fix nothing unless asked. Audit against each loaded skill's rules — the checklists live there, not here.

1. **Locate** — search for `@modelcontextprotocol/` imports; note server or client, transport, SDK version (v1 or v2).
2. **Version** — if v1, load `mcp-migrate`; migration is the top finding — keep auditing the rest.
3. **Design** — load `mcp-server-build` (plus `mcp-client-build` if there is client code).
4. **Security** _(any HTTP code)_ — load `mcp-auth`. Missing auth is a Blocker.
5. **Interactions** _(tools that ask for input, show progress, or run long)_ — load `mcp-elicitation`.
6. **Tests** — load `mcp-test`.
7. **Intent** — mismatches with `docs/mcp-decisions.md` are Should Fix; a missing file is a Nice to Have (run `mcp-interview` to document existing choices).

Report one ranked list; name every skipped step (e.g. no HTTP code). Categories: **Blockers** (broken or unsafe for production), **Should Fix** (breaks a design rule), **Nice to Have**. Each finding:
`- [file:line] | [What is wrong] | [Skill that fixes it]`

## Examples

See specific sub-skills for code implementation examples:

- Server Configuration: see the `mcp-server-build` skill.
- Client Connection: see the `mcp-client-build` skill.

## Common Mistakes

- Loading sub-skills upfront or out of order.
- Duplicating SDK-specific rules or code in this routing/dispatcher file.
- Violating the build workflow order (always obtain the Decision Record during Clarify step first).
