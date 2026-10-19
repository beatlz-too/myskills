---
name: db-service
description: >
  Creates a database service in __PROJECT__'s layered architecture (`src/services/db/<domain>/`) — the only
  layer allowed to touch storage, and the home of every insert, query, update and delete. Invoke
  when asked for a new DB service, when persistence or a schema change is needed.
---

# Creating a Database Service

A DB service is **all** of __PROJECT__'s CRUD and **none** of its meaning. It is the only layer allowed to
touch storage, and it is agnostic of everything else — it does not know what a row is for, which
channel produced it, or who is asking.

**__PROJECT__ has no database yet.** Choosing one (Deno KV, SQLite, Postgres) and adding its driver is a
decision to raise with the user, not a default. The rules below hold whichever is chosen.

**Location:** `src/services/db/<domain>/<verb><Entity>DbService.ts` — e.g.
`src/services/db/orders/insertOrderDbService.ts`.

**May import:** `utils/`, `constants/`, `types/`, and the shared connection. Nothing else.

---

## Rules

- **The only layer that touches storage.** Queries, statements, transactions, connections.
- **Called by services only.** Never by a handler, never by an endpoint.
- **No business logic.** No thresholds, no duplicate detection, no "if it's been 24 hours". A DB
  service writes what it is given and returns what it is asked for.
- **Returns rows as plain typed objects**, never a driver cursor or statement handle.
- **One statement's worth of work per file.** A file that writes then reads back is two files,
  unless they are genuinely one transaction — in which case say so in a comment.
- **Bound parameters, always.** Never interpolate a value into a query.
- **Reads no clock, generates no id, invents no default.** `createdAt` is a parameter.
- **The connection is passed in or opened by one module** that owns the path and nothing else.

## Conventions that hold in every layer

- **No `.ts` file over 150 lines.** Split by responsibility.
- **Objects in, objects out.** **Named exports only**, one per file.
- **Take inputs, return outputs.** Only `src/config.ts` reads `Deno.env`.
- **Only when the user asks for tests** (`AGENTS.md`, Tests): a test lives beside its subject, running against a temporary store.
- **Never `extends`.** Composition over inheritance.

## Checklist

- [ ] Lives under `src/services/db/<domain>/`
- [ ] Imports only `utils/`, `constants/`, `types/`, and the connection
- [ ] Contains no rule anyone outside the database would care about
- [ ] Reads no clock, generates no id, invents no default
- [ ] Every value is a bound parameter
- [ ] Returns plain objects
- [ ] Only if tests were asked for: has a `.test.ts` beside it
