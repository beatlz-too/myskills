---
name: constant
description: >
  Creates a constant in __PROJECT__'s layered architecture (`src/constants/<domain>.ts`) — a value that is
  the same on every machine forever, holding no behaviour. Invoke when asked for a new constant,
  when a literal needs a home, or when deciding whether a value is a constant or configuration.
---

# Creating a Constant

Constants hold **no behaviour**. They are part of the vocabulary every other layer shares, which is
why everything may import them and they may import almost nothing.

**Location:** `src/constants/<domain>.ts` — e.g. `src/constants/orders.ts`. Grouped by domain,
one file per domain, not one file per constant.

**May import:** `types/`. Nothing else.

---

## Rules

- **`as const`** for arrays and objects: `export const QUESTION_TYPES = ['noul', 'choice', 'score'] as const`.
- **`SCREAMING_SNAKE_CASE`** for scalars, arrays, and frozen objects alike.
- **No functions.** A "constant" that computes is a util.
- **No configuration.** Anything that varies by environment or holds a secret is read in
  `src/config.ts` and passed as an argument. An API URL is a constant; an API key never is.
- **Named exports only.**

## Shape

```ts
export const ORDER_STATUSES = ['pending', 'paid', 'shipped'] as const
export const MAX_ITEMS_PER_ORDER = 50
```

A constant array declared `as const` is also the source of a union type — see the `type` skill.

## Checklist

- [ ] Lives in `src/constants/<domain>.ts`, grouped with its neighbours
- [ ] `as const`, `SCREAMING_SNAKE_CASE`
- [ ] Holds no behaviour, no environment-specific value and no secret
- [ ] Imports nothing but `types/`
