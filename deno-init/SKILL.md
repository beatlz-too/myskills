---
name: deno-init
description: >
  Scaffolds the current (empty) directory as a bun + Deno TypeScript backend with the author's
  layered architecture, per-layer skills, AGENTS.md/CLAUDE.md rules and docs/refs standard, by
  running the `ts-deno init` CLI. Use only when the user runs /deno-init or explicitly asks to
  initialise a project with this stack.
disable-model-invocation: true
---

# deno-init

A thin wrapper: the work is done by the `ts-deno` CLI (`~/.local/bin/ts-deno`, template in
`~/.local/share/ts-deno/template`). No judgement is needed beyond the steps below.

1. **Check the directory.** Run `ls -A`. If it already holds a project (`package.json`, `src/`,
   `AGENTS.md`…), stop and ask before going on — `ts-deno init` refuses anyway unless given
   `--force`, and `--force` is passed only when the user says to overwrite.
2. **Run** `ts-deno init "<the skill's arguments, as the project description>"` — or with no
   description when none was given.
3. **Report** in a few lines: what was created, that the checks passed (or the exact failure), and —
   when no description was given — that the `TODO` paragraph at the top of `AGENTS.md` needs
   filling. Do not open or summarise the generated files.

To change what every new project gets, edit the template, not this skill.
