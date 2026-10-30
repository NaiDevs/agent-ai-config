import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

test('MCP expone solo herramientas de lectura y bloquea escritura antes de conectar', async () => {
  const serverPath = fileURLToPath(new URL('../index.js', import.meta.url))
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    env: {
      ...process.env,
      YALO_DB_URL_YALO_COBRO: 'postgresql://lector:clave@yalo-db-production.example:5432/dbyalocobro?sslmode=verify-full',
    },
  })
  const client = new Client({ name: 'prueba-lectura', version: '1.0.0' })
  try {
    await client.connect(transport)
    const tools = await client.listTools()
    assert.deepEqual(tools.tools.map((tool) => tool.name).sort(), [
      'describir_tabla', 'leer_tabla', 'listar_tablas',
    ])
    const result = await client.callTool({ name: 'leer_tabla', arguments: { base: 'cobro', esquema: 'public', tabla: 'pedidos; DELETE FROM pedidos' } })
    assert.equal(result.isError, true)
  } finally {
    await client.close()
  }
})
