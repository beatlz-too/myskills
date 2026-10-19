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

The CLI and its template are also kept next to this file, in the skill's own folder (`ts-deno` and
`template/`), and in the public repo `https://github.com/beatlz-too/myskills` under `deno-init/`.
That copy is what the fallback below uses when the machine does not have the CLI.

1. **Check the directory.** Run `ls -A`. If it already holds a project (`package.json`, `src/`,
   `AGENTS.md`…), stop and ask before going on — `ts-deno init` refuses anyway unless given
   `--force`, and `--force` is passed only when the user says to overwrite.
2. **Check the CLI.** Run `command -v ts-deno`. If it prints nothing, follow
   [When `ts-deno` is not installed](#when-ts-deno-is-not-installed) and come back.
3. **Run** `ts-deno init "<the skill's arguments, as the project description>"` — or with no
   description when none was given.
4. **Report** in a few lines: what was created, that the checks passed (or the exact failure), and —
   when no description was given — that the `TODO` paragraph at the top of `AGENTS.md` needs
   filling. Do not open or summarise the generated files.

To change what every new project gets, edit the template, not this skill. The template lives in two
places — `~/.local/share/ts-deno/template` and this repo's `deno-init/template/` — so change both.

## When `ts-deno` is not installed

Install it, then go back to step 3. Ask the user before installing anything; if they would rather
not install the CLI, do the [manual scaffold](#manual-scaffold) instead.

### Install the CLI

1. **Check bun.** Run `command -v bun`. If it is missing, stop and tell the user to install it from
   `https://bun.sh` — do not install it yourself. Deno is not needed globally: the scaffold
   installs it per project with bun.
2. **Find the source.** Use the first of these that exists:
   - this skill's own folder, if it holds both `ts-deno` and `template/` (the folder this
     `SKILL.md` was loaded from);
   - a local clone of `myskills`, at `<clone>/deno-init/`;
   - otherwise clone the repo into the scratchpad (or a fresh temp dir) and use its `deno-init/`:

     ```bash
     git clone --depth 1 https://github.com/beatlz-too/myskills.git "<tmp>/myskills"
     ```

3. **Do not overwrite an existing template.** If `~/.local/share/ts-deno/template` already exists,
   only the CLI is missing: skip copying the template and say so.
4. **Copy the CLI and template into place:**

   ```bash
   src="<the deno-init folder from step 2>"
   mkdir -p ~/.local/bin ~/.local/share/ts-deno
   install -m 755 "$src/ts-deno" ~/.local/bin/ts-deno
   cp -r "$src/template" ~/.local/share/ts-deno/template
   ```

   `cp -r` of the directory keeps the dotfiles (`.agents/`, `.env.example`); do not copy with a
   `*` glob, which drops them.
5. **Check `PATH`.** Run `command -v ts-deno`. If it is still not found, `~/.local/bin` is not on
   `PATH`: either run it as `~/.local/bin/ts-deno` for this session, or tell the user to add
   `export PATH="$HOME/.local/bin:$PATH"` to their shell profile. Do not edit the profile yourself.
6. **Verify.** `ts-deno help` prints the usage. Then return to step 3 of the main steps.

### Manual scaffold

Use this only when the user declines installing the CLI. It reproduces `ts-deno init` exactly; run
every command from the target directory, with `$src` set to the `deno-init` folder found in
step 2 above. bun must be installed (step 1 above).

1. **Name the project.** `project` is the directory name; `package` is that name lowercased, with
   every character outside `a-z 0-9 . _ -` replaced by `-`, and leading `.`, `_` or `-` removed:

   ```bash
   project="$(basename "$(pwd)")"
   package="$(printf '%s' "$project" | tr '[:upper:]' '[:lower:]' \
     | sed -e 's/[^a-z0-9._-]/-/g' -e 's/^[._-]*//')"
   ```

2. **Pick the description:** the skill's arguments, or exactly
   `TODO: describe in one paragraph what this project is and does.` when none were given.
3. **Refuse to clobber.** If any of `AGENTS.md`, `CLAUDE.md`, `package.json`, `deno.json`, `src`,
   `docs` or `.agents` already exists, stop and ask; continue only if the user says to overwrite.
4. **Copy the template, dotfiles included:** `cp -r "$src/template"/. .`
5. **Merge `.gitignore`.** If there was no `.gitignore`, rename `gitignore.template` to
   `.gitignore`. If there was one, append each non-empty line of `gitignore.template` that is not
   already in it, then delete `gitignore.template`.
6. **Fill the placeholders** in every file (skipping `node_modules/` and `.git/`): `__PROJECT__` →
   `$project`, `__PACKAGE__` → `$package`, `__DESCRIPTION__` → the description. Escape `\`, `|`
   and `&` in the values first, since they are special in the `sed` replacement:

   ```bash
   escape() { printf '%s' "$1" | sed -e 's/[\\|&]/\\&/g'; }
   find . -path ./node_modules -prune -o -path ./.git -prune -o -type f -print0 \
     | xargs -0 sed -i \
       -e "s|__PROJECT__|$(escape "$project")|g" \
       -e "s|__PACKAGE__|$(escape "$package")|g" \
       -e "s|__DESCRIPTION__|$(escape "$description")|g"
   ```

   Afterwards `grep -rn '__[A-Z]*__' --exclude-dir=node_modules --exclude-dir=.git .` must print
   nothing.
7. **Link the skills** so Claude Code sees the same files as other agents — one relative symlink per
   skill, not a copy:

   ```bash
   mkdir -p .claude/skills
   for skill in .agents/skills/*/; do
     name="$(basename "$skill")"
     ln -sfn "../../.agents/skills/$name" ".claude/skills/$name"
   done
   ```

8. **Create `.env`** from `.env.example` unless `.env` already exists: `[ -f .env ] || cp .env.example .env`
9. **Install and check**, in this order, stopping at the first failure:

   ```bash
   bun add --dev deno @types/node
   bun run fmt
   bun run check
   bun run lint
   ```

10. **Initialise git** only if this is not already inside a repo, and never commit:
    `git rev-parse --is-inside-work-tree >/dev/null 2>&1 || git init -q -b main`
11. **Report** as in step 4 of the main steps, and add one line saying the project was scaffolded
    by hand because `ts-deno` is not installed.
