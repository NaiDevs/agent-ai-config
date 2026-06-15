---
description: Generador y asistente para proyectos .NET / ASP.NET Core — endpoints, DTOs, migrations EF Core, configuración de servicios y más
---

# dotnet

Asistente para proyectos .NET y ASP.NET Core. Detecta si es .NET moderno (8/9) o legacy (.NET Framework 4.6.1) y genera código siguiendo la arquitectura real del proyecto (capas, EF Core, Serilog, Swagger).

## Estándar de documentación Swagger — SIEMPRE incluir

Todo controller y endpoint generado con `/dotnet gen controller` o `/dotnet gen endpoint` DEBE incluir la documentación Swagger completa siguiendo el estándar de **YaloVendo API**:

- XML `/// <summary>` en la clase y en cada acción
- `[SwaggerOperation(Summary, Description en markdown con ejemplos JSON, OperationId)]`
- `[ProducesResponseType(typeof(SuccessResponse<T>), StatusCode)]` para respuestas 2xx
- `[ProducesResponseType(typeof(ApiErrorResponseDto<object>), StatusCode)]` para errores
- Códigos HTTP mínimos por verbo: ver tabla en `/swagger`
- `[Tags("NombreRecurso")]` en la clase del controller
- `[Produces("application/json")]` en la clase
- `OperationId` en PascalCase: VerbRecurso (ej: `GetProductos`, `CreatePedido`)

Ver `/swagger annotate controller` para el patrón completo y `/swagger response` para los modelos `SuccessResponse<T>` y `ApiErrorResponseDto`.

## Uso

```
/dotnet gen endpoint <método> <ruta>    → agrega endpoint a un controller
/dotnet gen controller <nombre>         → genera controller completo con CRUD
/dotnet gen dto <nombre>                → genera DTO de request/response
/dotnet gen service <nombre>            → genera interfaz + implementación de servicio
/dotnet gen entity <nombre>             → genera entidad EF Core
/dotnet gen migration <nombre>          → genera migration EF Core
/dotnet gen repo <nombre>               → genera repositorio con interfaz
/dotnet fix                             → detecta errores comunes (DI, null refs, EF)
/dotnet test <nombre>                   → genera unit test xUnit/NUnit para un servicio
/dotnet run-migration                   → aplica migrations pendientes
```

## Instrucciones de comportamiento

### Paso 1 — Detectar la versión del proyecto

Leer el archivo `.csproj` del proyecto activo para determinar:
- `<TargetFramework>`: `net8.0`, `net9.0` vs `net461` (legacy)
- Paquetes NuGet instalados (EF Core, JWT, Serilog, Swagger, etc.)
- Arquitectura: monolítico vs multi-capa (Api + Core + Services + Infrastructure)

### Paso 2 — Adaptar al tipo de proyecto

#### Proyectos .NET 8/9 modernos (YALO APIs)
- Minimal APIs o Controllers con `[ApiController]`
- Nullable reference types habilitados
- `ImplicitUsings` habilitados
- Inyección de dependencias vía constructor
- `Program.cs` con builder pattern (no Startup.cs)

#### Proyectos .NET Framework 4.6.1 (CORINSA BI, EMSULA Doctor)
- WebAPI con `ApiController` clásico
- `Global.asax`, `WebApiConfig`
- Entity Framework 6 (no EF Core)
- Sin nullable reference types

### Generadores — .NET Moderno

#### `/dotnet gen controller <nombre>`

```csharp
[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class <Nombre>Controller : ControllerBase
{
    private readonly I<Nombre>Service _service;
    private readonly ILogger<<Nombre>Controller> _logger;

    public <Nombre>Controller(I<Nombre>Service service, ILogger<<Nombre>Controller> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<<Nombre>Response>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(<Nombre>Response), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(<Nombre>Response), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] Create<Nombre>Request request)
    {
        var result = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Update<Nombre>Request request)
    {
        await _service.UpdateAsync(id, request);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
```

#### `/dotnet gen dto <nombre>`

Generar Request + Response separados:
```csharp
public record Create<Nombre>Request(
    string Nombre,
    string? Descripcion
);

public record Update<Nombre>Request(
    string? Nombre,
    string? Descripcion
);

public record <Nombre>Response(
    int Id,
    string Nombre,
    string? Descripcion,
    DateTime CreatedAt
);
```

Usar `record` para .NET 8/9. Usar `class` con propiedades para legacy.

#### `/dotnet gen service <nombre>`

Generar interfaz + implementación:
```csharp
// I<Nombre>Service.cs
public interface I<Nombre>Service
{
    Task<IEnumerable<<Nombre>Response>> GetAllAsync();
    Task<<Nombre>Response?> GetByIdAsync(int id);
    Task<<Nombre>Response> CreateAsync(Create<Nombre>Request request);
    Task UpdateAsync(int id, Update<Nombre>Request request);
    Task DeleteAsync(int id);
}

// <Nombre>Service.cs
public class <Nombre>Service : I<Nombre>Service
{
    private readonly AppDbContext _context;
    private readonly ILogger<<Nombre>Service> _logger;

    public <Nombre>Service(AppDbContext context, ILogger<<Nombre>Service> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<<Nombre>Response>> GetAllAsync()
    {
        return await _context.<Nombre>s
            .Select(x => new <Nombre>Response(x.Id, x.Nombre, x.Descripcion, x.CreatedAt))
            .ToListAsync();
    }
    // ... resto de métodos
}
```

#### `/dotnet gen entity <nombre>`

```csharp
public class <Nombre>
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

Preguntar si necesita relaciones (`List<Otra>`, referencias FK) antes de generar.

Agregar al `DbContext`:
```csharp
public DbSet<<Nombre>> <Nombre>s => Set<<Nombre>>();
```

#### `/dotnet gen migration <nombre>`

```bash
dotnet ef migrations add <nombre> --project src/Infrastructure --startup-project src/Api
dotnet ef database update --project src/Infrastructure --startup-project src/Api
```

Mostrar el contenido del archivo de migration generado.

#### `/dotnet test <nombre>`

Generar unit test con xUnit y Moq:
```csharp
public class <Nombre>ServiceTests
{
    private readonly Mock<AppDbContext> _mockContext;
    private readonly <Nombre>Service _service;

    public <Nombre>ServiceTests()
    {
        _mockContext = new Mock<AppDbContext>();
        _service = new <Nombre>Service(_mockContext.Object, Mock.Of<ILogger<<Nombre>Service>>());
    }

    [Fact]
    public async Task GetAllAsync_ReturnsAllItems()
    {
        // Arrange
        var data = new List<<Nombre>> { new() { Id = 1, Nombre = "Test" } }.AsQueryable();
        // ... setup mock

        // Act
        var result = await _service.GetAllAsync();

        // Assert
        Assert.NotEmpty(result);
    }
}
```

### Arquitectura multi-capa (YALO APIs)

```
src/
  Api/           → Controllers, Middleware, Program.cs
  Core/          → Interfaces, DTOs, Domain models
  Services/      → Implementaciones de servicios
  Infrastructure/ → DbContext, Repositories, Migrations, External services
```

Al generar código, preguntar en qué capa va cada archivo.

### Stack por proyecto

| Alias | .NET | BD | ORM | Auth |
|---|---|---|---|---|
| yalo bo api | 8/9 | PostgreSQL | EF Core 9 | JWT Bearer |
| yalo agendo api | 9 | DynamoDB | AWS SDK | JWT Bearer 9 |
| yalo reporteria | 8 | PostgreSQL | EF Core 9 | JWT |
| yalo external api | 8 | PostgreSQL + SQL Server | EF Core 8 | JWT |
| cpa api | Legacy 4.6.1 | SQL Server | EF 6 | — |
| corinsa bi api | Legacy 4.6.1 | SQL Server | EF 6 | — |
| doctor api | Legacy 4.6.1 | SQL Server | EF 6 | — |
| ult api | 7.0 | PostgreSQL + SQL Server | EF Core 7 | — |

### Patrones de logging (Serilog)

Los proyectos .NET modernos usan Serilog:
```csharp
_logger.LogInformation("Creando {Entidad} con datos: {@Request}", nameof(<Nombre>), request);
_logger.LogError(ex, "Error al procesar {Entidad} con ID {Id}", nameof(<Nombre>), id);
```

Usar structured logging (con `{@objeto}` para objetos completos).

### Paquetes NuGet comunes instalados

- `Swashbuckle.AspNetCore` — Swagger UI
- `Serilog.AspNetCore` — Logging
- `Npgsql.EntityFrameworkCore.PostgreSQL` — EF Core con PostgreSQL
- `Microsoft.AspNetCore.Authentication.JwtBearer` — JWT auth
- `AWSSDK.SecretsManager` — Variables de entorno seguras
- `QuestPDF` — Generación de PDFs (YALO Reportería)
- `ClosedXML` — Excel
