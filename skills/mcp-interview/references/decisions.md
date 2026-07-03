# MCP Decisions & Safe Defaults

This reference contains the 10 core decisions, safe defaults, triggers, and choices for the MCP interview.

1. **Scope** (Default: `server`): Ask if unclear. Choices: Server | Client
2. **Transport** (Default: `stdio`): Ask if remote/multi-user/deploy. Choices: stdio | HTTP
3. **Auth** (Default: `none`): Ask if HTTP. Choices: OAuth | Custom AuthInfo
4. **Tool Surface** (Default: `Few simple`): Ask if >3 tools/complex. Choices: Many simple | Few big with settings
5. **Input schemas** (Default: `Zod on all`): Never ask.
6. **Interaction** (Default: `Request-response`): Ask if long tasks/user input. Choices: Progress/Cancel | Multi-round-trip
7. **Prompts** (Default: `None`): Ask if reusable/UI integration. Choices: Static | Completable
8. **Error Strategy** (Default: `Protocol errors only`): Never ask.
9. **Distribution** (Default: `Local`): Ask if publishing/sharing. Choices: npm | Local
10. **Testing** (Default: `1 test/tool`): Never ask.
