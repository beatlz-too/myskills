# Code Architecture

> **Counterpart:** the operational half of this document is a set of skills in `.agents/skills/`.
> `architecture` decides where a file goes and what it may import; one skill per layer —
> `endpoint`, `handler`, `service`, `db-service`, `util`, `constant`, `type` — says what that file
> must look like. This document is *why*. Read the skill before writing a file; read this before
> arguing with the skill.

__PROJECT__'s work must not know how it was asked for. HTTP is one way in; MCP, a WebSocket, a
CLI, a webhook or a cron tick are others, and none of them may be visible to the work underneath.
The layers exist so that adding a way in is a new file at the edge and no change anywhere else.

---

## The layers

| Layer | Location | Job | Never |
|-------|----------|-----|-------|
| **Endpoint** | `src/endpoints/<channel>/` | Receive anything arriving from outside, normalise, reply | Contains business logic; imports a service |
| **Handler** | `src/handlers/<domain>/` | Decide what happens; orchestrate services | Touches storage; knows a transport |
| **Service** | `src/services/<domain>/` | Do one thing, for anybody | Knows its caller; holds a query |
| **DB service** | `src/services/db/<domain>/` | All CRUD | Holds a rule anyone outside storage cares about |
| **Util** | `src/utils/` | Pure helpers | Does I/O; knows a business domain |
| **Constants / Types** | `src/constants/`, `src/types/` | Shared vocabulary | Holds behaviour or configuration |

The **layer is the outer folder** because the layer determines the rules; the **domain is the inner
folder** because that is how a human looks for things.

---

## Dependencies point one way

| A file in… | May import from |
|-----------|-----------------|
| `endpoints/` | `handlers/`, `utils/`, `constants/`, `types/` |
| `handlers/` | `handlers/`, `services/`, `utils/`, `constants/`, `types/` |
| `services/` | `services/`, `services/db/`, `utils/`, `constants/`, `types/` |
| `services/db/` | `utils/`, `constants/`, `types/` |
| `utils/` | `utils/`, `constants/`, `types/` |
| `constants/`, `types/` | `types/` |

`src/index.ts` is the composition root and the only file permitted to know the whole picture.
`src/config.ts` is the only file that reads `Deno.env`.

### Why an endpoint may not call a service

For a simple flow the handler looks like an empty pass-through. Keep it anyway. When a second
channel arrives, the question is whether its version of a feature is a *new file* or a *rewrite*.
With a handler in between, the new endpoint is: unwrap the payload, call the same handler, render
the result. The pass-through handler is the seam, bought before it is needed, because it cannot be
bought afterwards without touching everything.

### Why direction decides the layer

Something outside *pushing* in — a request, a webhook — is an endpoint, and its whole job is to
turn the payload into the project's own shape. The project *pulling* from outside — polling an
API, reading a file — is a service, and what triggers the pull (a cron tick, a CLI command) is the
endpoint. Either way the handler receives the same plain shape and never learns where it came from.

### Why a handler may not touch storage

A handler that writes a row has made storage part of the flow's definition. Every future caller
inherits the decision. Behind a service, storage can change, stop, or start caching, and no flow
above it changes.

### Why everything takes and returns objects

`myService({ propOne, propTwo })` returning `{ result }`, always, even at one field. A positional
signature is a promise that the argument list will never grow; it always grows. Object parameters
make a new field additive, name every value at the call site, and never compile when two values
swap places.

---

## Principles (HARD RULES)

- **Composition over inheritance.** No `extends`, no abstract bases, no `super`. Two things that
  share behaviour share a function.
- **Single responsibility.** One module, one reason to change. A name with "and" in it is two files.
- **Reusability.** A module never knows who calls it. Dependencies — keys, `fetch`, clocks,
  registries — arrive as arguments, which is also what makes every layer testable with no network.
- **No `.ts` file over 150 lines**, enforced by `bun run lint` (`scripts/checkLineLimit.ts`). The
  limit is a smell detector: a long file is doing more than one thing. Split by responsibility.

---

## What this buys

- **A second way in is one file.** MCP, a WebSocket, a CLI: a new endpoint, zero changes underneath.
- **A second consumer of a flow is one import.** Handlers call handlers.
- **A storage change is invisible above `services/db/`.**
- **A test needs no network.** Every layer takes its dependencies as arguments.
