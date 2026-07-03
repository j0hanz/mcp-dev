# MCP Dev Plugin

<!-- docs-maintainer:START -->

![Claude](https://img.shields.io/badge/Claude-D97757?logo=claude&logoColor=fff&style=for-the-badge) ![Version](https://img.shields.io/github/v/tag/j0hanz/mcp-dev?label=version&style=for-the-badge) ![License](https://img.shields.io/github/license/j0hanz/mcp-dev?style=for-the-badge)
<!-- docs-maintainer:END -->

A Claude Code plugin: skills for building, testing, auditing, distributing, and migrating MCP servers and clients with the [MCP TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/) (`2.0.0-beta.2`, protocol revision `2026-07-28`).

## Install

```bash
/plugin marketplace add j0hanz/mcp-dev
/plugin install mcp-dev@mcp-dev
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

`mcp-interview`, `mcp-server-build`, `mcp-client-build`, `mcp-auth`, `mcp-elicitation`, `mcp-test`, `mcp-advanced-protocol`, `mcp-migrate`

A SessionStart hook (`hooks/session-start.js`) injects the `/mcp` routing table into context at session start and after `/clear` or compaction (~4.2KB), so MCP work routes to the right skill without typing `/mcp`. Runs natively and cross-platform via Node.js (supported on Windows, macOS, and Linux).

## Contributing

Issues and PRs are welcome at [j0hanz/mcp-dev](https://github.com/j0hanz/mcp-dev). Skills live under `skills/*/SKILL.md` — see [Maintenance](#maintenance) for what to keep in sync when the SDK version changes.

## Maintenance

The SDK version (`2.0.0-beta.2`) is pinned in six SDK-facing skills — `mcp-server-build`, `mcp-client-build`, `mcp-auth`, `mcp-test`, `mcp-migrate`, `mcp-advanced-protocol`. When bumping it, update all six (`mcp-interview`, `mcp-elicitation`, and the `mcp` router don't reference a version).

## License

[MIT](LICENSE)
