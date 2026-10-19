# __PROJECT__ — Agent Rules

__DESCRIPTION__

**This project is independent.** It shares conventions with other repos by the author, and nothing
else: it imports nothing from them and assumes no checkout of them exists.

---

## Stack

Deliberately small. **Adding a dependency is a decision to raise with the user, not a default.**

| Concern | Choice | Notes |
|---------|--------|-------|
| Package manager | **bun** | `bun install`, `bun add`. `package.json` is the only manifest; Deno reads `node_modules` (`"nodeModulesDir": "manual"`). |
| Runtime / backend | **Deno** | Installed as a dev dependency through bun. `Deno.serve` for HTTP. No build step. |
| Language | **TypeScript**, strict | Pure TS. `bun run check` runs `deno check`. Imports carry `.ts`. |
| Tests | **`Deno.test`** + `node:assert/strict` | `bun run test`. No test runner dependency. Written and run only when the user asks (below). |
| Database | **not chosen yet** | Raise with the user before the first DB service. |

```
bun install          # deps (Deno included)
bun run check        # deno check src/
bun run test         # deno test
bun run lint         # deno lint + the 150-line limit
bun run fmt          # deno fmt
bun run serve        # src/index.ts with .env
```

Config comes from the environment, read in `src/config.ts` and nowhere else. `.env` is gitignored
and may hold live credentials — **never commit it, never echo a secret into logs, chat, or a commit
message.** Deno does not load `.env` by itself; run with `--env-file=.env`. Every variable is listed,
without a value, in `.env.example`.

---

## Find the docs before you do anything (HARD RULE)

**Every prompt starts at `docs/refs/docs-directory.doc.json`**: every doc as
`{ pipeline, type, path, description }`. Match the prompt to a `pipeline`, then open only those
entries. **Never open a file in `docs/refs/` to find out what is in it.** If no pipeline matches,
say so and ask whether the topic should be documented. A change that makes an entry untrue, or adds
a doc, updates the directory in the same commit.

**Invoke the `docs` skill before writing or changing any doc.** It holds the full standard; in
short:

| Suffix | Purpose |
|--------|---------|
| `.ref.md` | What a system **is** — data shape, file ownership, invariants, contracts |
| `.flow.md` | How data **moves** — execution order, timing, process and network boundaries |
| `.doc.md` | How-to for a repeatable task, or the rationale behind a standard |

- **Feature level only.** A doc exists when understanding means tracing several files; one file's
  worth is a `///` comment in that file.
- **The split is strict.** A `.ref.md` never explains order or timing; a `.flow.md` never restates
  shapes or ownership. Each opens with a callout naming its counterpart.
- **Diagrams** live in `.flow.md`, one mermaid diagram per phase, phases separated by `---`:
  `sequenceDiagram` with `autonumber` across a process or network boundary, `flowchart TD` inside
  one process. `<br>` never `\n`, entry and exit as rounded nodes, every node names its file, and
  prose says why the order matters rather than restating the diagram.
- **A `.ref.md` ends with numbered Key rules / Invariants**, each with its reason.
- **Hygiene.** A changed contract updates the ref; a changed path updates the flow; a new
  multi-file feature gets docs registered in the directory. A bug fix that changes neither needs
  nothing.

---

## Layered architecture (HARD RULE)

**`docs/refs/code-architecture.doc.md` and the skills in `.agents/skills/` are binding.** Invoke a
skill before writing any source file: `architecture` when the layer is in question, otherwise the
layer's own — `endpoint`, `handler`, `service`, `db-service`, `util`, `constant`, `type`.

| Layer | Location | Job |
|-------|----------|-----|
| Endpoint | `src/endpoints/<channel>/` | Receive anything from outside — HTTP, WS, MCP, CLI, a webhook, a cron tick — and reply on it |
| Handler | `src/handlers/<domain>/` | Decide what happens; orchestrate services |
| Service | `src/services/<domain>/` | Do one thing, for anybody — including every outbound call |
| DB service | `src/services/db/<domain>/` | All CRUD, and nothing else |
| Util | `src/utils/` | Pure helpers |
| Constant / Type | `src/constants/`, `src/types/` | Values and shapes |

The three rules violated most:

- **An endpoint never imports a service** — it calls a handler, even a pass-through one.
- **A handler never touches storage** and never imports `services/db/`.
- **Only `src/endpoints/<channel>/` imports a transport library.**

`src/index.ts` is the composition root, the only file that knows the whole picture.

---

## Principles (HARD RULES)

- **No `.ts` file longer than 150 lines.** `bun run lint` fails on one. Split by responsibility.
- **Composition over inheritance.** No `extends` without a one-sentence justification (usually "the
  framework demands it"). No abstract bases, no template methods, no `super` chains. Do not reach
  for a class where a function and a type would do.
- **Single responsibility.** One module, one reason to change. If its name needs "and", split it.
- **Reusability and composition.** A module never knows who calls it. Take inputs, return outputs:
  keys, `fetch`, clocks and registries arrive as arguments. Objects in, objects out —
  `myService({ propOne })` returning `{ result }`. Named exports only, one per file. Write for the
  *second* caller.

---

## Tests (HARD RULE)

**Do not write or run tests unless the user specifically asks for them.** This applies across the
whole project, and it overrides every skill and doc that says a file "has a `.test.ts` beside it".
With no such request, add no `.test.ts` file, change no existing test, and do not run
`bun run test`. When a change breaks one, say so rather than fixing it unasked. `bun run check` and
`bun run lint` are not tests and still run.

When tests are asked for, they follow the convention: `foo.ts` → `foo.test.ts` beside it,
`Deno.test` and `node:assert/strict`, no network.

---

## Git (HARD RULE)

**The global `git` skill is binding.** Read it before any git operation.

- **Never commit on `main`. Never push to `main`.** Check the branch first.
- **Commit messages:** `ActionEmoji Topic(Subtopic) : imperative verb brief description` — e.g.
  `🌟 Services(payments) : charge a reserved order`.
- **Branches:** `feat/`, `fix/`, `hotfix/`, `release/`, `chore/`, `docs/`.
- **Never rewrite published history** unless the user explicitly asks.

---

## Shared agent assets

Canonical skills live in `.agents/skills/`; `.claude/skills/*` are symlinks to them. `CLAUDE.md`
points here and holds no independent rules — the two must never contradict each other.
