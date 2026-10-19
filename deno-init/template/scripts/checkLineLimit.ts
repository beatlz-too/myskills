/// Enforces the hard rule: no `.ts` file under `src/` or `scripts/` is longer than 150 lines.
/// Exits non-zero and lists every offender, longest first.

const LIMIT = 150
const ROOTS = ['src', 'scripts']

async function* walk({ dir }: { dir: string }): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(dir)) {
    const path = `${dir}/${entry.name}`
    if (entry.isDirectory) yield* walk({ dir: path })
    else if (entry.isFile && path.endsWith('.ts')) yield path
  }
}

const offenders: { path: string; lines: number }[] = []

for (const root of ROOTS) {
  for await (const path of walk({ dir: root })) {
    const lines = (await Deno.readTextFile(path)).split('\n').length - 1
    if (lines > LIMIT) offenders.push({ path, lines })
  }
}

if (offenders.length > 0) {
  offenders.sort((a, b) => b.lines - a.lines)
  for (const { path, lines } of offenders) console.error(`${path}: ${lines} lines (limit ${LIMIT})`)
  Deno.exit(1)
}
