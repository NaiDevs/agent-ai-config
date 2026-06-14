---
description: Asistente para SQL Server — migraciones EF 6 y EF Core, T-SQL, stored procedures, índices — para proyectos CORINSA, EMSULA y YALO legacy
---

# sqlserver

Asistente para SQL Server. Cubre los dos escenarios de tus proyectos: **Entity Framework 6** (legacy — CORINSA BI, EMSULA Doctor) y **EF Core** (YALO External API, Ultimate Labs). También genera T-SQL, stored procedures y optimizaciones.

## Uso

```
/sqlserver migration <nombre>         → genera migration (EF 6 o EF Core según proyecto)
/sqlserver entity <nombre>            → genera entidad con configuración correcta
/sqlserver query <descripción>        → genera query T-SQL o LINQ para el caso de uso
/sqlserver sp <nombre>                → genera stored procedure
/sqlserver index <tabla> <columnas>   → genera índice optimizado
/sqlserver seed <nombre>              → genera script de datos de prueba
/sqlserver relation <tipo>            → genera relación entre entidades
/sqlserver perf <query>               → analiza y sugiere optimizaciones
/sqlserver conexion                   → genera connection string para el proyecto activo
/sqlserver backup                     → comandos de backup/restore
```

## Instrucciones de comportamiento

### Paso 1 — Detectar el ORM y versión del proyecto

| Alias | ORM | .NET | SQL Server |
|---|---|---|---|
| corinsa bi api | Entity Framework 6.4 | .NET Framework 4.6.1 | SQL Server |
| cpa api / cpa web api | Entity Framework 6.x | .NET Framework 4.6.1 | SQL Server |
| doctor api | Entity Framework 6.4 | .NET Framework 4.6.1 | SQL Server |
| yalo external api | EF Core 8 | .NET 8 | SQL Server (secundario) |
| ult api | EF Core 7 | .NET 7 | SQL Server + PostgreSQL |

---

### ENTITY FRAMEWORK 6 (Proyectos Legacy)

#### `/sqlserver migration <nombre>` — EF 6

**Desde Package Manager Console (Visual Studio):**
```powershell
# Agregar migration
Add-Migration <NombreMigracion> -Project MiProyecto.Infrastructure

# Aplicar al DB
Update-Database -Project MiProyecto.Infrastructure

# Revertir
Update-Database -TargetMigration <MigracionAnterior> -Project MiProyecto.Infrastructure

# Ver script SQL de la migration
Update-Database -Script -TargetMigration <Migration> -Project MiProyecto.Infrastructure
```

**Desde dotnet CLI (si aplica):**
```bash
dotnet ef migrations add <NombreMigracion> --project src/Infrastructure
dotnet ef database update --project src/Infrastructure
```

**Estructura de migration EF 6:**
```csharp
public partial class Create<Nombre>Table : DbMigration
{
    public override void Up()
    {
        CreateTable(
            "dbo.<Nombre>s",
            c => new
            {
                Id = c.Int(nullable: false, identity: true),
                Nombre = c.String(nullable: false, maxLength: 255),
                Descripcion = c.String(maxLength: 500),
                Activo = c.Boolean(nullable: false, defaultValue: true),
                FechaCreacion = c.DateTime(nullable: false,
                    defaultValueSql: "GETUTCDATE()"),
                FechaModificacion = c.DateTime(),
            })
            .PrimaryKey(t => t.Id)
            .Index(t => t.Nombre);
    }

    public override void Down()
    {
        DropTable("dbo.<Nombre>s");
    }
}
```

#### `/sqlserver entity <nombre>` — EF 6

```csharp
// Entidad
public class <Nombre>
{
    public int Id { get; set; }
    public string Nombre { get; set; }
    public string Descripcion { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaModificacion { get; set; }

    // Navegación
    public virtual ICollection<OtraEntidad> OtrasEntidades { get; set; }
        = new HashSet<OtraEntidad>();
}

// Configuración Fluent API — en una clase separada o en OnModelCreating
public class <Nombre>Configuration : EntityTypeConfiguration<<Nombre>>
{
    public <Nombre>Configuration()
    {
        ToTable("<Nombre>s");
        HasKey(e => e.Id);
        Property(e => e.Nombre).HasMaxLength(255).IsRequired();
        Property(e => e.Descripcion).HasMaxLength(500);
        HasIndex(e => e.Nombre).IsUnique(false);
    }
}

// Registrar en DbContext
protected override void OnModelCreating(DbModelBuilder modelBuilder)
{
    modelBuilder.Configurations.Add(new <Nombre>Configuration());
}
```

#### `/sqlserver relation <tipo>` — EF 6

**OneToMany:**
```csharp
// Padre
public virtual ICollection<Hijo> Hijos { get; set; } = new HashSet<Hijo>();

// Hijo
public int PadreId { get; set; }
public virtual Padre Padre { get; set; }

// Configuración fluent
HasRequired(h => h.Padre)
    .WithMany(p => p.Hijos)
    .HasForeignKey(h => h.PadreId)
    .WillCascadeOnDelete(false);
```

**ManyToMany:**
```csharp
// Configuración
HasMany(e => e.Roles)
    .WithMany(r => r.Usuarios)
    .Map(m => {
        m.ToTable("UsuarioRoles");
        m.MapLeftKey("UsuarioId");
        m.MapRightKey("RoleId");
    });
```

---

### EF CORE (Proyectos .NET 8+)

#### `/sqlserver migration <nombre>` — EF Core

```bash
# Generar migration
dotnet ef migrations add <NombreMigracion> \
  --project src/Infrastructure \
  --startup-project src/Api

# Aplicar
dotnet ef database update \
  --project src/Infrastructure \
  --startup-project src/Api

# Generar script SQL (para revisar antes de aplicar en producción)
dotnet ef migrations script \
  --project src/Infrastructure \
  --startup-project src/Api \
  --output migration.sql \
  --idempotent
```

**Migration EF Core:**
```csharp
public partial class Create<Nombre>Table : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "<Nombre>s",
            columns: table => new
            {
                Id = table.Column<int>(nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                Nombre = table.Column<string>(maxLength: 255, nullable: false),
                Descripcion = table.Column<string>(maxLength: 500, nullable: true),
                Activo = table.Column<bool>(nullable: false, defaultValue: true),
                CreatedAt = table.Column<DateTime>(nullable: false,
                    defaultValueSql: "GETUTCDATE()"),
            },
            constraints: table => table.PrimaryKey("PK_<Nombre>s", x => x.Id)
        );

        migrationBuilder.CreateIndex(
            name: "IX_<Nombre>s_Nombre",
            table: "<Nombre>s",
            column: "Nombre");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
        => migrationBuilder.DropTable(name: "<Nombre>s");
}
```

#### `/sqlserver entity <nombre>` — EF Core

```csharp
public class <Nombre>
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// IEntityTypeConfiguration — archivo separado
public class <Nombre>Configuration : IEntityTypeConfiguration<<Nombre>>
{
    public void Configure(EntityTypeBuilder<<Nombre>> builder)
    {
        builder.ToTable("<Nombre>s");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Nombre).HasMaxLength(255).IsRequired();
        builder.Property(e => e.Descripcion).HasMaxLength(500);
        builder.HasIndex(e => e.Nombre);

        // Soft delete con query filter
        builder.HasQueryFilter(e => e.Activo);
    }
}
```

#### `/sqlserver conexion` — EF Core con SQL Server

```csharp
// Program.cs
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sql =>
        {
            sql.EnableRetryOnFailure(3, TimeSpan.FromSeconds(5), null);
            sql.CommandTimeout(30);
        }
    )
);
```

```json
// appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=MiDB;User Id=sa;Password=...;TrustServerCertificate=True;"
  }
}
```

---

### T-SQL comunes

#### `/sqlserver query` — T-SQL

**Paginación con OFFSET-FETCH (SQL Server 2012+):**
```sql
SELECT *
FROM <Nombre>s
WHERE Activo = 1
ORDER BY FechaCreacion DESC
OFFSET 50 ROWS              -- saltar 2 páginas de 25
FETCH NEXT 25 ROWS ONLY;    -- traer 25 filas
```

**CTE (Common Table Expression):**
```sql
WITH ResumenPedidos AS (
    SELECT
        ClienteId,
        COUNT(*) AS TotalPedidos,
        SUM(Total) AS MontoTotal,
        MAX(FechaCreacion) AS UltimoPedido
    FROM Pedidos
    WHERE Activo = 1
    GROUP BY ClienteId
)
SELECT c.Nombre, r.TotalPedidos, r.MontoTotal
FROM Clientes c
INNER JOIN ResumenPedidos r ON c.Id = r.ClienteId
ORDER BY r.MontoTotal DESC;
```

**Upsert (MERGE):**
```sql
MERGE Configuraciones AS target
USING (SELECT @Clave AS Clave, @Valor AS Valor) AS source
ON target.Clave = source.Clave
WHEN MATCHED THEN
    UPDATE SET Valor = source.Valor, FechaModificacion = GETUTCDATE()
WHEN NOT MATCHED THEN
    INSERT (Clave, Valor) VALUES (source.Clave, source.Valor);
```

**Bulk Insert desde aplicación:**
```csharp
// EF Core — AddRange para múltiples registros
await context.BulkInsertAsync(lista);  // con EFCore.BulkExtensions si está instalado
// o
context.AddRange(lista);
await context.SaveChangesAsync();
```

---

#### `/sqlserver sp <nombre>` — Stored Procedures

```sql
CREATE OR ALTER PROCEDURE sp_Get<Nombre>ByFilter
    @Nombre NVARCHAR(255) = NULL,
    @Activo BIT = 1,
    @PageNumber INT = 1,
    @PageSize INT = 25
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        Id,
        Nombre,
        Descripcion,
        Activo,
        FechaCreacion
    FROM <Nombre>s
    WHERE
        Activo = @Activo
        AND (@Nombre IS NULL OR Nombre LIKE '%' + @Nombre + '%')
    ORDER BY FechaCreacion DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;

    -- Total de filas para paginación
    SELECT COUNT(*) AS Total
    FROM <Nombre>s
    WHERE
        Activo = @Activo
        AND (@Nombre IS NULL OR Nombre LIKE '%' + @Nombre + '%');
END;
```

**Llamar desde EF 6:**
```csharp
var resultado = context.Database
    .SqlQuery<MiDto>("EXEC sp_Get<Nombre>ByFilter @Nombre, @Activo",
        new SqlParameter("@Nombre", nombre ?? (object)DBNull.Value),
        new SqlParameter("@Activo", true))
    .ToList();
```

**Llamar desde EF Core:**
```csharp
var resultado = await context.Set<MiDto>()
    .FromSqlRaw("EXEC sp_Get<Nombre>ByFilter @Nombre, @Activo",
        new SqlParameter("@Nombre", nombre ?? (object)DBNull.Value),
        new SqlParameter("@Activo", true))
    .ToListAsync();
```

---

#### `/sqlserver index <tabla> <columnas>`

```sql
-- Índice no agrupado simple
CREATE NONCLUSTERED INDEX IX_<Tabla>_<Columna>
ON dbo.<Tabla>(<Columna> ASC);

-- Índice compuesto con columnas incluidas (covering index)
CREATE NONCLUSTERED INDEX IX_Pedidos_ClienteEstado
ON dbo.Pedidos(ClienteId ASC, Estado ASC)
INCLUDE (Total, FechaCreacion);  -- evita key lookup

-- Índice filtrado (como partial index en PostgreSQL)
CREATE NONCLUSTERED INDEX IX_Pedidos_Activos
ON dbo.Pedidos(ClienteId, FechaCreacion DESC)
WHERE Activo = 1;

-- Índice único
CREATE UNIQUE NONCLUSTERED INDEX UQ_Configuraciones_Clave
ON dbo.Configuraciones(Clave);
```

**Regla para SQL Server:** agregar `INCLUDE` con las columnas del SELECT para evitar key lookups. Revisar el plan de ejecución si hay `Key Lookup` en el plan.

---

### Optimización

#### `/sqlserver perf <query>`

Diagnóstico rápido:
```sql
-- Ver plan de ejecución estimado
SET SHOWPLAN_ALL ON;
-- [tu query aquí]
SET SHOWPLAN_ALL OFF;

-- Estadísticas de IO y tiempo
SET STATISTICS IO ON;
SET STATISTICS TIME ON;
-- [tu query aquí]
SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;

-- Queries más lentas (DMVs)
SELECT TOP 10
    qs.total_elapsed_time / qs.execution_count AS avg_elapsed_time,
    qs.execution_count,
    SUBSTRING(qt.text, (qs.statement_start_offset/2)+1,
        ((CASE qs.statement_end_offset WHEN -1 THEN DATALENGTH(qt.text)
          ELSE qs.statement_end_offset END - qs.statement_start_offset)/2)+1) AS query_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
ORDER BY avg_elapsed_time DESC;
```

Problemas comunes a buscar:
- **Table Scan** en lugar de Index Seek → falta índice o índice no usado (SARG violation)
- **Key Lookup** → agregar `INCLUDE` al índice
- **N+1 queries** → usar `Include()` / `JOIN` en la query principal
- **SELECT \*** → seleccionar solo columnas necesarias
- `NOLOCK` para queries de solo lectura en tablas muy concurridas

---

### Connection strings por ambiente

```bash
# Desarrollo local
Server=localhost,1433;Database=MiDB;User Id=sa;Password=Dev@123;TrustServerCertificate=True;

# Azure SQL / producción
Server=mi-servidor.database.windows.net;Database=MiDB;User Id=usuario;Password=...;Encrypt=True;

# Autenticación Windows (solo proyectos internos)
Server=SERVIDOR\INSTANCIA;Database=MiDB;Integrated Security=True;
```

---

### Backup y restore

```bash
# Backup completo (SSMS o sqlcmd)
sqlcmd -S localhost -Q "BACKUP DATABASE MiDB TO DISK = 'C:\backups\MiDB.bak' WITH COMPRESSION"

# Restore
sqlcmd -S localhost -Q "RESTORE DATABASE MiDB FROM DISK = 'C:\backups\MiDB.bak' WITH REPLACE"

# Script de toda la BD (desde SSMS: Tasks > Generate Scripts)
```
