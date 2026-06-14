---
description: Asistente para PostgreSQL — migraciones TypeORM y EF Core, queries, índices, JSON, optimización — con los patrones reales de La Bodega y YALO
---

# postgres

Asistente para PostgreSQL. Cubre los dos ORMs que usan tus proyectos: **TypeORM** (NestJS — La Bodega, YALO Admin) y **EF Core con Npgsql** (.NET — YALO APIs, Ultimate Labs). Genera migraciones, queries, entidades, índices y configuración de conexión.

## Uso

```
/postgres migration <nombre>          → genera migration (TypeORM o EF Core según proyecto)
/postgres entity <nombre>             → genera entidad con decoradores TypeORM o EF Core
/postgres query <descripción>         → genera query SQL o LINQ para el caso de uso
/postgres index <tabla> <columnas>    → genera índice optimizado
/postgres seed <nombre>               → genera seeder de datos de prueba
/postgres json <campo>                → queries para columnas JSONB
/postgres relation <tipo>             → genera relación (OneToMany, ManyToMany, etc.)
/postgres perf <query>                → analiza y sugiere optimizaciones para una query
/postgres conexion                    → genera configuración de conexión para el proyecto activo
/postgres backup                      → comandos para backup/restore
```

## Instrucciones de comportamiento

### Paso 1 — Detectar el ORM del proyecto activo

| Alias | ORM | Versión |
|---|---|---|
| bodega bo api | TypeORM 0.3.x | NestJS 11 |
| bodega services | TypeORM 0.3.x | NestJS 11 |
| yalo admin api | TypeORM 0.3.x | NestJS 11 |
| yalo bo api | EF Core + Npgsql 9.x | .NET 9 |
| yalo reporteria | EF Core + Npgsql 9.x | .NET 8 |
| yalo external api | EF Core + Npgsql 8.x | .NET 8 |
| ult api | EF Core + Npgsql 7.x | .NET 7 |

---

### TYPEORM (NestJS Projects)

#### `/postgres migration <nombre>` — TypeORM

**Generar migration:**
```bash
npx typeorm migration:generate src/migrations/<NombreMigracion> -d src/data-source.ts
```

**Correr migrations:**
```bash
npx typeorm migration:run -d src/data-source.ts
```

**Revertir última migration:**
```bash
npx typeorm migration:revert -d src/data-source.ts
```

**Estructura de `src/data-source.ts`:**
```typescript
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
```

**Migration manual (cuando no se puede auto-generar):**
```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class Create<Nombre>Table1700000000000 implements MigrationInterface {
  name = 'Create<Nombre>Table1700000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: '<nombre>s',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'nombre',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      '<nombre>s',
      new TableIndex({ name: 'IDX_<nombre>_nombre', columnNames: ['nombre'] }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('<nombre>s');
  }
}
```

#### `/postgres entity <nombre>` — TypeORM

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  Index, ManyToOne, JoinColumn
} from 'typeorm';

@Entity('<nombre>s')
@Index(['nombre'])  // índice simple
export class <Nombre> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;  // soft delete
}
```

#### `/postgres relation <tipo>` — TypeORM

**OneToMany / ManyToOne:**
```typescript
// Entidad padre (ej: Cliente)
@OneToMany(() => Pedido, (pedido) => pedido.cliente, { cascade: true })
pedidos: Pedido[];

// Entidad hija (ej: Pedido)
@ManyToOne(() => Cliente, (cliente) => cliente.pedidos, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'cliente_id' })
cliente: Cliente;

@Column({ name: 'cliente_id' })
clienteId: number;
```

**ManyToMany:**
```typescript
@ManyToMany(() => Role, { eager: true })
@JoinTable({
  name: 'usuario_roles',
  joinColumn: { name: 'usuario_id' },
  inverseJoinColumn: { name: 'role_id' },
})
roles: Role[];
```

#### `/postgres query` — TypeORM QueryBuilder

**Query compleja con joins y filtros:**
```typescript
const result = await this.repo
  .createQueryBuilder('<nombre>')
  .leftJoinAndSelect('<nombre>.relacion', 'relacion')
  .where('<nombre>.activo = :activo', { activo: true })
  .andWhere('<nombre>.clienteId = :clienteId', { clienteId })
  .orderBy('<nombre>.createdAt', 'DESC')
  .skip((page - 1) * limit)
  .take(limit)
  .getManyAndCount();

return { data: result[0], total: result[1] };
```

**Query JSONB (PostgreSQL nativo):**
```typescript
// Buscar dentro de un campo JSONB
.where("metadata->>'campo' = :valor", { valor: 'texto' })
// Contiene clave
.where("metadata ? :clave", { clave: 'nombreCampo' })
// Array JSONB contiene elemento
.where("metadata->'tags' @> :tag", { tag: JSON.stringify(['activo']) })
```

---

### EF CORE + NPGSQL (.NET Projects)

#### `/postgres migration <nombre>` — EF Core

```bash
# Generar migration
dotnet ef migrations add <NombreMigracion> \
  --project src/Infrastructure \
  --startup-project src/Api \
  --output-dir Migrations

# Aplicar migrations
dotnet ef database update \
  --project src/Infrastructure \
  --startup-project src/Api

# Revertir a una migration específica
dotnet ef database update <MigracionAnterior> \
  --project src/Infrastructure \
  --startup-project src/Api

# Ver migrations pendientes
dotnet ef migrations list \
  --project src/Infrastructure \
  --startup-project src/Api
```

**Migration manual EF Core:**
```csharp
public partial class Create<Nombre>Table : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "<nombre>s",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                Nombre = table.Column<string>(maxLength: 255, nullable: false),
                Metadata = table.Column<string>(type: "jsonb", nullable: true),
                CreatedAt = table.Column<DateTime>(nullable: false,
                    defaultValueSql: "CURRENT_TIMESTAMP"),
            },
            constraints: table => table.PrimaryKey("PK_<nombre>s", x => x.Id)
        );

        migrationBuilder.CreateIndex(
            name: "IX_<nombre>s_Nombre",
            table: "<nombre>s",
            column: "Nombre");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
        => migrationBuilder.DropTable(name: "<nombre>s");
}
```

#### `/postgres entity <nombre>` — EF Core

```csharp
// Entidad
public class <Nombre>
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Relación
    public int ClienteId { get; set; }
    public Cliente Cliente { get; set; } = null!;
}

// Configuración fluent (en AppDbContext o clase separada IEntityTypeConfiguration)
modelBuilder.Entity<<Nombre>>(entity =>
{
    entity.ToTable("<nombre>s");
    entity.HasKey(e => e.Id);
    entity.Property(e => e.Nombre).HasMaxLength(255).IsRequired();
    entity.HasIndex(e => e.Nombre);

    // JSONB con Npgsql
    entity.Property(e => e.Metadata)
          .HasColumnType("jsonb");

    // Soft delete con query filter global
    entity.HasQueryFilter(e => e.DeletedAt == null);
});
```

#### `/postgres conexion` — EF Core con AWS Secrets Manager

Patrón de los proyectos YALO:
```csharp
// Program.cs
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");

    options.UseNpgsql(connectionString, npgsql =>
    {
        npgsql.EnableRetryOnFailure(3, TimeSpan.FromSeconds(5), null);
        npgsql.CommandTimeout(30);
    });

    if (builder.Environment.IsDevelopment())
        options.EnableSensitiveDataLogging().EnableDetailedErrors();
});

// appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=mi_db;Username=postgres;Password=..."
  }
}
```

---

### Queries SQL comunes (ambos ORMs)

#### `/postgres query` — SQL directo

**Paginación eficiente:**
```sql
SELECT *
FROM <nombre>s
WHERE activo = true
ORDER BY created_at DESC
LIMIT 25 OFFSET 50;  -- página 3, 25 items por página
```

**JSONB — buscar por campo interno:**
```sql
-- Valor exacto
SELECT * FROM pedidos
WHERE datos->>'estado' = 'pendiente';

-- Múltiples condiciones en JSONB
SELECT * FROM pedidos
WHERE datos @> '{"estado": "activo", "tipo": "express"}';

-- JSONB array contains
SELECT * FROM productos
WHERE etiquetas @> '["oferta"]';
```

**Full-text search:**
```sql
SELECT *, ts_rank(search_vector, query) AS rank
FROM productos,
     to_tsquery('spanish', 'leche & descremada') query
WHERE search_vector @@ query
ORDER BY rank DESC;
```

**Upsert (INSERT ON CONFLICT):**
```sql
INSERT INTO configuraciones (clave, valor)
VALUES ('timeout', '30')
ON CONFLICT (clave)
DO UPDATE SET valor = EXCLUDED.valor, updated_at = now();
```

---

### Índices

#### `/postgres index <tabla> <columnas>`

```sql
-- Índice simple
CREATE INDEX CONCURRENTLY idx_pedidos_cliente_id
ON pedidos(cliente_id);

-- Índice compuesto (para queries con WHERE múltiple)
CREATE INDEX CONCURRENTLY idx_pedidos_estado_fecha
ON pedidos(estado, created_at DESC);

-- Índice parcial (solo filas activas — más pequeño y rápido)
CREATE INDEX CONCURRENTLY idx_productos_activos
ON productos(nombre) WHERE activo = true;

-- Índice GIN para JSONB
CREATE INDEX CONCURRENTLY idx_pedidos_metadata
ON pedidos USING GIN(metadata);

-- Índice GIN para full-text search
CREATE INDEX CONCURRENTLY idx_productos_search
ON productos USING GIN(search_vector);
```

**Regla:** usar `CONCURRENTLY` siempre en producción para no lockear la tabla.

---

### Variables de entorno (patrón de los proyectos)

```env
# .env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mi_base
DB_USER=postgres
DB_PASS=secreto
DB_SSL=false

# Producción (desde AWS Secrets Manager)
# Los proyectos leen esto automáticamente con el helper de Secrets
```

---

### Comandos útiles (psql / pgAdmin)

```bash
# Ver queries lentas (requiere pg_stat_statements)
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

# Ver locks activos
SELECT pid, state, query, wait_event_type
FROM pg_stat_activity
WHERE state != 'idle';

# Tamaño de tablas
SELECT relname AS tabla,
       pg_size_pretty(pg_total_relation_size(relid)) AS tamaño
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

# Backup
pg_dump -h localhost -U postgres -d mi_db -F c -f backup.dump

# Restore
pg_restore -h localhost -U postgres -d mi_db -F c backup.dump
```
