---
name: type
description: >
  Creates a type in __PROJECT__'s layered architecture (`src/types/<domain>.ts`) — a shared shape that
  crosses a layer boundary, compiling away to nothing. Invoke when asked for a new type, when a
  shape is needed by more than one file, or when deciding between a union, an enum and an interface.
---

# Creating a Type

Types hold **no behaviour**. They are the vocabulary every other layer shares.

**Location:** `src/types/<domain>.ts` — e.g. `src/types/orders.ts`.

**May import:** `types/`, and `constants/` for `typeof` only. No runtime import.

---

## Rules

- **`type` over `interface`** unless you genuinely need declaration merging.
- **No enums.** Derive a union from a constant — one source of truth, and it survives `JSON.parse`:
  ```ts
  import type { ORDER_STATUSES } from '../constants/orders.ts'
  export type OrderStatus = (typeof ORDER_STATUSES)[number]
  ```
- **Shared shapes only.** A type used by exactly one file is declared in that file.
- **Transport types live under the channel that owns them** (`src/types/http.ts`) and are imported
  only by that channel's endpoints.
- **Never `extends`.** Compose shapes with intersections and unions.
- **Named exports only.**

## Shape

```ts
export type Order = {
  id: string
  itemId: string
  quantity: number
  status: OrderStatus
  createdAt: string
}

export type PlaceOrderResult =
  | { status: 'placed'; orderId: string }
  | { status: 'out_of_stock' }
```

A union of what can actually happen forces every caller to handle each case.

## Checklist

- [ ] Lives in `src/types/<domain>.ts`, grouped with its neighbours
- [ ] Holds no behaviour and no value
- [ ] Unions derived from `as const` arrays rather than enums
- [ ] Nothing in it is used by only one file
- [ ] Imports nothing at runtime
