---
description: >-
  Reference table of standard ProtocolErrorCode and SdkErrorCode definitions and descriptions.
metadata:
  tags: [error-codes, codes, debugging]
  source: internal
---

# Error Code Reference — classes, ProtocolErrorCode, SdkErrorCode

## Error classes

| Class                                 | Package       | Meaning                                                                                                                                                                   |
| ------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProtocolError(code, message, data?)` | server/client | JSON-RPC error on the wire; subclasses: `ResourceNotFoundError`, `UrlElicitationRequiredError`, `UnsupportedProtocolVersionError`, `MissingRequiredClientCapabilityError` |
| `SdkError(code, message)`             | server/client | Local SDK failure — never a wire error                                                                                                                                    |
| `SdkHttpError`                        | server/client | HTTP-level failure with a JSON-RPC error body (2025-era)                                                                                                                  |
| `UnauthorizedError`                   | client        | 401 requiring (re-)authorization                                                                                                                                          |
| `IssuerMismatchError`                 | client        | OAuth mix-up defense (`kind: 'metadata' \| 'authorization_response'`)                                                                                                     |
| `AuthorizationServerMismatchError`    | client        | Credential pinned to a different AS (`expectedIssuer`)                                                                                                                    |
| `OAuthError` / `OAuthErrorCode`       | server        | Thrown by token verifiers → OAuth-conformant HTTP responses                                                                                                               |

## Error Channels — see [../mcp-server/references/errors.md](../mcp-server/references/errors.md) for the tool vs protocol error channel distinction.

## `ProtocolErrorCode` (wire codes)

[View ProtocolErrorCode table](tables.md#protocolerrorcode-wire-codes)

## `SdkErrorCode` (local codes)

[View SdkErrorCode table](tables.md#sdkerrorcode-local-codes)
