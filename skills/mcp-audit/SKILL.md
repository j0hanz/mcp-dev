---
name: mcp-audit
description: User-invoked, read-only audit of an existing MCP codebase for production readiness — SDK version, design-rule compliance, auth, interaction handling, and test coverage. Reports ranked findings; fixes nothing unless asked.
disable-model-invocation: true
---

# MCP Audit

**Goal:** Audit the project's MCP code and report findings.
**Rule:** READ-ONLY. Never edit or fix files.
**Tooling:** Load each skill with the Skill tool exactly when named.

## Workflow Steps

1. **Locate Code:** Search for `@modelcontextprotocol/` imports. Write down: server or client, transport type, and SDK version (v1 or v2).
2. **Check Version:** If using v1, load `mcp-migrate-v1-to-v2`. Make migration the top finding. Keep auditing the rest.
3. **Check Design:** Load `mcp-server-build` (and `mcp-client-build` if there is client code). Verify: schema validation, `isError` usage, HTTP server factories, and strict stdout rules.
4. **Check Security:** Load `mcp-auth`. Verify HTTP endpoints use bearer-token validation, scopes, and metadata. _(Missing auth is a Blocker)._
5. **Check Interactions:** If tools ask for input, show progress, or run long, load `mcp-elicitation`. Check cancellation and state handling.
6. **Check Tests:** Load `mcp-test`. Check `InMemoryTransport` test coverage and correct error codes.
7. **Check Intent:** If `docs/mcp-decisions.md` exists, compare the code against each recorded decision (transport, auth, tool surface, interaction, testing bar). Report mismatches as Should Fix. If it does not exist, report a Nice to Have finding recommending `mcp-interview` to document the choices already made in code.

## Output Format

Report all findings in one ranked list.

_Note: If a step does not apply (like having no HTTP code), skip it but clearly state in the report that it was skipped._

**Categories:**

1. **Blockers:** Broken or unsafe for production.
2. **Should Fix:** Breaks a design rule.
3. **Nice to Have:** Minor improvements.

**Format for each finding:**
`- [file:line] | [What is wrong] | [Name of skill to fix it]`
