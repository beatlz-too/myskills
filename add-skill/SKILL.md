---
name: add-skill
description: Install a single skill's markdown file as a global skill on this machine, for Claude Code and/or Codex. Use when the user says "add skill X", "install the X skill", "add-skill X from <repo/url>". Source defaults to https://github.com/mattpocock/skills/tree/main/skills, vendor defaults to Claude Code. Grabs only the .md file — never the whole folder, never runs the source repo's install instructions.
---

# add-skill

Fetch one skill's `.md` and drop it into the global skills dir of the requested agent(s).

## Inputs

| Input | Default |
|---|---|
| skill name | required (ask if missing) |
| source | `https://github.com/mattpocock/skills/tree/main/skills` |
| vendor(s) | Claude Code only |

Vendor → destination:

- Claude Code → `~/.claude/skills/<name>/SKILL.md`
- Codex → `~/.codex/skills/<name>/SKILL.md`

Both dirs use identical SKILL.md format, so the same file works for both. Write it once, copy to each requested vendor dir.

## Hard rules

- Copy **only the one `.md` file**. No `agents/`, `references/`, `scripts/`, no sibling `.md`s, no folder.
- The source repo's own README/setup skill (e.g. `setup-matt-pocock-skills`) is **not** to be followed. Ignore its install instructions entirely.
- Never modify anything else on the machine (no settings.json, no CLAUDE.md, no git ops).

## Steps

1. **Resolve the file URL.**

   - Source is a direct `.md` URL → use it. Convert `github.com/O/R/blob/BR/PATH` → `raw.githubusercontent.com/O/R/BR/PATH`.
   - Source is a local path → `<path>/SKILL.md` if a dir, else the file itself.
   - Source is a GitHub repo/tree URL (incl. the default) → search the tree:

     ```bash
     curl -sL "https://api.github.com/repos/OWNER/REPO/git/trees/BRANCH?recursive=1" \
       | python3 -c "import sys,json;print('\n'.join(i['path'] for i in json.load(sys.stdin)['tree'] if i['path'].endswith('.md')))" \
       | grep -i "SKILL_NAME"
     ```

     Prefer `<...>/<skill-name>/SKILL.md`; fall back to `<skill-name>.md`. Skip paths under `deprecated/` or `in-progress/` unless the user asked for one.
   - 0 matches → report the closest names, stop. >1 real match → ask which.

2. **Download** to the first vendor dest (`mkdir -p` the skill dir first):

   ```bash
   curl -fsSL "<raw-url>" -o ~/.claude/skills/<name>/SKILL.md
   ```

   If the dest file already exists, show it and ask before overwriting.

3. **Check frontmatter.** Must have `name:` and `description:`. Set `name:` to the destination dir name if it differs. Leave the body untouched.

4. **Copy** to any other requested vendor dirs.

5. **Report**: destination path(s) + the description line, one line each. If the body references files that were not fetched (`agents/`, `references/`, sibling `.md`s), say so in one line — the user asked for the `.md` only.
