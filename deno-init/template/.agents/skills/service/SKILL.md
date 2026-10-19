---
name: service
description: >
  Creates a service in __PROJECT__'s layered architecture (`src/services/<domain>/`) — one thing
  done well for anybody, including every outbound HTTP call, subprocess spawn and model
  invocation. Invoke when asked for a new service, when pulling I/O out of a handler, or when
  deciding how a service takes its dependencies.
---

# Creating a Service

A service does **one thing**, for anybody who asks. It is the unit of reuse. If you can only
describe it with "and", it is two services.

**Location:** `src/services/<domain>/<verb><Thing>Service.ts` — e.g.
`src/services/payments/chargePaymentService.ts`.

**May import:** `services/`, `services/db/`, `utils/`, `constants/`, `types/`. Never `handlers/`,
never `endpoints/`.

---

## Rules

- **Single responsibility, stated without "and".** `chargePaymentService` charges a payment. It does
  not also decide the amount, also email a receipt, also store the order.
- **Objects in, objects out.** `myService({ propOne, propTwo })` returning `{ result }`.
- **Agnostic of the caller.** A service never knows whether a handler, another service, or a test
  called it, and never knows which channel the request came in on.
- **Talks to DB services for persistence — never to the database directly.**
- **Owns the outside world it names.** An HTTP call to a third-party API, a spawn, a model run.
- **Dependencies arrive as arguments.** Keys are parameters; `fetch` is a parameter defaulting to
  the global (`fetchImpl = fetch`) so a test needs no network. No module-level singletons.
- **May call other services.** Downward or sideways, never upward.
- **A live process is service work.** Anything spawned, driven and observed lives here; a handler
  holds an opaque session id, never a handle, and the id→process registry is passed in.

## Shape

```ts
import { PAYMENTS_URL } from '../../constants/payments.ts'
import type { Reservation } from '../../types/orders.ts'

export async function chargePaymentService({ reservation, apiKey, fetchImpl = fetch }: {
  reservation: Reservation
  apiKey: string
  fetchImpl?: typeof fetch
}): Promise<{ orderId: string }> {
  const response = await fetchImpl(PAYMENTS_URL, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify(reservation),
  })
  if (!response.ok) throw new Error(`payment refused: ${response.status}`)
  const { orderId } = await response.json() as { orderId: string }
  return { orderId }
}
```

The key is a parameter, not a lookup. That is what lets the same service serve an HTTP route, an
MCP tool, and a test with no network.

## Naming

**Verb first, `Service` suffix, file named for the export.** The suffix makes a handler readable at
a glance — every call with it is delegated work, everything else is a decision — and makes the
layer greppable with `rg 'Service\('`.

## Conventions that hold in every layer

- **No `.ts` file over 150 lines.** Split by responsibility.
- **Named exports only**, one per file.
- **Take inputs, return outputs.** Only `src/config.ts` reads `Deno.env`.
- **Only when the user asks for tests** (`AGENTS.md`, Tests): a test lives beside its subject,
  `Deno.test` + `node:assert/strict`.
- **Never `extends`.** Composition over inheritance.

## Checklist

- [ ] Lives under `src/services/<domain>/`
- [ ] Its job can be stated in one sentence with no "and"
- [ ] Takes one object, returns one object
- [ ] No SQL and no database import
- [ ] No transport type, no import from `handlers/` or `endpoints/`
- [ ] Reads no environment variable — everything it needs is a parameter
- [ ] Only if tests were asked for: has a `.test.ts` beside it with a fake `fetch`
