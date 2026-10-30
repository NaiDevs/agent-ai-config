import assert from 'node:assert/strict'
import test from 'node:test'
import { buildReadQuery } from '../query.js'

test('genera SELECT de tabla con filtros parametrizados', () => {
  assert.deepEqual(buildReadQuery({
    esquema: 'public', tabla: 'Pedidos', columnas: ['Id', 'Estado'],
    filtros: [{ columna: 'Estado', valor: 'Activo' }, { columna: 'FechaBaja', valor: null }],
    orden: { columna: 'Id', direccion: 'desc' }, limite: 20, pagina: 2,
  }), {
    text: 'SELECT "Id", "Estado" FROM "public"."Pedidos" WHERE "Estado" = $1 AND "FechaBaja" IS NULL ORDER BY "Id" DESC LIMIT $2 OFFSET $3',
    values: ['Activo', 20, 40],
  })
})

test('rechaza nombres inyectados y límites excesivos', () => {
  assert.throws(() => buildReadQuery({ esquema: 'public', tabla: 'pedidos; DELETE FROM pedidos' }))
  assert.throws(() => buildReadQuery({ esquema: 'public', tabla: 'pedidos', columnas: ['id); DROP TABLE pedidos'] }))
  assert.throws(() => buildReadQuery({ esquema: 'public', tabla: 'pedidos', limite: 101 }))
  assert.throws(() => buildReadQuery({ esquema: 'public', tabla: 'pedidos', pagina: 101 }))
})
