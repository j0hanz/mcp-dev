# MCP Dev Plugin

<!-- docs-maintainer:START -->

![Claude](https://img.shields.io/badge/Claude-D97757?logo=claude&logoColor=fff&style=for-the-badge) ![GitHub Copilot](https://img.shields.io/badge/GitHub_Copilot-000000?logo=githubcopilot&logoColor=fff&style=for-the-badge) ![Version](https://img.shields.io/github/v/tag/j0hanz/mcp-dev?label=version&style=for-the-badge) ![License](https://img.shields.io/github/license/j0hanz/mcp-dev?style=for-the-badge)
<!-- docs-maintainer:END -->

A plugin for [Claude Code](https://claude.com/claude-code) and [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli): skills and agents for building, testing, auditing, distributing, and migrating MCP servers and clients with the [MCP TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/) (`2.0.0-beta.2`, protocol revision `2026-07-28`).

## Install

### Claude Code

```bash
/plugin marketplace add j0hanz/mcp-dev
/plugin install mcp-dev@mcp-dev
```

### GitHub Copilot CLI

```bash
/plugin marketplace add j0hanz/mcp-dev
/plugin install mcp-dev@mcp-dev
```

Or from a terminal:

```bash
copilot plugin marketplace add j0hanz/mcp-dev
copilot plugin install mcp-dev@mcp-dev
```

## Usage

`/mcp` is the single command: with no argument it lists the available jobs; `/mcp <job>` routes to the right skills in the right order.

| Command                               | What it does                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| `/mcp`                                | List available jobs                                                               |
| `/mcp plan`                           | Clarify requirements first — produces a Decision Record (`docs/mcp-decisions.md`) |
| `/mcp new server` / `/mcp new client` | Build end to end: interview → scaffold → auth → test → ship                       |
| `/mcp audit`                          | Read-only production-readiness audit of existing MCP code                         |
| `/mcp migrate`                        | Upgrade SDK v1 code to v2                                                         |
| `/mcp auth`                           | OAuth, bearer-token, or machine-to-machine auth                                   |
| `/mcp test`                           | Debug connection failures, `ProtocolError`/`SdkError` codes, inspector sessions   |
| `/mcp elicit`                         | Add progress reporting, cancellation, or mid-call user input                      |
| `/mcp protocol`                       | Drop below `McpServer` for custom transports or raw protocol messages             |
| `/mcp publish`                        | Package a server and register it with npm                                         |

Knowledge skills load automatically when the work touches their territory — no command needed:

`mcp-planning`, `mcp-server`, `mcp-client`, `mcp-auth`, `mcp-elicitation`, `mcp-test`, `mcp-protocol`, `mcp-migrate`

A SessionStart hook (`hooks/session-start.js`) injects the `/mcp` routing table into context at session start and after `/clear` or compaction (~4.2KB), so MCP work routes to the right skill without typing `/mcp`. Runs natively and cross-platform via Node.js (supported on Windows, macOS, and Linux).

## Agents

Three subagents handle work that's autonomous or context-heavy rather than a single command. Claude Code and Copilot CLI dispatch them automatically when a task matches their description — no `/mcp` invocation needed.

| Agent          | Handles                                                                 | Tools                                      |
| -------------- | ----------------------------------------------------------------------- | ------------------------------------------ |
| `mcp-auditor`  | Read-only production-readiness audit of existing MCP server/client code | Read, Grep, Glob, Bash, Skill              |
| `mcp-migrator` | Runs the SDK v1 → v2 migration (codemod through verify) end to end      | Read, Write, Edit, Bash, Grep, Glob, Skill |
| `mcp-debugger` | Diagnoses connection failures and `ProtocolError`/`SdkError` codes      | Read, Grep, Glob, Bash, Skill              |

Defined under `agents/*.md`; each loads the matching `mcp-*` skill for its checklist instead of duplicating it.

## Contributing

Issues and PRs are welcome at [j0hanz/mcp-dev](https://github.com/j0hanz/mcp-dev). Skills live under `skills/*/SKILL.md`, agents under `agents/*.md` — see [Maintenance](#maintenance) for what to keep in sync when the SDK version changes.

## Maintenance

The SDK version (`2.0.0-beta.2`) is targeted by the six SDK-facing skills — `mcp-server`, `mcp-client`, `mcp-auth`, `mcp-test`, `mcp-migrate`, `mcp-protocol`. It is explicitly pinned in `mcp-client`, `mcp-test`, and `mcp-server`'s distribution references. When bumping it, update these occurrences accordingly.

## License

[MIT](LICENSE)
