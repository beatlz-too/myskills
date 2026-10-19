/// The only file that reads the environment. Everything else takes what it needs as arguments.
///
/// Run with `--env-file=.env` so `.env` is loaded; Deno does not read it on its own. Variable names
/// are lowercase because that is how `.env` names them, and Deno's environment is case-sensitive.
import { DEFAULT_HTTP_PORT } from './constants/http.ts'

export type HttpConfig = {
  port: number
}

export type Config = {
  http: HttpConfig
}

/// `||` rather than `??` so an empty value counts as unset.
function httpConfig({ env }: { env: Deno.Env }): HttpConfig {
  const port = Number(env.get('port') || DEFAULT_HTTP_PORT)
  return { port: Number.isInteger(port) && port > 0 ? port : DEFAULT_HTTP_PORT }
}

export function loadConfig({ env = Deno.env }: { env?: Deno.Env } = {}): Config {
  return {
    http: httpConfig({ env }),
  }
}
