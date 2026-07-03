---
description: Debugging reference tables comparing common error symptoms with their respective root causes and solutions.
metadata:
  tags: [debugging-tables, troubleshooting, errors]
  source: internal
---

# Error Code Reference Tables

## ProtocolErrorCode (wire codes)

| Member                            | Code   | Meaning                                                                             |
| :-------------------------------- | :----- | :---------------------------------------------------------------------------------- |
| `ParseError`                      | −32700 | Not valid JSON                                                                      |
| `InvalidRequest`                  | −32600 | Not a valid JSON-RPC request                                                        |
| `MethodNotFound`                  | −32601 | No handler for the method                                                           |
| `InvalidParams`                   | −32602 | Bad params — also a `resources/read` miss                                           |
| `InternalError`                   | −32603 | Handler threw a non-`ProtocolError`                                                 |
| `ResourceNotFound`                | −32002 | Receive-tolerated only; the SDK always emits −32602 — throw `ResourceNotFoundError` |
| `MissingRequiredClientCapability` | −32021 | Request needs an undeclared client capability _(new in 2026-07-28)_                 |
| `UnsupportedProtocolVersion`      | −32022 | Requested version unknown/unsupported; `data.supported` lists options _(new)_       |
| `UrlElicitationRequired`          | −32042 | Tool needs the user to visit a URL first                                            |

## SdkErrorCode (local codes)

| Code                                                                                                                                                                                    | When                                                     |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------- |
| `NotConnected` / `AlreadyConnected` / `NotInitialized`                                                                                                                                  | Transport/protocol lifecycle misuse                      |
| `CapabilityNotSupported`                                                                                                                                                                | Required capability not supported                        |
| `RequestTimeout`                                                                                                                                                                        | Request timed out                                        |
| `ConnectionClosed`                                                                                                                                                                      | Connection closed with requests in flight                |
| `SendFailed`                                                                                                                                                                            | Failed to send a message                                 |
| `InvalidResult`                                                                                                                                                                         | Response failed local schema validation                  |
| `UnsupportedResultType`                                                                                                                                                                 | 2025-era response carried an unknown `resultType`        |
| `InputRequiredRoundsExceeded`                                                                                                                                                           | Auto-fulfilment hit `maxRounds`                          |
| `ListPaginationExceeded`                                                                                                                                                                | Aggregate `list*()` walk hit `listMaxPages`              |
| `MethodNotSupportedByProtocolVersion`                                                                                                                                                   | Outbound method doesn't exist on the negotiated revision |
| `EraNegotiationFailed`                                                                                                                                                                  | `connect()` found no shared era (pin unmet / no overlap) |
| `ClientHttpNotImplemented` / `ClientHttpAuthentication` / `ClientHttpForbidden` / `ClientHttpUnexpectedContent` / `ClientHttpFailedToOpenStream` / `ClientHttpFailedToTerminateSession` | HTTP client-transport failures                           |

## Common Error Symptoms and Fixes

| Error                                                | Fix                                                                                         |
| :--------------------------------------------------- | :------------------------------------------------------------------------------------------ |
| `SyntaxError: ... is not valid JSON`                 | Something wrote to stdout on a stdio server. Log with `console.error`, never `console.log`. |
| `TS2589: Type instantiation is excessively deep`     | Multiple Zod versions in the tree. Dedupe to a single Zod 4.                                |
| `ReferenceError: crypto is not defined`              | Node < 20. Upgrade, or polyfill: `globalThis.crypto = webcrypto`.                           |
| `SdkError: ERA_NEGOTIATION_FAILED`                   | Client and server share no protocol era. Set `versionNegotiation: { mode: 'auto' }`.        |
| `SdkError: METHOD_NOT_SUPPORTED_BY_PROTOCOL_VERSION` | Calling a method the negotiated era doesn't have — the error names the replacement.         |
| `No exported member 'SSEServerTransport'`            | HTTP serving now uses `createMcpHandler()` from `@modelcontextprotocol/server`.             |
