import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import pg from 'pg'
import { z } from 'zod'
import { buildReadQuery, sanitizeError } from './query.js'

const connectionStrings = {
  cobro: process.env.YALO_DB_URL_YALO_COBRO,
  auth: process.env.YALO_DB_URL_YALO_AUTH,
}
if (!connectionStrings.cobro && !connectionStrings.auth) {
  process.stderr.write('Faltan cadenas YALO_DB_URL_YALO_COBRO / YALO_DB_URL_YALO_AUTH.\n')
  process.exit(1)
}

for (const [base, connectionString] of Object.entries(connectionStrings)) {
  if (!connectionString) continue
  let url
  try { url = new URL(connectionString) } catch {
    process.stderr.write(`La cadena de ${base} no es una URL PostgreSQL válida.\n`)
    process.exit(1)
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.searchParams.getAll('sslmode').length !== 1 || url.searchParams.get('sslmode') !== 'verify-full') {
    process.stderr.write(`La URL de ${base} debe usar PostgreSQL y sslmode=verify-full.\n`)
    process.exit(1)
  }
  const expectedDatabase = base === 'cobro' ? 'dbyalocobro' : 'dbyaloauth'
  if (!(url.hostname === 'yalo-db-production' || url.hostname.startsWith('yalo-db-production.')) || url.pathname.slice(1).toLowerCase() !== expectedDatabase) {
    process.stderr.write(`La URL de ${base} debe apuntar al cluster y base de producción esperados.\n`)
    process.exit(1)
  }
}

const pools = Object.fromEntries(Object.entries(connectionStrings)
  .filter(([, connectionString]) => Boolean(connectionString))
  .map(([base, connectionString]) => [base, new pg.Pool({ connectionString, max: 2, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10_000 })]))
const server = new McpServer({ name: 'yalo-pos-produccion-lectura', version: '1.0.0' })

async function withReadOnly(base, action) {
  const pool = pools[base]
  if (!pool) throw new Error(`La conexión de ${base} no está configurada.`)
  const client = await pool.connect()
  try {
    await client.query('BEGIN READ ONLY')
    await client.query("SET LOCAL statement_timeout = '5s'")
    await client.query("SET LOCAL lock_timeout = '2s'")
    const check = await client.query(`
      SELECT current_setting('transaction_read_only') AS read_only,
             r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolbypassrls AS privileged,
             has_database_privilege(current_database(), 'CREATE') AS can_create_database_objects,
             EXISTS (
               SELECT 1 FROM pg_class c
               WHERE c.relkind IN ('r', 'p', 'v', 'm', 'f')
                 AND (has_table_privilege(c.oid, 'INSERT')
                   OR has_table_privilege(c.oid, 'UPDATE')
                   OR has_table_privilege(c.oid, 'DELETE')
                   OR has_table_privilege(c.oid, 'TRUNCATE'))
             ) AS can_write_tables,
             EXISTS (
               SELECT 1 FROM pg_namespace n
               WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema'
                 AND has_schema_privilege(n.oid, 'CREATE')
             ) AS can_create_schema_objects
      FROM pg_roles r WHERE r.rolname = current_user
    `)
    const role = check.rows[0]
    if (!role || role.read_only !== 'on' || role.privileged || role.can_create_database_objects || role.can_write_tables || role.can_create_schema_objects) {
      throw new Error('La cuenta configurada conserva permisos de escritura o administración. Usa un rol dedicado de solo lectura.')
    }
    return await action(client)
  } finally {
    try { await client.query('ROLLBACK') } finally { client.release() }
  }
}

function asContent(value) {
  const json = JSON.stringify(value)
  if (Buffer.byteLength(json, 'utf8') > 65_536) {
    throw new Error('El resultado excede 64 KiB. Reduce columnas o filas.')
  }
  return { content: [{ type: 'text', text: json }] }
}

function asError(error) {
  const message = error?.message?.startsWith('La cuenta configurada') || error?.message?.startsWith('El resultado excede') || error?.message?.startsWith('La conexión de') || error?.message?.startsWith('Se requiere filtro')
    ? error.message
    : sanitizeError(error)
  return { isError: true, content: [{ type: 'text', text: message }] }
}

server.tool('listar_tablas', 'Lista esquemas y tablas accesibles con la cuenta de lectura.', {
  base: z.enum(['cobro', 'auth']),
}, async ({ base }) => {
  try {
    return asContent(await withReadOnly(base, async (client) => {
      const result = await client.query(`
        SELECT n.nspname AS esquema, c.relname AS tabla, c.relkind AS tipo
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind IN ('r', 'p')
          AND n.nspname NOT IN ('pg_catalog', 'information_schema')
          AND n.nspname NOT LIKE 'pg_toast%'
          AND has_table_privilege(c.oid, 'SELECT')
        ORDER BY 1, 2 LIMIT 500
      `)
      return result.rows
    }))
  } catch (error) { return asError(error) }
})

server.tool('describir_tabla', 'Muestra columnas y tipos de una tabla legible.', {
  base: z.enum(['cobro', 'auth']),
  esquema: z.string().min(1).max(63),
  tabla: z.string().min(1).max(63),
}, async ({ base, esquema, tabla }) => {
  try {
    return asContent(await withReadOnly(base, async (client) => {
      const result = await client.query(`
        SELECT a.attname AS columna, format_type(a.atttypid, a.atttypmod) AS tipo, a.attnotnull AS no_nulo
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
          JOIN pg_attribute a ON a.attrelid = c.oid
        WHERE n.nspname = $1 AND c.relname = $2 AND a.attnum > 0 AND NOT a.attisdropped
          AND n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema'
          AND c.relkind IN ('r', 'p') AND has_table_privilege(c.oid, 'SELECT')
        ORDER BY a.attnum
      `, [esquema, tabla])
      return result.rows
    }))
  } catch (error) { return asError(error) }
})

server.tool('leer_tabla', 'Lee filas de una tabla base con filtros de igualdad, máximo 100 filas y 5 segundos. No acepta SQL libre.', {
  base: z.enum(['cobro', 'auth']),
  esquema: z.string().min(1).max(63),
  tabla: z.string().min(1).max(63),
  columnas: z.array(z.string().min(1).max(63)).max(30).default([]),
  filtros: z.array(z.object({ columna: z.string().min(1).max(63), valor: z.union([z.string(), z.number(), z.boolean(), z.null()]) })).max(5).default([]),
  orden: z.object({ columna: z.string().min(1).max(63), direccion: z.enum(['asc', 'desc']) }).optional(),
  limite: z.number().int().min(1).max(100).default(50),
  pagina: z.number().int().min(0).max(100).default(0),
}, async (args) => {
  try {
    const query = buildReadQuery(args)
    return asContent(await withReadOnly(args.base, async (client) => {
      const allowed = await client.query(`
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('r', 'p')
          AND n.nspname NOT LIKE 'pg_%' AND n.nspname <> 'information_schema'
          AND has_table_privilege(c.oid, 'SELECT')
      `, [args.esquema, args.tabla])
      if (!allowed.rowCount) throw new Error('Tabla no permitida para lectura.')
      const organizationColumn = await client.query(`
        SELECT a.attname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
          JOIN pg_attribute a ON a.attrelid = c.oid
        WHERE n.nspname = $1 AND c.relname = $2 AND a.attnum > 0 AND NOT a.attisdropped
          AND lower(a.attname) = 'codorganizacion'
        LIMIT 1
      `, [args.esquema, args.tabla])
      if (organizationColumn.rowCount && !args.filtros.some((filter) => filter.columna.toLowerCase() === 'codorganizacion' && filter.valor !== null)) {
        throw new Error('Se requiere filtro por codorganizacion para esta tabla.')
      }
      const result = await client.query(query)
      return result.rows
    }))
  } catch (error) { return asError(error) }
})

const transport = new StdioServerTransport()
await server.connect(transport)
