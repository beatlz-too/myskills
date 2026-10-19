---
name: architecture
description: >
  Places code in __PROJECT__'s layered architecture and routes to the skill that writes it —
  endpoint, handler, service, db-service, util, constant, type. Invoke before writing any new
  source file, when deciding which layer a piece of logic belongs in, or when adding a way in
  (HTTP, a webhook, WebSocket, MCP, CLI, a cron tick).
---

# Architecture Skill

Every layer below exists so that adding a second way in — HTTP today, MCP or a CLI tomorrow — is a
new endpoint file and nothing else. The business rules live in the layers underneath and never
learn who called them.

The full statement of intent is `docs/refs/code-architecture.doc.md`. This skill is the
**operational** half: where a file goes and what it may import. **How to write one lives in a skill
per layer** — this skill's job is to pick which.

---

## The layers, and the skill that writes each

| Layer | Location | One-line job | Skill |
|-------|----------|--------------|-------|
| Endpoint | `src/endpoints/<channel>/` | Receive anything arriving from outside and reply on it | `endpoint` |
| Handler | `src/handlers/<domain>/` | Orchestrate a flow; decide what happens | `handler` |
| Service | `src/services/<domain>/` | Do one thing, well, for anybody | `service` |
| DB service | `src/services/db/<domain>/` | All CRUD, and nothing else | `db-service` |
| Util | `src/utils/` | Pure helpers, agnostic of everything | `util` |
| Constant | `src/constants/` | Values, no behaviour | `constant` |
| Type | `src/types/` | Shapes, no behaviour | `type` |

Each layer directory is subdivided **by domain**, not flattened: `src/services/orders/`,
`src/handlers/orders/`, `src/endpoints/http/`. The layer is the outer folder because the layer
determines the rules; the domain is the inner folder because that is how a reader looks for things.

**When the layer is already known — "write a service that…", "add a route for…" — invoke that
layer's skill directly.** This one is for when it is not, and for the rules that span layers.

---

## Dependency direction (HARD RULE)

Dependencies point **inward and downward only**. Nothing imports a layer above it. Ever.

| A file in… | May import from |
|-----------|-----------------|
| `endpoints/` | `handlers/`, `utils/`, `constants/`, `types/` |
| `handlers/` | `handlers/`, `services/`, `utils/`, `constants/`, `types/` |
| `services/` | `services/`, `services/db/`, `utils/`, `constants/`, `types/` |
| `services/db/` | `utils/`, `constants/`, `types/` |
| `utils/` | `utils/`, `constants/`, `types/` |
| `constants/`, `types/` | `types/` |

Three consequences that catch people:

- **An endpoint never imports a service.** If an endpoint needs a service, it needs a handler that
  needs the service. That indirection is the entire reason a second channel is cheap.
- **A handler never imports `services/db/`.** Handlers do not know a database exists.
- **`src/index.ts` is the only file allowed to know the whole picture.** It is the composition root.
  `src/config.ts` is the only file that reads `Deno.env`.

If two layers need to meet in a way this table forbids, the design is wrong. Stop and say so.

---

## Choosing a layer

Ask, in order:

1. **Does it know a wire format something outside arrived in?** (an HTTP `Request`, a webhook
   payload, an MCP tool call, a WS frame, CLI args) → endpoint. Inbound only — reaching *out* is a
   service.
2. **Does it decide what happens next, or coordinate more than one service?** → handler.
3. **Does it talk to a database?** → DB service.
4. **Does it do exactly one thing against the outside world or a domain rule?** → service.
5. **Is it pure — same input, same output, no I/O?** → util.
6. **Is it a value?** → constant. **A shape?** → type.

If two answers fit, the file is two files.

**Direction decides the layer.** Something outside *pushing* in (a webhook, a request) is an
endpoint. The project *pulling* from something outside (polling an API, reading a file) is a
service, and what triggers the pull — a cron tick, a CLI command — is the endpoint.

---

## Universal conventions (HARD RULES)

- **No `.ts` file longer than 150 lines.** `bun run lint` enforces it. A file approaching the limit
  is doing two things — split by responsibility, never by line count alone.
- **Composition over inheritance.** Never `extends`, no abstract bases, no `super` chains. Share a
  function, not an ancestor. Do not reach for a class where a function and a type would do.
- **Single responsibility.** If you cannot name what a module does without "and", split it.
- **Objects in, objects out.** Every function that takes more than nothing takes a single object:
  `myService({ propOne, propTwo })`, and returns an object. The second parameter always arrives.
- **Named exports only.** No default exports. **One exported unit per file**, named as the file.
- **Take inputs, return outputs.** Tokens, clocks, `fetch` and registries arrive as arguments.
- **Imports carry their `.ts` extension** — Deno resolves nothing without it.
- **Only when the user asks for tests** (`AGENTS.md`, Tests): a test lives beside its subject:
  `foo.ts` → `foo.test.ts`, written with `Deno.test` and `node:assert/strict`, run with
  `bun run test`.
