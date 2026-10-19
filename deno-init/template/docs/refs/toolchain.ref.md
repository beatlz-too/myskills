# Toolchain — Reference

> **Design reference.** What __PROJECT__ is built and checked with: who installs, who runs, where
> configuration comes from, and the gates every change passes. There is no `.flow.md`: each command
> is one tool invoked once, with nothing to sequence.

---

## Overview

Two tools with one job each. **bun manages packages; Deno runs the code.** Nothing in `src/` is
compiled or bundled: Deno executes its TypeScript directly.

| Concern | Tool | Where it is set |
|---------|------|-----------------|
| Installing dependencies | bun | `package.json`, `bun.lock` |
| Running, type-checking, testing, linting, formatting | Deno | `deno.json` |
| Deno itself | installed by bun as a dev dependency | `package.json` → `devDependencies.deno` |
| The 150-line limit | a Deno script | `scripts/checkLineLimit.ts` |
| Environment | Deno's `--env-file` | `.env` (gitignored), `.env.example` |

---

## Files

| File | Owns |
|------|------|
| `package.json` | The one dependency manifest, and the scripts every command goes through |
| `bun.lock` | Exact versions; committed |
| `deno.json` | Compiler strictness, `nodeModulesDir: "manual"`, fmt and lint settings |
| `scripts/checkLineLimit.ts` | Failing on any `.ts` file under `src/` or `scripts/` over 150 lines |
| `src/config.ts` | The only reader of `Deno.env` |
| `.env.example` | Every variable __PROJECT__ reads, with no values |

---

## Why bun installs and Deno runs

`deno.json` sets **`"nodeModulesDir": "manual"`**: Deno resolves packages from the `node_modules`
that `bun install` wrote, and never fetches or installs anything itself. So there is one manifest
(`package.json`), one lock (`bun.lock`), and one command that changes dependencies (`bun add`).
Deno is itself one of those dependencies — the `deno` npm package ships the binary — so a fresh
clone needs only bun.

A consequence: **every package Deno needs must be in `package.json`**, including type packages.
`node:assert/strict` in the tests type-checks only because `@types/node` is installed; without it
`deno check` fails with *Could not find a matching package for 'npm:@types/node'*.

`jsr:` and `https:` imports are not used — they would be fetched by Deno and bypass bun.

---

## Commands

All run through `bun run`, which puts `node_modules/.bin/deno` on the path.

| Command | Runs | Fails when |
|---------|------|-----------|
| `bun install` | bun | — |
| `bun run check` | `deno check src/` | a type error |
| `bun run test` | `deno test --allow-env src/` | a test fails |
| `bun run serve` | `src/index.ts` on `127.0.0.1` and the `port` from `.env` (8000 when unset), with network only to itself | — |
| `bun run lint` | `deno lint`, then `scripts/checkLineLimit.ts` | a lint rule, or a file over 150 lines |
| `bun run fmt` | `deno fmt` | — (rewrites in place) |

Formatting: no semicolons, single quotes, 110 columns. Lint uses Deno's recommended rules —
`require-await` is the one that bites, so a fake `fetch` returns `Promise.resolve(…)` rather than
being an `async` function with no `await`.

---

## Tests

Tests are written and run **only when the user asks** (`AGENTS.md`, Tests). When they are:

`foo.ts` → `foo.test.ts`, beside it. `Deno.test` for cases and `node:assert/strict` for assertions
(`assert.deepEqual`, `assert.rejects`), so no test library is a dependency. Tests never touch the
network: every service takes `fetchImpl`, and a test hands it a function returning a `Response`.

---

## Environment

`.env` may hold live keys and is gitignored; `.env.example` lists the names. **Deno does not load
`.env` on its own** — a command that needs it runs with `--env-file=.env`. Variable names are
lowercase (a vendor's own spelling, such as `OPENAI_API_KEY`, excepted) because that is how `.env`
names them, and Deno's environment is case-sensitive.

A missing key switches off what needs it rather than stopping the project.

---

## Key rules / Invariants

1. **One manifest.** Dependencies change through `bun add` and nowhere else; Deno never installs.
2. **No `.ts` file over 150 lines.** `bun run lint` is the gate, not review.
3. **Only `src/config.ts` reads the environment.** Everything else takes values as arguments, which
   is what lets `bun run test` run with no `.env` at all.
4. **No build step.** Deno runs `src/` as written. Any build step is a decision for the user, not a
   default.
