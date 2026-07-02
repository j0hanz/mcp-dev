# MCP Interaction Patterns Examples

## Form Elicitation

```ts
async ({ topic }, ctx) => {
  const result = await ctx.mcpReq.elicitInput({
    mode: 'form',
    message: `How was ${topic}?`,
    requestedSchema: {
      type: 'object',
      properties: {
        rating: { type: 'number', title: 'Rating (1-5)', minimum: 1, maximum: 5 },
        comment: { type: 'string', title: 'Comment' },
      },
      required: ['rating'],
    },
  });
  if (result.action !== 'accept') {
    return { content: [{ type: 'text', text: `Feedback ${result.action}.` }] }; // 'decline' | 'cancel'
  }
  return { content: [{ type: 'text', text: `Recorded: ${JSON.stringify(result.content)}` }] };
};
```

## input_required Return

```ts
import {
  acceptedContent,
  inputRequired,
  type CallToolResult,
  type InputRequiredResult,
} from '@modelcontextprotocol/server';

server.registerTool(
  'deploy',
  { description: 'Deploy after the operator confirms', inputSchema: z.object({ env: z.string() }) },
  async ({ env }, ctx): Promise<CallToolResult | InputRequiredResult> => {
    const confirmed = acceptedContent(
      ctx.mcpReq.inputResponses,
      'confirm',
      z.object({ confirm: z.boolean() }),
    );
    if (confirmed?.confirm !== true) {
      return inputRequired({
        inputRequests: {
          confirm: inputRequired.elicit({
            message: `Deploy to ${env}?`,
            requestedSchema: {
              type: 'object',
              properties: { confirm: { type: 'boolean' } },
              required: ['confirm'],
            },
          }),
        },
      });
    }
    return { content: [{ type: 'text', text: `Deployed to ${env}` }] };
  },
);
```

## Progress Notifications

```ts
async ({ files }, ctx) => {
  const progressToken = ctx.mcpReq._meta?.progressToken;
  for (let i = 0; i < files.length; i++) {
    // … process files[i] …
    if (progressToken !== undefined) {
      await ctx.mcpReq.notify({
        method: 'notifications/progress',
        params: {
          progressToken,
          progress: i + 1,
          total: files.length,
          message: `Processed ${files[i]}`,
        },
      });
    }
  }
  return { content: [{ type: 'text', text: `Processed ${files.length} files` }] };
};
```

## Client Side Interaction

```ts
const client = new Client(
  { name: 'my-client', version: '1.0.0' },
  {
    capabilities: { elicitation: { form: {}, url: {} } },
    inputRequired: { maxRounds: 10, autoFulfill: true },
  },
);

client.setRequestHandler('elicitation/create', async (request) => {
  if (request.params.mode === 'url') return { action: 'accept' }; // after opening the URL
  // anything else is a form (old requests omit mode — never branch on mode === 'form')
  return { action: 'accept', content: {/* what the user entered */} };
});
```

## Cross-round State (requestState)

```ts
import { createRequestStateCodec } from '@modelcontextprotocol/server';

const stateCodec = createRequestStateCodec<{ step: string }>({
  key: crypto.getRandomValues(new Uint8Array(32)), // ≥ 32 bytes; share across a fleet
  ttlSeconds: 600,
});

const server = new McpServer(
  { name: 'releases', version: '1.0.0' },
  { requestState: { verify: stateCodec.verify } },
); // runs before every stateful entry

// inside a handler:
return inputRequired({
  inputRequests: { scope: inputRequired.elicit({/* … */}) },
  requestState: await stateCodec.mint({ step: 'confirmed' }),
});
```
