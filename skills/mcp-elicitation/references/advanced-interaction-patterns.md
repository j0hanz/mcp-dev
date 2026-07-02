# Cross-Round State & Deprecated Interaction Surfaces

## Cross-round state — `requestState`

For sequential `input_required` flows, return an opaque string the client echoes byte-for-byte; read it back with `ctx.mcpReq.requestState<State>()`. It round-trips through the client, so it is **attacker-controlled** — protect it with the HMAC codec and mint only what earlier rounds already proved:

See [Cross-round State (requestState) example](examples.md#cross-round-state-requeststate).

Tampered or expired state answers `-32602 Invalid or expired requestState` and never reaches the handler. The codec is **signed, not encrypted** — keep secrets out of the payload.

## Deprecated: sampling and MCP logging (SEP-2577)

- **Sampling** (`ctx.mcpReq.requestSampling`) routed an LLM call through the client. Migrate: call the LLM provider's API directly from the server. Functional ≥ 12 months on 2025-era connections; throws on 2026-era.
- **MCP logging** (`ctx.mcpReq.log(level, data)`) is deprecated — prefer stderr or OpenTelemetry.
