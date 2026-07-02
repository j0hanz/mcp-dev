---
name: mcp
description: Single entry point for all MCP TypeScript SDK v2 work. Run /mcp with no argument to see the available jobs, or /mcp <job> — e.g. "new server", "new client", "audit", "migrate", "publish" — to load the right knowledge skills in the right order for that job.
user-invocable: true
disable-model-invocation: true
---

# MCP Entry Point

**No argument:** show the Routing table as a menu and ask which job to run.
**Argument:** match it to a Routing row and follow that row. Load each knowledge skill with the Skill tool exactly at the step that names it — never upfront, never twice in one session.

## Routing

| Job                                    | Do                                                                   |
| :------------------------------------- | :------------------------------------------------------------------- |
| Plan / clarify requirements            | Load `mcp-interview`, then continue with the matching build workflow |
| Build a new server                     | [Build server](#build-server)                                        |
| Build a new client                     | [Build client](#build-client)                                        |
| Audit existing MCP code                | [Audit](#audit)                                                      |
| Migrate SDK v1 → v2                    | Load `mcp-migrate-v1-to-v2`, then `mcp-test`                         |
| Auth / tokens / OAuth                  | Load `mcp-auth`                                                      |
| Test / debug / error codes             | Load `mcp-test`                                                      |
| Elicitation / progress / cancellation  | Load `mcp-elicitation`                                               |
| Low-level protocol / custom transports | Load `mcp-advanced-protocol`                                         |
| Package / publish / register with host | Load `mcp-server-build`, then read its `references/distribution.md`  |

## Build server

1. **Clarify** — load `mcp-interview`; obtain the Decision Record (`docs/mcp-decisions.md`) before scaffolding.
2. **Scaffold** — load `mcp-server-build`; registrations, schemas, transport wiring.
3. **Auth** _(HTTP only — skip on stdio)_ — load `mcp-auth` before writing handlers.
4. **Interaction** _(only if tools run long or need user input)_ — load `mcp-elicitation`; wire prompts, progress, cancellation.
5. **Test** — load `mcp-test`; write and pass in-process transport tests covering every tool.
6. **Distribute** _(only if the Decision Record says npm)_ — read `mcp-server-build`'s `references/distribution.md`.
7. **Verify** — done only when all tests pass and the server starts cleanly.

## Build client

1. **Clarify** — load `mcp-interview`; obtain the Decision Record before scaffolding.
2. **Scaffold** — load `mcp-client-build`; client construction, transport, connection, tool calls, list-changed handling.
3. **Auth** _(only if the target server is protected)_ — load `mcp-auth`; wire the client-side provider.
4. **Callbacks** _(only if the server elicits, samples, or reports progress)_ — load `mcp-elicitation`.
5. **Test** — load `mcp-test`; test against an in-process fake server.
6. **Verify** — done only when tests pass and the client connects, lists, and calls against the real target.

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
- Never load a skill before the step that names it; never reload one already loaded this session.
- SDK specifics live in the knowledge skills, never in this file.
