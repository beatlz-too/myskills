---
name: handler
description: >
  Creates a handler in __PROJECT__'s layered architecture (`src/handlers/<domain>/`) — the layer
  that decides what a flow does and orchestrates services, knowing nothing of the transport and
  nothing of the database. Invoke when asked for a new handler, when an endpoint has grown a
  decision, or when working out what a flow should return.
---

# Creating a Handler

A handler is where a flow is **decided**. It receives already-normalised data from an endpoint,
works out what that data is for, calls the services that do the work, and returns a plain result.

It is the layer that makes a second channel cheap: the endpoint changes per transport, the handler
never does.

**Location:** `src/handlers/<domain>/<verb><Thing>.ts` — e.g. `src/handlers/orders/placeOrder.ts`.

**May import:** `handlers/`, `services/`, `utils/`, `constants/`, `types/`. Never `services/db/`,
never `endpoints/`, never a transport library.

---

## Rules

- **Never writes to the database.** Never imports anything under `src/services/db/`.
- **Never knows the transport.** No HTTP types, no MCP types, no channel ids treated as anything
  but opaque strings.
- **Orchestrates; does not implement.** A handler that contains a `fetch`, a regex over a payload,
  or a SQL string is doing a service's job.
- **May call other handlers.** A richer flow reuses a simpler one rather than duplicating it.
- **Returns a plain result object** describing *what happened* — `{ status: 'placed', orderId }`,
  never a rendered reply for a specific transport.
- **Errors a caller can act on are returned, not thrown.** Throw only for exceptional states.

## Shape

```ts
import { reserveStockService } from '../../services/orders/reserveStockService.ts'
import { chargePaymentService } from '../../services/payments/chargePaymentService.ts'

export async function placeOrder({ itemId, quantity, paymentsKey }: {
  itemId: string
  quantity: number
  paymentsKey: string
}): Promise<{ status: 'placed'; orderId: string } | { status: 'out_of_stock' }> {
  const { reservation } = await reserveStockService({ itemId, quantity })
  if (!reservation) return { status: 'out_of_stock' }

  const { orderId } = await chargePaymentService({ reservation, apiKey: paymentsKey })
  return { status: 'placed', orderId }
}
```

Every line is a decision or a delegation — and the `Service` suffix is what makes that readable at
a glance.

## Conventions that hold in every layer

- **No `.ts` file over 150 lines.** Split by responsibility.
- **Objects in, objects out**, even at one field. **Named exports only**, one per file.
- **Take inputs, return outputs.** Only `src/config.ts` reads `Deno.env`.
- **Only when the user asks for tests** (`AGENTS.md`, Tests): a test lives beside its subject,
  `Deno.test` + `node:assert/strict`.
- **Never `extends`.** Composition over inheritance.

## Checklist

- [ ] Lives under `src/handlers/<domain>/`
- [ ] Imports nothing from `src/services/db/`
- [ ] Imports no transport library and names no platform
- [ ] Every unit of real work is a service call
- [ ] Returns a plain result object, not rendered text
- [ ] Only if tests were asked for: has a `.test.ts` beside it that fakes its services
