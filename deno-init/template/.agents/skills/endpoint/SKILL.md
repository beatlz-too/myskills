---
name: endpoint
description: >
  Creates an endpoint in __PROJECT__'s layered architecture (`src/endpoints/<channel>/`) — the only
  place allowed to know a wire format. "Endpoint" means any way something outside talks to the
  project, not just HTTP: an HTTP route, a webhook, a WebSocket frame, an MCP tool call, a CLI
  invocation, a cron tick. Invoke when asked for a new endpoint, route or channel event, or when
  deciding how a payload becomes a plain object for a handler.
---

# Creating an Endpoint

An endpoint is the **only** place in the codebase allowed to know a wire format. It receives data
from a channel or protocol, normalises it, hands it to a handler, and turns the handler's plain
result back into whatever that channel expects.

## What counts as an endpoint

**Everything that carries a request across the boundary into the project.** An endpoint is any
*entry*, whatever the wire:

| Entry | Lives in | Looks like |
|-------|----------|------------|
| An HTTP route (`Deno.serve`) | `src/endpoints/http/` | `postOrder.ts` |
| A WebSocket frame | `src/endpoints/ws/` | `onOrder.ts` |
| An MCP tool call | `src/endpoints/mcp/` | `placeOrderTool.ts` |
| A CLI invocation, a webhook, a cron tick | `src/endpoints/<that>/` | one file per event |

Two things follow, and they are the whole point:

- **Adding a channel adds files here and changes nothing underneath.** If wiring MCP makes you edit
  a handler, the endpoint kept something it should have normalised away.
- **Outbound is not an endpoint.** Calling a third-party API is a *service* — it is the project
  reaching out, not something reaching in. Direction decides the layer.

**Location:** `src/endpoints/<channel>/<event>.ts`. The channel is the folder. A file under `mcp/`
may import an MCP library; a file anywhere else may not.

**May import:** `handlers/`, `utils/`, `constants/`, `types/`, and its own channel's library. Never
`services/`, never `services/db/`.

---

## Rules

- **Calls handlers. Never services, never DB services.** If you find yourself importing from
  `src/services/`, stop — the logic you are about to inline belongs in a handler.
- **Contains no business logic.** Branching on *transport* state (missing field, bad auth, wrong
  content type) is the endpoint's job; branching on domain state is not.
- **Owns four things and only four:** parsing the incoming payload, authorising the caller,
  invoking a handler, and rendering the reply for this transport.
- **Passes a plain object down.** The handler never receives a `Request` or any library type.
- **Never returns a transport type upward.** Nothing imports an endpoint except `src/index.ts`.
- One endpoint per event or route. Two routes are two files, even when they share a handler.

## Shape

```ts
import { placeOrder } from '../../handlers/orders/placeOrder.ts'

export async function postOrder({ request, paymentsKey }: {
  request: Request
  paymentsKey: string
}): Promise<Response> {
  const body = await request.json().catch(() => undefined) as { itemId?: unknown; quantity?: unknown } | undefined
  if (typeof body?.itemId !== 'string') return Response.json({ error: 'itemId must be a string' }, { status: 400 })
  if (typeof body.quantity !== 'number') return Response.json({ error: 'quantity must be a number' }, { status: 400 })

  const result = await placeOrder({ itemId: body.itemId, quantity: body.quantity, paymentsKey })
  if (result.status === 'out_of_stock') return Response.json({ error: 'out of stock' }, { status: 409 })

  return Response.json({ orderId: result.orderId })
}
```

The handler got a string and a number, not a `Request`. That is what makes the MCP version of this
file a copy with a different first and last paragraph, and no new handler at all.

## Conventions that hold in every layer

- **No `.ts` file over 150 lines.** Split by responsibility.
- **Objects in, objects out**, even at one field. **Named exports only**, one per file.
- **Take inputs, return outputs.** Only `src/config.ts` reads `Deno.env`; `src/index.ts` is the
  only file that wires an endpoint to a handler.
- **Only when the user asks for tests** (`AGENTS.md`, Tests): a test lives beside its subject,
  `Deno.test` + `node:assert/strict`.
- **Never `extends`.** Composition over inheritance.

## Checklist

- [ ] Lives under `src/endpoints/<channel>/`
- [ ] Imports nothing from `src/services/`
- [ ] Passes primitives and plain objects to the handler, not library types
- [ ] Contains no decision the domain would care about
- [ ] Wired into `src/index.ts`, and only there
- [ ] Only if tests were asked for: has a `.test.ts` beside it that fakes the handler
