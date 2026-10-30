export const MAX_ROWS = 100

function quoteIdentifier(identifier) {
  if (typeof identifier !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]{0,62}$/.test(identifier)) {
    throw new Error('Nombre de esquema, tabla o columna no válido.')
  }
  return `"${identifier}"`
}

export function buildReadQuery({ esquema, tabla, columnas = [], filtros = [], orden, limite = 50, pagina = 0 }) {
  if (!Number.isInteger(limite) || limite < 1 || limite > MAX_ROWS) {
    throw new Error(`El límite debe estar entre 1 y ${MAX_ROWS}.`)
  }
  if (!Number.isInteger(pagina) || pagina < 0 || pagina > 100) {
    throw new Error('La página debe estar entre 0 y 100.')
  }
  if (columnas.length > 30 || filtros.length > 5) {
    throw new Error('Demasiadas columnas o filtros.')
  }
  const fields = columnas.length ? columnas.map(quoteIdentifier).join(', ') : '*'
  const values = []
  const conditions = filtros.map(({ columna, valor }) => {
    const name = quoteIdentifier(columna)
    if (valor === null) return `${name} IS NULL`
    values.push(valor)
    return `${name} = $${values.length}`
  })
  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''
  const orderBy = orden ? ` ORDER BY ${quoteIdentifier(orden.columna)} ${orden.direccion === 'desc' ? 'DESC' : 'ASC'}` : ''
  values.push(limite, pagina * limite)
  return {
    text: `SELECT ${fields} FROM ${quoteIdentifier(esquema)}.${quoteIdentifier(tabla)}${where}${orderBy} LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  }
}

export function sanitizeError(error) {
  if (error?.code === '57014') return 'La consulta superó el tiempo permitido.'
  if (error?.code === '42501') return 'El usuario de base de datos no tiene permiso de lectura para este recurso.'
  return 'La consulta falló. Revisa la tabla, columnas o permisos de lectura.'
}
