---
description: >-
  Reference mapping for the 12 core MCP design decisions, safe defaults, trigger conditions, and choices.
metadata:
  tags: [decisions, planning, defaults, triggers]
  source: internal
---

# MCP Decisions & Safe Defaults

This reference contains the 12 core decisions, safe defaults, triggers, and choices for the MCP interview.

1. **Scope** (Default: `server`): Ask if unclear. Choices: Server | Client
2. **Transport** (Default: `stdio`): Ask if remote/multi-user/deploy. Choices: stdio | HTTP
3. **Auth** (Default: `none`): Ask if HTTP. Choices: OAuth (OAuthClientProvider) | Custom AuthInfo (AuthProvider for non-OAuth bearer) | RS-only (server-legacy/auth for AS helpers)
4. **Tool Surface** (Default: `Few simple`): Ask if >3 tools/complex. Choices: Many simple | Few big with settings
5. **Input schemas** (Default: `Zod on all`): Never ask.
6. **Interaction** (Default: `Request-response`): Ask if long tasks/user input. Choices: Progress/Cancel | Multi-round-trip
7. **Prompts** (Default: `None`): Ask if reusable/UI integration. Choices: Static | Completable
8. **Error Strategy** (Default: `Protocol errors only`): Never ask.
9. **Distribution** (Default: `Local`): Ask if publishing/sharing. Choices: npm | Local
10. **Testing** (Default: `1 test/tool`): Never ask.
11. **Session/Resumability** (Default: `Stateless (no session)`): Ask if HTTP + multi-request client state needed. Choices: Stateless | `EventStore`-backed resumable sessions (on 2026-07-28 era, state is per-request via `requestState`, not session-based)
12. **Notifications** (Default: `None`): Ask if clients need list-change/data-change push updates. Choices: `subscriptions/listen` stream | None
13. **Era / protocol revision** (Default: `legacy: 'stateless'`): Ask only if 2026-only is required. Choices: Both eras (`legacy: 'stateless'`) | 2026-07-28 only (`legacy: 'reject'`) | legacy-only. Sources: `Supporting protocol revision 2026-07-28.md`, `Support legacy clients.md`
14. **Runtime** (Default: Node ≥ 20, ESM-first): Never ask. v2 is ESM-first but ships CJS too. Choices: Node ≥20 (fixed)
