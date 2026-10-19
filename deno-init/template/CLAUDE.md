# Claude Code — __PROJECT__

Canonical rules for this repository live in **`AGENTS.md`**. Read it and follow it.

This file holds no independent rules. Anything that contradicts `AGENTS.md` is a bug in this file.

Load-bearing enough to restate:

- **Find the docs first.** Start at `docs/refs/docs-directory.doc.json`, match a `pipeline`, open
  only those entries. Never open a `docs/refs/` file to see what is in it.
  Docs follow the `docs` skill: `.ref.md` is what a system is, `.flow.md` how data moves (mermaid,
  one diagram per phase), `.doc.md` a how-to.
- **The layered architecture is a hard rule.** Invoke a skill before writing any source file —
  `architecture`, or the layer's own: `endpoint`, `handler`, `service`, `db-service`, `util`,
  `constant`, `type`. Endpoints call handlers, never services; handlers never touch storage.
- **No `.ts` file over 150 lines.** Composition over inheritance. Single responsibility.
- **Stack:** bun is the package manager, Deno the runtime, pure TypeScript. `bun run check`,
  `bun run test`, `bun run lint`.
- **No tests unless asked.** Do not write or run tests (`.test.ts`, `bun run test`) unless the user
  specifically asks. This overrides the skills' "has a `.test.ts`" lines.
- **Git follows the global `git` skill.** Never commit on `main`; emoji commit format.
