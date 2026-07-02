# MCP Dev

A Claude Code plugin: skills for building, testing, auditing, distributing, and migrating MCP servers and clients with the [MCP TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/) (`2.0.0-beta.2`, protocol revision `2026-07-28`).

## Install

```bash
/plugin marketplace add j0hanz/mcp-dev
/plugin install mcp-dev@mcp-dev
```

## Usage

`/mcp` lists everything; `/mcp <job>` routes to the right skills for that job.

| Command           | What it does                                                          |
| ----------------- | --------------------------------------------------------------------- |
| `/mcp-new-server` | Build a server end to end (interview → scaffold → auth → test → ship) |
| `/mcp-new-client` | Build a client end to end                                             |
| `/mcp-audit`      | Read-only production-readiness audit of existing MCP code             |

Knowledge skills load automatically when the work touches their territory:

`mcp-interview`, `mcp-server-build`, `mcp-client-build`, `mcp-auth`, `mcp-elicitation`, `mcp-test`, `mcp-advanced-protocol`, `mcp-migrate-v1-to-v2`, `mcp-distribute`

## Maintenance

The SDK version (`2.0.0-beta.2`) is stated in each skill. When bumping it, update every `skills/*/SKILL.md`.

## License

[MIT](LICENSE)
