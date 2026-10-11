/**
 * MCP local — controla el timer de Yalo Trackeo Desktop via yt.exe
 * Registrado como stdio server en ~/.claude/settings.json
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { spawnSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

// ── Localizar yt.exe ──────────────────────────────────────────────────────────

function ytPath() {
  const localAppData = process.env.LOCALAPPDATA ?? ''
  const prod = join(localAppData, 'com.yalo.trackeo', 'yt.exe')
  if (existsSync(prod)) return prod

  // dev build: busca relativo al proyecto yalo-trackeo-desktop
  const devBases = [
    'C:\\Users\\naide\\OneDrive\\Documentos\\Proyectos\\yalo-trackeo-desktop\\src-tauri\\target\\debug\\yt.exe',
    'C:\\Users\\naide\\OneDrive\\Documentos\\Proyectos\\yalo-trackeo-desktop\\src-tauri\\target\\release\\yt.exe',
  ]
  for (const p of devBases) {
    if (existsSync(p)) return p
  }
  return null
}

function runYt(...args) {
  const exe = ytPath()
  if (!exe) {
    return { ok: false, output: 'yt.exe no encontrado. Compilá yalo-trackeo-desktop primero.' }
  }
  const result = spawnSync(exe, args, { encoding: 'utf8', timeout: 10_000 })
  const output = (result.stdout ?? '') + (result.stderr ?? '')
  return { ok: result.status === 0, output: output.trim() }
}

// ── Servidor MCP ──────────────────────────────────────────────────────────────

const server = new McpServer({ name: 'yalo-trackeo-timer', version: '1.0.0' })

server.tool(
  'timer_status',
  'Estado actual del timer de Yalo Trackeo Desktop: si está corriendo, qué tarea, cuánto tiempo lleva.',
  {},
  async () => {
    const { ok, output } = runYt('status')
    return { content: [{ type: 'text', text: ok ? output : `Error: ${output}` }] }
  },
)

server.tool(
  'timer_start',
  'Inicia el timer en una tarea específica. Detiene cualquier tarea anterior y abre la app si estaba cerrada. Usar cuando empieces a trabajar en una tarea.',
  { task_id: z.string().describe('ID de la tarea, ej. YATR-110 o YCON-45') },
  async ({ task_id }) => {
    const { ok, output } = runYt('start', task_id)
    if (!ok) return { content: [{ type: 'text', text: `Error al iniciar timer: ${output}` }] }
    return { content: [{ type: 'text', text: `▶ Timer iniciado en ${task_id}` }] }
  },
)

server.tool(
  'timer_stop',
  'Detiene el timer activo. Usar al terminar de trabajar o antes de cambiar de tarea.',
  {},
  async () => {
    const { ok, output } = runYt('stop')
    if (!ok) return { content: [{ type: 'text', text: `Error al detener timer: ${output}` }] }
    return { content: [{ type: 'text', text: '■ Timer detenido.' }] }
  },
)

server.tool(
  'timer_resume',
  'Reanuda el timer en la última tarea trabajada.',
  {},
  async () => {
    const { ok, output } = runYt('resume')
    if (!ok) return { content: [{ type: 'text', text: `Error al reanudar: ${output}` }] }
    return { content: [{ type: 'text', text: `▶ Timer reanudado.` }] }
  },
)

// ── Arrancar ──────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport()
await server.connect(transport)
