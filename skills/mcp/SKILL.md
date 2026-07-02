---
name: mcp
description: Entry point for MCP SDK v2. Run `/mcp` for menu or `/mcp <job>` to load knowledge skills in sequence.
user-invocable: true
disable-model-invocation: true
---

# MCP Entry Point

Run `/mcp` for menu, `/mcp <job>` to follow Routing table. Load skills ONLY at their named step (never upfront or twice).

## Routing

| Job                                    | Do                                                                   |
| :------------------------------------- | :------------------------------------------------------------------- |
| Plan / clarify requirements            | Load `mcp-interview`, then continue with the matching build workflow |
| Build a new server                     | [Build Workflow](#build-workflow-server-or-client)                   |
| Build a new client                     | [Build Workflow](#build-workflow-server-or-client)                   |
| Audit existing MCP code                | [Audit](#audit)                                                      |
| Migrate SDK v1 → v2                    | Load `mcp-migrate-v1-to-v2`, then `mcp-test`                         |
| Auth / tokens / OAuth                  | Load `mcp-auth`                                                      |
| Test / debug / error codes             | Load `mcp-test`                                                      |
| Elicitation / progress / cancellation  | Load `mcp-elicitation`                                               |
| Low-level protocol / custom transports | Load `mcp-advanced-protocol`                                         |
| Package / publish / register with host | Load `mcp-server-build`, then read its `references/distribution.md`  |

## Build Workflow (Server or Client)

1. **Clarify** — load `mcp-interview`; obtain the Decision Record (`docs/mcp-decisions.md`) before scaffolding.
2. **Scaffold** — load `mcp-server-build` or `mcp-client-build` for schemas, transport wiring, and construction.
3. **Auth** _(HTTP servers or protected clients)_ — load `mcp-auth` to wire providers/handlers.
4. **Interaction / Callbacks** _(for long-running tools, prompts, elicitation)_ — load `mcp-elicitation`.
5. **Test** — load `mcp-test`; write in-process transport tests.
6. **Distribute** _(server npm only)_ — read `mcp-server-build`'s `references/distribution.md`.
7. **Verify** — requires passing tests and successful end-to-end execution.

## Audit

READ-ONLY: report findings; fix nothing unless asked.

1. **Locate** — search for `@modelcontextprotocol/` imports; note server or client, transport, SDK version (v1 or v2).
2. **Version** — if v1, load `mcp-migrate-v1-to-v2`; make migration the top finding, keep auditing the rest.
3. **Design** — load `mcp-server-build` (and `mcp-client-build` if there is client code); verify schema validation, error-channel conventions, HTTP server factories, strict stdout rules.
4. **Security** — load `mcp-auth`; verify bearer-token validation, scopes, and metadata on every HTTP endpoint. Missing auth is a Blocker.
5. **Interactions** — if tools ask for input, show progress, or run long, load `mcp-elicitation`; check cancellation and state handling.
6. **Tests** — load `mcp-test`; check in-process test coverage and correct error codes.
7. **Intent** — if `docs/mcp-decisions.md` exists, report code/decision mismatches as Should Fix. If it doesn't, add a Nice to Have recommending `mcp-interview` to document the choices already made.

Report one ranked list; state any skipped steps (e.g. no HTTP code). Categories: **Blockers** (broken or unsafe for production), **Should Fix** (breaks a design rule), **Nice to Have**. Each finding:
`- [file:line] | [What is wrong] | [Skill that fixes it]`

## Rules

- Never skip Clarify or Test in a build workflow — no scaffolding without a Decision Record.
- SDK specifics live in the knowledge skills, never in this file.
