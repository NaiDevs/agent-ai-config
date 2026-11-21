---
description: Resuelve tickets SAC de Yalo — lee un link de Slack, extrae la organización, la resuelve en yalo-auth y yalo-cobro, y reporta las marcas comerciales del cliente.
---

# ticketero

## Uso

```
/ticketero https://cithn.slack.com/archives/C07B6MT3JCC/p1795220932875139
```

## Paso 1 — Leer el mensaje de Slack

Parsear el URL con este patrón:
`https://cithn.slack.com/archives/{channel_id}/p{ts_compacto}`

- `channel_id` → el segmento entre `/archives/` y `/p...`
- `message_ts` → los dígitos después de `p`, insertando un punto en la posición 10:
  `p1795220932875139` → `1795220932.875139`
  Si tiene letra al final (ej. `p1795222132318049c`), ignorarla.

Leer el thread con `mcp__claude_ai_Slack__slack_read_thread` pasando `channel_id` y `message_ts`.

## Paso 2 — Detectar sender y elegir cluster

Revisar quién envió el mensaje raíz del thread:

| User ID | Persona | Acción |
|---|---|---|
| `U09MB644QAX` | Elizabeth Rivera | `codorganizacion_cobro = 377`, MCPs de YALO prod. Saltar al Paso 4. |
| `U09GGTGR4ER` | Kenny Withsell (La Bodega) | Usar MCPs de **La Bodega**. Continuar Paso 3. |
| cualquier otro | — | Usar MCPs de **YALO prod**. Continuar Paso 3. |

### Clusters disponibles

| Propósito | MCP auth | MCP cobro |
|---|---|---|
| YALO producción | `pg-yalo-auth-prod` | `pg-yalo-cobro-prod` |
| La Bodega | `pg-yalo-bodega-auth` | `pg-yalo-bodega` |

## Paso 3 — Extraer nombre y resolver codorganizacion

### 3a. Extraer nombre del negocio

Buscar en el mensaje el campo:
```
• Nombre del Negocio y Sucursal: <VALOR>
```
Si no existe ese campo (mensaje libre como el de Kenny), extraer el nombre del negocio del texto del mensaje — ej. "DollarStop", "La Bodega", etc.

### 3b. Buscar en yalo-auth del cluster correspondiente

MCP server: **`pg-yalo-auth-prod`** o **`pg-yalo-bodega-auth`** según Paso 2 — tool: `query`

```sql
SELECT codorganizacion, nombreorganizacion
FROM public.organizaciones
WHERE nombreorganizacion ILIKE '%<nombre_extraido>%'
LIMIT 10;
```

- Si devuelve **0 filas**: intentar con palabras clave sueltas del nombre.
- Si devuelve **más de 1**: mostrar las opciones y preguntar cuál es.
- Si devuelve **exactamente 1**: tomar ese `codorganizacion` como `cod_auth`.

### 3c. Traducir a codorganizacion de cobro

MCP server: **`pg-yalo-cobro-prod`** o **`pg-yalo-bodega`** según Paso 2 — tool: `query`

```sql
SELECT codorganizacion
FROM public.org_organizaciones
WHERE codorganizacionauth = <cod_auth>
  AND activo = true
LIMIT 1;
```

Ese resultado es el `codorganizacion_cobro`.

## Paso 4 — Buscar marcas comerciales

MCP server de cobro del cluster correspondiente — tool: `query`

Primero verificar columnas de la tabla:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'org_marcascomerciales'
ORDER BY ordinal_position;
```

Luego traer las marcas:

```sql
SELECT *
FROM public.org_marcascomerciales
WHERE codorganizacion = <codorganizacion_cobro>
LIMIT 50;
```

Si la tabla tiene columna `eliminado`, agregar `AND eliminado = false`.
Si tiene `activo`, agregar `AND activo = true`.

## Paso 5 — Responder

- Reportar **solo el nombre de la marca** (o marcas) que correspondan a lo solicitado.
- **No mostrar** códigos internos, `codorganizacion`, ni estructura de BD.
- Si hay varias marcas y el mensaje da contexto (ej. menciona un restaurante o tipo de negocio específico), filtrar por ese contexto.
- Si no hay contexto suficiente para elegir una, listar todas.

## Resumen del flujo

```
URL Slack → leer mensaje → revisar sender
  ├─ U09MB644QAX (Elizabeth)  → codorganizacion_cobro = 377, cluster YALO → Paso 4
  ├─ U09GGTGR4ER (Kenny)      → cluster La Bodega → Paso 3
  └─ otro sender               → cluster YALO prod → Paso 3
                                      ↓
              extraer nombre del negocio/sucursal
                      ↓
              auth: organizaciones.nombreorganizacion → cod_auth
                      ↓
              cobro: org_organizaciones.codorganizacionauth → codorganizacion_cobro
                      ↓
              org_marcascomerciales → nombre(s) de marca
```
