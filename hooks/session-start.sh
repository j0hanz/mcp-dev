#!/usr/bin/env bash
# SessionStart hook: inject the mcp router skill into context.
# Plain stdout from a SessionStart hook reaches Claude directly — no JSON wrapper needed.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_FILE="${SCRIPT_DIR}/../skills/mcp/SKILL.md"

printf '<mcp-dev-router>\n'
printf 'Scope: MCP (Model Context Protocol) TypeScript SDK work ONLY — ignore for everything else.\n'
printf "Skill names below invoke via the Skill tool as 'mcp-dev:<name>' (e.g. /mcp-test -> mcp-dev:mcp-test).\n\n"
if [[ -r "$SKILL_FILE" ]]; then
  # Strip YAML frontmatter: loader metadata, noise once injected as context.
  awk 'NR==1&&/^---[[:space:]]*$/{fm=1;next} fm{if(/^---[[:space:]]*$/)fm=0;next} 1' "$SKILL_FILE"
else
  printf 'Error reading mcp router skill: %s not readable\n' "$SKILL_FILE"
fi
printf '</mcp-dev-router>\n'
