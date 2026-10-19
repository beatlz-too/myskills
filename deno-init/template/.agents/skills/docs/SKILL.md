---
name: docs
description: >
  Writes and maintains __PROJECT__'s reference documentation in `docs/refs/` — `.ref.md` (what a system is),
  `.flow.md` (how data moves, with mermaid diagrams) and `.doc.md` (how-to or rationale) — and keeps
  `docs/refs/docs-directory.doc.json` true. Invoke when documenting a feature, when a change alters a
  documented contract or path, or when deciding whether something deserves a doc at all.
---

# Writing Docs

Every prompt starts at `docs/refs/docs-directory.doc.json`, so a doc that is not registered there
does not exist, and a registered description that is untrue is worse than none — it is trusted.

## The three suffixes

| Suffix | Purpose |
|--------|---------|
| `.ref.md` | What a system **is** — data shape, file ownership, invariants, contracts |
| `.flow.md` | How data **moves** — execution order, timing, process and network boundaries |
| `.doc.md` | How-to for a repeatable task, or the rationale behind a standard |

## Scope: feature or mechanics level only

A doc is appropriate when a reader must trace a path **across several files** to understand
something. When one file is enough, write `///` doc comments in that file instead.

| Right level | Wrong level |
|-------------|-------------|
| Placing an order (endpoint → handler → stock → payment) | The helper that formats a refusal |
| The toolchain (bun installs, Deno runs, the lint gate) | One `package.json` script |

## Splitting between the two (strict)

- A `.ref.md` **never** explains execution order or timing.
- A `.flow.md` **never** restates static data shapes or file ownership.
- When a system has no order worth describing, say so in the ref's callout ("There is no
  `.flow.md`: …") rather than writing an empty flow.

## Shape of a `.ref.md`

```md
# <System> — Reference

> **Design reference.** What <system> is made of: … For the order it happens in, see
> `<system>.flow.md`.

## Overview
## <one section per thing a reader needs: files, shapes, contracts, configuration>
## Key rules / Invariants
1. **The rule in bold.** Why it holds, in a sentence or two.
```

A file-ownership table (`| File | Owns |`) belongs in the ref. Invariants are numbered, bold-led,
and each carries its reason.

## Shape of a `.flow.md`

```md
# <System> — Flow

> **Execution reference.** The order <system> happens in, and why that order. For what it is made
> of, see `<system>.ref.md`.

One line naming the phases.

---

## <Phase one, named for what happens>
<diagram>
<prose: why the order matters>

---

## <Phase two>
```

## Diagrams

`.flow.md` files carry mermaid diagrams, **one per phase, phases separated by `---`**.

- **`sequenceDiagram`** when the flow crosses a process or network boundary (the project ↔ a
  third-party API, a client ↔ an endpoint). **`autonumber` is mandatory.**
- **`flowchart TD`** when it stays inside one process.

Rules:

- `<br>` for line breaks in labels — **never `\n`**.
- Entry and exit points are rounded nodes `([...])` (in a sequence diagram, the first and last
  message text).
- **Every node or participant names the file the step lives in** on a second line:
  `participant Svc as chargePaymentService<br>src/services/payments/chargePaymentService.ts`.
- Keep node text short and put the detail in prose.
- Prose explains **why** the order matters — it never restates what the diagram already shows.

## Hygiene

When a change is finished, ask: **does this change how a documented system works?**

- A data shape, contract or file ownership changed → update the `.ref.md`.
- An execution path, ordering or boundary changed → update the `.flow.md`.
- A new feature spanning several files → write the docs and register each in
  `docs-directory.doc.json` as `{ pipeline, type, path, description }`, with a `pipeline` a future
  prompt would actually match on and a description that says what a reader will find.
- A bug fix that leaves the contract and the path unchanged needs no doc change.

Docs change in the same commit as the code they describe, under `📃` only when the commit is
primarily documentation.

## Checklist

- [ ] Feature-level, not one file's worth
- [ ] Title `<System> — Reference` / `<System> — Flow`, callout naming the counterpart
- [ ] Ref holds no ordering; flow holds no shapes or ownership
- [ ] One diagram per phase, `autonumber` on sequences, every node names its file, `<br>` not `\n`
- [ ] Ref ends with numbered **Key rules / Invariants**, each with its reason
- [ ] Registered (or re-described) in `docs/refs/docs-directory.doc.json`
