---
name: util
description: >
  Creates a util in __PROJECT__'s layered architecture (`src/utils/`) — a pure function, agnostic of every
  domain and every caller. Invoke when asked for a new util or shared helper, or when deciding
  whether a helper is shared at all rather than private to its one caller.
---

# Creating a Util

A util is a **pure function**. Same input, same output, no I/O, no clock, no randomness, no state.

**Location:** `src/utils/<verbOrPredicate>.ts` — e.g. `src/utils/normaliseText.ts`. Flat, no
domain subfolders.

**May import:** `utils/`, `constants/`, `types/`. Nothing else, ever.

---

## Rules

- **Pure.** No `fetch`, no storage, no filesystem, no `Date.now()`, no `Math.random()`, no
  `Deno.env`. If you need the time, take it as a parameter.
- **Knows no business domain.** Parsing a date string or clamping a number is vocabulary every
  layer uses, so it is a util; deciding whether an order may ship is not.
- **Written for the second caller.** A helper with exactly one caller is a private function in that
  caller's file.
- **Objects in, objects out** for anything with more than one input. A genuine unary transform
  (`titleCase(text)`) may take the value directly.
- **Report, do not throw,** for input that is expected to be wrong sometimes: return
  `{ value } | { error }`.

## Shape

```ts
export function isWithin({ value, min, max }: { value: number; min: number; max: number }): boolean {
  return value >= min && value <= max
}
```

## Conventions

- **No `.ts` file over 150 lines.** **Named exports only**, one per file.
- **Only when the user asks for tests** (`AGENTS.md`, Tests): a test lives beside its subject — a util is the cheapest thing in the repo to test.
- **Never `extends`.**

## Checklist

- [ ] Lives directly in `src/utils/`
- [ ] Deterministic — no I/O, no clock, no randomness, no global state
- [ ] Has, or will plausibly have, more than one caller
- [ ] Only if tests were asked for: has a `.test.ts` beside it
