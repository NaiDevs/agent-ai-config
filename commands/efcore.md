---
description: Asistente para Entity Framework Core — DbContext, entidades, migrations, LINQ, repositorios, configuración fluent — para proyectos .NET 7/8/9 de YALO y Ultimate Labs
---

# efcore

Asistente para Entity Framework Core (versiones 7, 8 y 9) en proyectos .NET. Genera DbContext, entidades con configuración fluent, migrations, repositorios con patrón genérico, queries LINQ y configuración de conexión con PostgreSQL (Npgsql) o SQL Server.

## Uso

```
/efcore entity <nombre>               → entidad con configuración fluent
/efcore dbcontext <nombre>            → DbContext con todas las entidades
/efcore migration <nombre>            → genera y corre migration
/efcore repo <nombre>                 → repositorio genérico con métodos comunes
/efcore query <descripción>           → query LINQ para el caso de uso
/efcore relation <tipo> <A> <B>       → configura relación entre entidades
/efcore seed <nombre>                 → seeder con HasData() para datos iniciales
/efcore interceptor <nombre>          → interceptor de auditoría o soft delete
/efcore spec <nombre>                 → patrón Specification para queries complejas
/efcore fix                           → detecta problemas comunes de EF Core
```

## Contexto de proyectos

| Alias | .NET | EF Core | BD |
|---|---|---|---|
| yalo bo api | 9.0 | EF Core 9 + Npgsql 9 | PostgreSQL |
| yalo reporteria | 8.0 | EF Core 9 + Npgsql 9 | PostgreSQL |
| yalo external api | 8.0 | EF Core 8 + Npgsql 8 | PostgreSQL + SQL Server |
| yalo agendo api | 9.0 | — | DynamoDB (no EF) |
| ult api | 7.0 | EF Core 7 + Npgsql 7 | PostgreSQL + SQL Server |

---

## Generadores

### `/efcore entity <nombre>`

Entidad limpia con configuración separada (patrón `IEntityTypeConfiguration`):

```csharp
// Domain/<Nombre>.cs
public class <Nombre>
{
    public int Id { get; private set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public decimal Monto { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }  // soft delete

    // Relaciones (propiedades de navegación)
    public int ClienteId { get; set; }
    public Cliente Cliente { get; set; } = null!;
    public List<OtraEntidad> Otras { get; set; } = [];
}

// Infrastructure/Configurations/<Nombre>Configuration.cs
public class <Nombre>Configuration : IEntityTypeConfiguration<<Nombre>>
{
    public void Configure(EntityTypeBuilder<<Nombre>> builder)
    {
        builder.ToTable("<nombre>s");

        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).UseIdentityColumn();

        builder.Property(e => e.Nombre)
               .HasMaxLength(255)
               .IsRequired();

        builder.Property(e => e.Descripcion)
               .HasMaxLength(500);

        builder.Property(e => e.Monto)
               .HasPrecision(18, 2);

        // JSONB (PostgreSQL) — requiere Npgsql
        builder.Property(e => e.Metadata)
               .HasColumnType("jsonb");

        // Índices
        builder.HasIndex(e => e.Nombre);
        builder.HasIndex(e => new { e.ClienteId, e.Activo });

        // Soft delete — query filter global
        builder.HasQueryFilter(e => e.DeletedAt == null);

        // Relación
        builder.HasOne(e => e.Cliente)
               .WithMany(c => c.Entidades)
               .HasForeignKey(e => e.ClienteId)
               .OnDelete(DeleteBehavior.Restrict);

        // Valor de conversión (enum a string)
        builder.Property(e => e.Estado)
               .HasConversion<string>()
               .HasMaxLength(50);
    }
}
```

---

### `/efcore dbcontext <nombre>`

```csharp
// Infrastructure/<Nombre>DbContext.cs
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // DbSets
    public DbSet<<Nombre>> <Nombre>s => Set<<Nombre>>();
    public DbSet<Cliente> Clientes => Set<Cliente>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Aplicar todas las configuraciones del assembly automáticamente
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Convención: nombres de tablas en snake_case (PostgreSQL)
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            entity.SetTableName(ToSnakeCase(entity.GetTableName()!));
            foreach (var prop in entity.GetProperties())
                prop.SetColumnName(ToSnakeCase(prop.GetColumnName()));
        }
    }

    // Interceptor para auditoría (override SaveChanges)
    public override async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is BaseEntity &&
                        e.State is EntityState.Added or EntityState.Modified);

        foreach (var entry in entries)
        {
            var entity = (BaseEntity)entry.Entity;
            if (entry.State == EntityState.Added)
                entity.CreatedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;
        }

        return await base.SaveChangesAsync(ct);
    }

    private static string ToSnakeCase(string name) =>
        string.Concat(name.Select((c, i) =>
            i > 0 && char.IsUpper(c) ? "_" + char.ToLower(c) : char.ToLower(c).ToString()));
}
```

---

### `/efcore migration <nombre>`

```bash
# Generar migration
dotnet ef migrations add <NombreMigracion> \
  --project src/Infrastructure \
  --startup-project src/Api \
  --output-dir Migrations

# Aplicar migrations pendientes
dotnet ef database update \
  --project src/Infrastructure \
  --startup-project src/Api

# Generar script SQL idempotente (para producción)
dotnet ef migrations script \
  --project src/Infrastructure \
  --startup-project src/Api \
  --idempotent \
  --output migrations.sql

# Revertir a una migration específica
dotnet ef database update <MigracionAnterior> \
  --project src/Infrastructure \
  --startup-project src/Api

# Ver migrations pendientes
dotnet ef migrations list \
  --project src/Infrastructure \
  --startup-project src/Api

# Eliminar última migration (no aplicada)
dotnet ef migrations remove \
  --project src/Infrastructure \
  --startup-project src/Api
```

**Migration manual EF Core 8/9:**
```csharp
/// <inheritdoc />
public partial class <NombreMigracion> : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "<nombre>s",
            columns: table => new
            {
                id = table.Column<int>(nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy",
                        NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                nombre = table.Column<string>(maxLength: 255, nullable: false),
                monto = table.Column<decimal>(precision: 18, scale: 2, nullable: false),
                activo = table.Column<bool>(nullable: false, defaultValue: true),
                created_at = table.Column<DateTime>(nullable: false,
                    defaultValueSql: "CURRENT_TIMESTAMP"),
            },
            constraints: table => table.PrimaryKey("pk_<nombre>s", x => x.id)
        );

        migrationBuilder.CreateIndex(
            name: "ix_<nombre>s_nombre",
            table: "<nombre>s",
            column: "nombre");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
        => migrationBuilder.DropTable(name: "<nombre>s");
}
```

---

### `/efcore repo <nombre>`

Repositorio genérico + repositorio específico:

```csharp
// Interfaz genérica
public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default);
    Task<T> AddAsync(T entity, CancellationToken ct = default);
    Task UpdateAsync(T entity, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

// Implementación genérica
public class Repository<T> : IRepository<T> where T : class
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(int id, CancellationToken ct = default)
        => await _dbSet.FindAsync([id], ct);

    public virtual async Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default)
        => await _dbSet.AsNoTracking().ToListAsync(ct);

    public virtual async Task<T> AddAsync(T entity, CancellationToken ct = default)
    {
        await _dbSet.AddAsync(entity, ct);
        await _context.SaveChangesAsync(ct);
        return entity;
    }

    public virtual async Task UpdateAsync(T entity, CancellationToken ct = default)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync(ct);
    }

    public virtual async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"{typeof(T).Name} {id} no encontrado");
        _dbSet.Remove(entity);
        await _context.SaveChangesAsync(ct);
    }
}

// Repositorio específico con queries propias
public interface I<Nombre>Repository : IRepository<<Nombre>>
{
    Task<PaginatedResult<<Nombre>>> GetPaginatedAsync(
        int page, int limit, string? nombre = null, CancellationToken ct = default);
    Task<<Nombre>?> GetWithRelationsAsync(int id, CancellationToken ct = default);
}

public class <Nombre>Repository : Repository<<Nombre>>, I<Nombre>Repository
{
    public <Nombre>Repository(AppDbContext context) : base(context) { }

    public async Task<PaginatedResult<<Nombre>>> GetPaginatedAsync(
        int page, int limit, string? nombre = null, CancellationToken ct = default)
    {
        var query = _dbSet.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(nombre))
            query = query.Where(e => EF.Functions.ILike(e.Nombre, $"%{nombre}%"));

        var total = await query.CountAsync(ct);

        var data = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(ct);

        return new PaginatedResult<<Nombre>>(data, total, page, limit);
    }

    public Task<<Nombre>?> GetWithRelationsAsync(int id, CancellationToken ct = default)
        => _dbSet
            .Include(e => e.Cliente)
            .Include(e => e.Otras)
            .FirstOrDefaultAsync(e => e.Id == id, ct);
}
```

---

### `/efcore query <descripción>`

**LINQ — patrones comunes:**

```csharp
// Filtro con múltiples condiciones opcionales
var query = context.<Nombre>s.AsNoTracking()
    .Where(e => e.Activo);

if (!string.IsNullOrEmpty(filtroNombre))
    query = query.Where(e => EF.Functions.ILike(e.Nombre, $"%{filtroNombre}%"));

if (fechaDesde.HasValue)
    query = query.Where(e => e.CreatedAt >= fechaDesde.Value);

var resultado = await query
    .Include(e => e.Relacion)
    .OrderByDescending(e => e.CreatedAt)
    .Skip((pagina - 1) * limite)
    .Take(limite)
    .ToListAsync();

// Con proyección a DTO (evita cargar columnas innecesarias)
var dtos = await context.<Nombre>s
    .AsNoTracking()
    .Where(e => e.ClienteId == clienteId)
    .Select(e => new <Nombre>Dto(e.Id, e.Nombre, e.Monto, e.CreatedAt))
    .ToListAsync();

// Agrupación y suma
var resumen = await context.Pedidos
    .GroupBy(p => p.ClienteId)
    .Select(g => new {
        ClienteId = g.Key,
        Total = g.Sum(p => p.Monto),
        Cantidad = g.Count()
    })
    .OrderByDescending(x => x.Total)
    .ToListAsync();

// Consulta con subquery (Any/All)
var clientesConPedidos = await context.Clientes
    .Where(c => c.Pedidos.Any(p => p.Estado == "pendiente"))
    .ToListAsync();

// Raw SQL cuando LINQ no alcanza
var resultado = await context.Database
    .SqlQuery<MiDto>($"SELECT * FROM mi_funcion({param})")
    .ToListAsync();
```

---

### `/efcore relation <tipo> <A> <B>`

**Fluent API en el `IEntityTypeConfiguration`:**

```csharp
// OneToMany
builder.HasOne(e => e.Cliente)
       .WithMany(c => c.Entidades)
       .HasForeignKey(e => e.ClienteId)
       .OnDelete(DeleteBehavior.Restrict)
       .IsRequired();

// ManyToMany (EF Core 5+ — tabla intermedia automática)
builder.HasMany(p => p.Categorias)
       .WithMany(c => c.Productos)
       .UsingEntity(j => j.ToTable("producto_categorias"));

// ManyToMany con entidad intermedia explícita
builder.HasMany(p => p.PedidoProductos)
       .WithOne(pp => pp.Pedido)
       .HasForeignKey(pp => pp.PedidoId);

// OneToOne
builder.HasOne(u => u.Perfil)
       .WithOne(p => p.Usuario)
       .HasForeignKey<Perfil>(p => p.UsuarioId);
```

---

### `/efcore seed <nombre>`

Datos semilla con `HasData()` en la configuración:

```csharp
// En <Nombre>Configuration.cs, dentro de Configure()
builder.HasData(
    new <Nombre> { Id = 1, Nombre = "Valor inicial 1", Activo = true,
                   CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
    new <Nombre> { Id = 2, Nombre = "Valor inicial 2", Activo = true,
                   CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
);
// ⚠ Fechas DEBEN ser estáticas (no DateTime.UtcNow) para que las migrations sean deterministas
```

---

### `/efcore interceptor <nombre>`

**Interceptor de auditoría automático (sin override en DbContext):**

```csharp
public class AuditInterceptor : SaveChangesInterceptor
{
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken ct = default)
    {
        var context = eventData.Context!;
        var now = DateTime.UtcNow;

        foreach (var entry in context.ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.UpdatedAt = now;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    entry.Property(e => e.CreatedAt).IsModified = false;
                    break;
                case EntityState.Deleted:
                    // Soft delete
                    entry.State = EntityState.Modified;
                    entry.Entity.DeletedAt = now;
                    break;
            }
        }

        return base.SavingChangesAsync(eventData, result, ct);
    }
}

// Registrar en Program.cs
builder.Services.AddSingleton<AuditInterceptor>();
builder.Services.AddDbContext<AppDbContext>((sp, options) =>
{
    options.UseNpgsql(connectionString);
    options.AddInterceptors(sp.GetRequiredService<AuditInterceptor>());
});
```

---

### `/efcore fix` — Problemas comunes

| Error | Causa | Solución |
|---|---|---|
| `InvalidOperationException: sequence 'seq' already exists` | Migration aplicada dos veces | `migrations remove` + regenerar |
| `Cannot translate expression` | LINQ con lógica no traducible a SQL | Mover la lógica a la app, usar `AsEnumerable()` antes |
| N+1 queries | `Include()` dentro de un loop | Usar `Include()` antes del `ToList()` |
| `Decimal` truncado | Falta `HasPrecision()` en la config | Agregar `builder.Property(e => e.Monto).HasPrecision(18, 2)` |
| `DateTime` con offset incorrecto | `DateTime` sin `DateTimeKind.Utc` en PostgreSQL | Usar `DateTime.UtcNow` siempre o mapear a `DateTimeOffset` |
| Query filter no funciona | Llamar `IgnoreQueryFilters()` accidentalmente | Revisar el repo, quitar `IgnoreQueryFilters()` |
| Migración vacía auto-generada | Entidad no registrada en `ApplyConfigurationsFromAssembly` | Verificar que el assembly es el correcto |
| `The entity type requires a primary key` | Entidad sin `HasKey()` | Agregar `builder.HasKey(e => e.Id)` en la config |

---

### Configuración en Program.cs

**PostgreSQL (proyectos YALO):**
```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsql =>
        {
            npgsql.MigrationsAssembly("MiProyecto.Infrastructure");
            npgsql.EnableRetryOnFailure(3, TimeSpan.FromSeconds(5), null);
            npgsql.CommandTimeout(30);
            // Mapear todas las propiedades DateTime a timestamptz
            AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", false);
        }
    )
);
```

**SQL Server (Ultimate Labs, YALO External):**
```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sql =>
        {
            sql.MigrationsAssembly("MiProyecto.Infrastructure");
            sql.EnableRetryOnFailure(3, TimeSpan.FromSeconds(5), null);
        }
    )
);
```
