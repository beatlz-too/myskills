/// The composition root: the only file that knows the whole picture. Reads the config, wires each
/// endpoint to what it needs, and serves. No endpoint is wired yet, so every request is a 404.
///
/// `bun run serve`
import { loadConfig } from './config.ts'
import { HTTP_HOSTNAME } from './constants/http.ts'

const { http } = loadConfig()

const route = (_request: Request): Response => Response.json({ error: 'not found' }, { status: 404 })

Deno.serve({ hostname: HTTP_HOSTNAME, port: http.port }, route)
