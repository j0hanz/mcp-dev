# Errors — two channels, picked by audience

| Channel | Shape | Audience | Produced by |
|------------------|-----------------------------------------|---------------------------------------------|-----------------------------------------------------------|
| **Tool error** | Result with `isError: true` | The **model** — reads the message and retries | Tool handlers: return it or `throw` anything |
| **Protocol error** | JSON-RPC error `{ code, message, data? }` | The **caller's code** | Resource/prompt/completion callbacks: `throw ProtocolError` |

```ts
// Tool error — put the recovery hint in the text:
return {
  content: [
    { type: "text", text: `No note "${id}". Known ids: ${ids.join(", ")}` },
  ],
  isError: true,
};

// Resource/prompt/completion callbacks:
import {
  ProtocolError,
  ProtocolErrorCode,
  ResourceNotFoundError,
} from "@modelcontextprotocol/server";
throw new ProtocolError(
  ProtocolErrorCode.InvalidParams,
  `Note ids are lowercase, got "${id}"`,
);
throw new ResourceNotFoundError(uri.href); // -32602 with data: { uri }
```

A tool handler **cannot** emit a protocol error — every throw (even a thrown `ProtocolError`) becomes `isError: true`. The one exception: `UrlElicitationRequiredError` propagates (`-32042`). Full code tables live in the `mcp-test` skill.
