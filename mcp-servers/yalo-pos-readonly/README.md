# MCP de lectura de producción para YALO POS

Servidor MCP local por stdio para consultar las bases `YaloCobro` y `YaloAuth` usadas por `YALO-API-POS`. Expone `listar_tablas`, `describir_tabla` y `leer_tabla`. Cada llamada indica `base: "cobro"` o `base: "auth"`. No contiene herramientas de escritura ni recibe SQL libre.

## Protección

- Usa una cuenta PostgreSQL dedicada sin permisos de escritura, creación ni administración. El servidor comprueba esos permisos al iniciar cada operación y rechaza la consulta si encuentra alguno.
- Cada operación abre una transacción `READ ONLY` y la termina con `ROLLBACK`.
- `leer_tabla` construye internamente un `SELECT` de tabla base con identificadores validados y filtros de igualdad parametrizados. Limita la salida a 100 filas y 64 KiB, y aplica 5 segundos de timeout. No ejecuta funciones SQL ni acepta vistas.
- Si la tabla contiene `codorganizacion`, exige un filtro de igualdad para esa columna. Resolver primero el código correcto en Cobro o Auth con `yalo-db org`: el valor puede diferir entre ambas bases.
- Requiere TLS con `sslmode=verify-full`. No imprime la URL ni errores que puedan contener credenciales.
- Comprueba destino `yalo-db-production` y nombre de base `dbyalocobro`/`dbyaloauth` para evitar apuntar por error a otro cluster.

La restricción decisiva es el rol de PostgreSQL. PostgreSQL indica que `READ ONLY` es una restricción de alto nivel y no evita toda escritura en disco; por eso se combina con permisos mínimos y herramientas de consulta cerradas. Ver [transacciones de solo lectura](https://www.postgresql.org/docs/current/sql-set-transaction.html).

## Preparación de la cuenta

Un administrador de la base debe crear el rol y conceder solo lectura sobre los esquemas necesarios. Ajustar nombres de base, rol propietario y esquemas a producción:

```sql
CREATE ROLE yalo_pos_mcp_reader LOGIN PASSWORD '<generar fuera del repositorio>'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
GRANT CONNECT ON DATABASE nombre_base TO yalo_pos_mcp_reader;
GRANT USAGE ON SCHEMA public TO yalo_pos_mcp_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO yalo_pos_mcp_reader;
ALTER ROLE yalo_pos_mcp_reader SET default_transaction_read_only = on;
```

Si `PUBLIC` u otro rol heredado concede `CREATE`, `INSERT`, `UPDATE`, `DELETE` o `TRUNCATE`, el MCP rechazará la cuenta. El administrador debe corregir esos permisos sin afectar a otros usuarios.

En `connections.local.env` del mismo directorio, pegar `YALO_DB_URL_YALO_COBRO` y/o `YALO_DB_URL_YALO_AUTH` con la cuenta nueva. El archivo está ignorado por Git; no copiar cadenas de conexión de la API. Si se necesita una CA privada, configurar `sslrootcert` en la URL; ver [TLS en node-postgres](https://node-postgres.com/features/ssl).

Después, ejecutar `setup.ps1 -Tool both` desde la raíz de `agent-ai-config` para cargar las variables en el entorno de usuario. Instalar `yalo-datos-readonly` desde `YALO-PLUGINS` para registrar el MCP en Claude Code y Codex. Reiniciar ambas herramientas. Si las dos cadenas están vacías, el servidor no inicia.

## Validación local

```powershell
npm ci --ignore-scripts
npm test
```

Las pruebas locales validan la construcción de consultas y el rechazo de identificadores inyectados. La conexión y los permisos de producción requieren la cuenta de lectura y acceso a la red privada.
