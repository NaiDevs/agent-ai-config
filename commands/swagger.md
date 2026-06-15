---
description: Asistente para Swagger/OpenAPI en .NET — genera configuración, anota controllers y DTOs siguiendo el estándar de YaloVendo y YaloAgendo APIs
---

# swagger

Asistente para documentación Swagger/OpenAPI en proyectos .NET ASP.NET Core. El estándar de referencia es **YaloVendo API** (la más completa) con elementos de **YaloAgendo** para proyectos más simples. Cubre configuración inicial, anotación de controllers existentes, DTOs y auditoría de documentación faltante.

## Uso

```
/swagger setup                        → configura Swashbuckle en un proyecto nuevo
/swagger setup multidoc               → setup con múltiples documentos por dominio (patrón YaloVendo)
/swagger annotate controller          → anota un controller existente con todos los atributos
/swagger annotate dto <nombre>        → agrega XML comments y atributos a un DTO
/swagger audit                        → detecta endpoints sin documentar en el proyecto activo
/swagger audit fix                    → agrega automáticamente las anotaciones faltantes
/swagger filter auth                  → genera AuthOperationFilter (auto-Bearer/ApiKey)
/swagger filter tags                  → genera TagDescriptionsDocumentFilter
/swagger filter sort                  → genera AlphabeticalDocumentFilter
/swagger example <nombre>             → genera IExamplesProvider para un DTO
/swagger response                     → genera SuccessResponse<T> y ApiErrorResponseDto (RFC 7807)
```

---

## Estándar de referencia

### YaloVendo API — Patrón completo (usar siempre como referencia)
- `[SwaggerOperation(Summary, Description en markdown, OperationId)]` en cada endpoint
- `[ProducesResponseType(typeof(SuccessResponse<T>), StatusCode)]` para 2xx
- `[ProducesResponseType(typeof(ApiErrorResponseDto<object>), StatusCode)]` para errores
- XML doc comments `/// <summary>` en la clase y cada acción
- `SuccessResponse<T>` wrappea todas las respuestas exitosas
- `ApiErrorResponseDto<TMeta>` sigue RFC 7807 Problem Details
- `[SwaggerResponseExample]` / `[SwaggerRequestExample]` con `IExamplesProvider<T>`
- `GenerateDocumentationFile = true` en el `.csproj`
- `AuthOperationFilter` inyecta Bearer/ApiKey automáticamente
- `AlphabeticalDocumentFilter` + `TagDescriptionsDocumentFilter`

### YaloAgendo API — Patrón simplificado (para APIs más pequeñas)
- `[ApiExplorerSettings(GroupName = "v1-console")]` para separar documentos
- `AuthorizeCheckOperationFilter` para Bearer automático
- `ClearServersFilter` para limpiar servers de la spec
- Sin XML comments ni `[ProducesResponseType]` (respuestas implícitas)

---

## Setup

### `/swagger setup` — Proyecto nuevo (patrón YaloAgendo simplificado)

**`.csproj` — agregar:**
```xml
<PropertyGroup>
  <GenerateDocumentationFile>true</GenerateDocumentationFile>
  <NoWarn>$(NoWarn);1591</NoWarn>
</PropertyGroup>
<ItemGroup>
  <PackageReference Include="Swashbuckle.AspNetCore"             Version="6.6.2" />
  <PackageReference Include="Swashbuckle.AspNetCore.Annotations" Version="6.6.2" />
  <PackageReference Include="Swashbuckle.AspNetCore.Filters"     Version="8.0.2" />
</ItemGroup>
```

**`Program.cs`:**
```csharp
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "<NombreAPI> API",
        Version     = "v1",
        Description = "Descripción de la API.",
        Contact     = new OpenApiContact
        {
            Name  = "Soporte Técnico",
            Email = "soporte@yalocobro.com",
            Url   = new Uri("https://yalocobro.com/support")
        }
    });

    // XML comments de todos los assemblies del proyecto
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    options.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFile));

    // JWT Bearer
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description  = "JWT Authorization header. Ejemplo: \"Bearer {token}\"",
        Name         = "Authorization",
        In           = ParameterLocation.Header,
        Type         = SecuritySchemeType.Http,
        Scheme       = "bearer",
        BearerFormat = "JWT"
    });

    options.OperationFilter<AuthOperationFilter>();
    options.DocumentFilter<ClearServersFilter>();
    options.EnableAnnotations();
    options.ExampleFilters();
});
builder.Services.AddSwaggerExamplesFromAssemblyOf<Program>();

// ...
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.RoutePrefix = "swagger";
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "<NombreAPI> API v1");
        options.DocExpansion(DocExpansion.List);
        options.DefaultModelsExpandDepth(2);
        options.DisplayRequestDuration();
        options.EnableFilter();
    });
}
```

---

### `/swagger setup multidoc` — Múltiples documentos por dominio (patrón YaloVendo)

```csharp
// Extensions/SwaggerOptionsConfiguration.cs
public class SwaggerOptionsConfiguration : IConfigureOptions<SwaggerGenOptions>
{
    private readonly IApiVersionDescriptionProvider _provider;
    public SwaggerOptionsConfiguration(IApiVersionDescriptionProvider provider)
        => _provider = provider;

    // Define los dominios del API
    public static readonly DomainDoc[] DomainDefinitions =
    [
        new("dominio1", SwaggerTags.Dominio1, "Dominio 1", "Descripción del dominio 1."),
        new("dominio2", SwaggerTags.Dominio2, "Dominio 2", "Descripción del dominio 2."),
    ];

    public void Configure(SwaggerGenOptions options)
    {
        foreach (var version in _provider.ApiVersionDescriptions)
        foreach (var domain in DomainDefinitions)
        {
            var docName = $"{version.GroupName}-{domain.Id}";
            options.SwaggerDoc(docName, new OpenApiInfo
            {
                Version     = version.ApiVersion.ToString(),
                Title       = $"<NombreAPI> API - {domain.DisplayName}",
                Description = domain.Description,
                Contact     = new OpenApiContact
                {
                    Name  = "Soporte Técnico",
                    Email = "soporte@yalocobro.com"
                }
            });
        }

        // XML comments
        foreach (var xml in Directory.GetFiles(AppContext.BaseDirectory, "*.xml"))
            options.IncludeXmlComments(xml);

        // Filters
        options.DocumentFilter<TagDescriptionsDocumentFilter>();
        options.DocumentFilter<AlphabeticalDocumentFilter>();
        options.DocumentFilter<ClearServersFilter>();
        options.OperationFilter<AuthOperationFilter>();
        options.ExampleFilters();
        options.EnableAnnotations();

        // Security
        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description  = "JWT Authorization header. Ejemplo: \"Bearer {token}\"",
            Name         = "Authorization",
            In           = ParameterLocation.Header,
            Type         = SecuritySchemeType.Http,
            Scheme       = "bearer",
            BearerFormat = "JWT"
        });

        // Doc inclusion por dominio
        options.DocInclusionPredicate((docName, apiDesc) =>
        {
            var parts    = docName.Split('-', 2);
            var version  = parts[0];
            var domainId = parts[1];

            if (!string.Equals(apiDesc.GroupName, version, StringComparison.OrdinalIgnoreCase))
                return false;

            var domain = DomainDefinitions.FirstOrDefault(d =>
                string.Equals(d.Id, domainId, StringComparison.OrdinalIgnoreCase));

            if (domain is null) return false;

            var domainTag = apiDesc.ActionDescriptor.EndpointMetadata
                .OfType<DomainTagAttribute>().Select(d => d.DomainTag).FirstOrDefault();
            var tags = apiDesc.ActionDescriptor.EndpointMetadata
                .OfType<TagsAttribute>().SelectMany(t => t.Tags);
            var tagsToCheck = domainTag is not null ? new[] { domainTag } : tags;

            return tagsToCheck.Any(t =>
                string.Equals(t, domain.TagName, StringComparison.OrdinalIgnoreCase));
        });
    }
}

public sealed record DomainDoc(string Id, string TagName, string DisplayName, string Description);
```

```csharp
// SwaggerTags.cs
public static class SwaggerTags
{
    public const string Dominio1 = "Dominio1";
    public const string Dominio2 = "Dominio2";
}

// Attributes/DomainTagAttribute.cs
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
public sealed class DomainTagAttribute(string domainTag) : Attribute
{
    public string DomainTag { get; } = domainTag;
}
```

---

## Controller — Patrón completo (YaloVendo)

### `/swagger annotate controller`

Leer el controller activo y agregar todas las anotaciones faltantes siguiendo este patrón exacto:

```csharp
/// <summary>
/// Endpoints de <recurso> — descripción breve de qué maneja este controller.
/// </summary>
[ApiController]
[Route("api/v{version:apiVersion}/yalovendo/<recurso>s")]
[ApiVersion("1.0")]
[Produces("application/json")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[DomainTag(SwaggerTags.YaloVendo)]    // si usa multi-doc
[Tags("<Recurso>s")]
public class <Recurso>sController : ControllerBase
{
    // ─── GET (listado paginado) ───────────────────────────────────────────────

    /// <summary>
    /// Listado paginado de <recurso>s.
    /// </summary>
    /// <param name="pageNumber">Número de página (1..n).</param>
    /// <param name="pageSize">Registros por página (1..200 recomendado).</param>
    /// <param name="search">Filtro opcional; busca coincidencias parciales en nombre.</param>
    [HttpGet]
    [SwaggerOperation(
        Summary     = "Listado de <recurso>s",
        Description = """
Obtiene el listado paginado de <recurso>s de la organización del usuario autenticado.
- Paginación: `pageNumber` (1..n) y `pageSize` (1..200 recomendado).
- `search` aplica ILIKE sobre nombre y descripción.
- Orden: por nombre ascendente; solo registros activos.
""",
        OperationId = "Get<Recurso>s")]
    [ProducesResponseType(typeof(SuccessResponse<PagedResponseDto<<Recurso>ListDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponseDto<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponseDto<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Get(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize   = 20,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _service.GetPaginatedAsync(pageNumber, pageSize, search, cancellationToken);
        return result.ToActionResult();
    }

    // ─── GET by ID ────────────────────────────────────────────────────────────

    /// <summary>
    /// Detalle de un <recurso> por ID.
    /// </summary>
    /// <param name="id">Identificador único del <recurso>.</param>
    [HttpGet("{id:int}")]
    [SwaggerOperation(
        Summary     = "Detalle de <recurso>",
        Description = "Retorna el detalle completo de un <recurso> dado su ID.",
        OperationId = "Get<Recurso>ById")]
    [ProducesResponseType(typeof(SuccessResponse<<Recurso>DetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponseDto<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponseDto<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponseDto<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetById(
        [FromRoute] int id,
        CancellationToken cancellationToken = default)
    {
        var result = await _service.GetByIdAsync(id, cancellationToken);
        return result.ToActionResult();
    }

    // ─── POST ─────────────────────────────────────────────────────────────────

    /// <summary>
    /// Crea un nuevo <recurso>.
    /// </summary>
    [HttpPost]
    [SwaggerOperation(
        Summary     = "Crear <recurso>",
        Description = """
Crea un nuevo <recurso> en la organización del usuario autenticado.

Ejemplo de body:
```json
{
  "nombre": "Mi <recurso>",
  "descripcion": "Descripción opcional"
}
```
""",
        OperationId = "Create<Recurso>")]
    [SwaggerRequestExample(typeof(Create<Recurso>RequestDto), typeof(Create<Recurso>RequestExample))]
    [SwaggerResponseExample(StatusCodes.Status201Created, typeof(Create<Recurso>ResponseExample))]
    [ProducesResponseType(typeof(SuccessResponse<<Recurso>DetailDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorResponseDto<ValidationMetaDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponseDto<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponseDto<object>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiErrorResponseDto<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Create(
        [FromBody] Create<Recurso>RequestDto request,
        CancellationToken cancellationToken = default)
    {
        var result = await _service.CreateAsync(request, cancellationToken);
        return result.ToActionResult();
    }

    // ─── PATCH ────────────────────────────────────────────────────────────────

    /// <summary>
    /// Actualiza parcialmente un <recurso>.
    /// </summary>
    /// <param name="id">Identificador único del <recurso> a actualizar.</param>
    [HttpPatch("{id:int}")]
    [SwaggerOperation(
        Summary     = "Actualizar <recurso>",
        Description = """
Actualiza los campos enviados del <recurso>. Solo se modifican los campos presentes en el body.

Ejemplo de body:
```json
{
  "nombre": "Nuevo nombre",
  "descripcion": "Nueva descripción"
}
```
""",
        OperationId = "Update<Recurso>")]
    [ProducesResponseType(typeof(SuccessResponse<<Recurso>DetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponseDto<ValidationMetaDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponseDto<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponseDto<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponseDto<object>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiErrorResponseDto<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Patch(
        [FromRoute] int id,
        [FromBody] Patch<Recurso>RequestDto request,
        CancellationToken cancellationToken = default)
    {
        var result = await _service.PatchAsync(id, request, cancellationToken);
        return result.ToActionResult();
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    /// <summary>
    /// Elimina un <recurso>.
    /// </summary>
    /// <param name="id">Identificador único del <recurso> a eliminar.</param>
    [HttpDelete("{id:int}")]
    [SwaggerOperation(
        Summary     = "Eliminar <recurso>",
        Description = "Elimina el <recurso> dado su ID. La operación es irreversible.",
        OperationId = "Delete<Recurso>")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponseDto<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponseDto<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponseDto<object>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Delete(
        [FromRoute] int id,
        CancellationToken cancellationToken = default)
    {
        var result = await _service.DeleteAsync(id, cancellationToken);
        return result.ToActionResult();
    }
}
```

---

## Regla de códigos HTTP a documentar

| Situación | Códigos requeridos |
|---|---|
| GET listado | 200, 401 (si auth), 500 |
| GET por ID | 200, 401, 404, 500 |
| POST crear | 201, 400, 401, 409 (si puede duplicar), 500 |
| PATCH actualizar | 200, 400, 401, 404, 409 (si aplica), 500 |
| DELETE | 204, 401, 404, 500 |
| Endpoint público | Quitar 401 |

---

## Modelos de respuesta estándar

### `/swagger response` — SuccessResponse + ApiErrorResponseDto

```csharp
// Shared/Models/SuccessResponse.cs
/// <summary>Respuesta exitosa envuelta para la API.</summary>
public class SuccessResponse<T>
{
    /// <summary>Mensaje descriptivo del resultado (opcional).</summary>
    public string? Message { get; set; }

    /// <summary>Datos de la respuesta.</summary>
    public T Data { get; set; } = default!;

    [JsonIgnore]
    public int StatusCode { get; set; } = 200;
}

// Shared/Models/PagedResponseDto.cs
/// <summary>Respuesta paginada genérica.</summary>
public sealed record PagedResponseDto<T>(
    IReadOnlyList<T> Items,
    int PageNumber,
    int PageSize,
    long TotalCount)
{
    /// <summary>Total de páginas disponibles.</summary>
    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling((double)TotalCount / PageSize);
}

// Shared/Models/ApiErrorResponseDto.cs — RFC 7807
/// <summary>Respuesta de error siguiendo RFC 7807 Problem Details.</summary>
public sealed class ApiErrorResponseDto<TMeta>
{
    /// <summary>URI que identifica el tipo de error.</summary>
    public string Type { get; init; } = default!;

    /// <summary>Título breve del error.</summary>
    public string Title { get; init; } = default!;

    /// <summary>Explicación detallada de este error específico.</summary>
    public string Detail { get; init; } = default!;

    /// <summary>Código de estado HTTP (400, 404, 409, 500, etc.).</summary>
    public int Status { get; init; }

    /// <summary>ID de traza para debugging.</summary>
    public string? TraceId { get; init; }

    /// <summary>Metadatos adicionales (ej: errores de validación por campo).</summary>
    public TMeta? Meta { get; init; }
}

/// <summary>Metadatos de errores de validación.</summary>
public sealed class ValidationMetaDto
{
    /// <summary>
    /// Diccionario de errores por campo.
    /// Key: nombre del campo. Value: mensajes de error.
    /// </summary>
    public IDictionary<string, string[]> Errors { get; init; } = new Dictionary<string, string[]>();
}
```

---

## Filters

### `/swagger filter auth` — AuthOperationFilter

```csharp
// Filters/AuthOperationFilter.cs
public sealed class AuthOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var metadata = context.ApiDescription.ActionDescriptor.EndpointMetadata;

        if (metadata.OfType<AllowAnonymousAttribute>().Any()) return;

        var authorize = metadata.OfType<AuthorizeAttribute>().ToList();
        if (!authorize.Any()) return;

        var requiresApiKey = authorize.Any(a =>
            a.AuthenticationSchemes?.Contains("ApiKey", StringComparison.OrdinalIgnoreCase) == true);

        var scheme = requiresApiKey ? "ApiKey" : "Bearer";

        operation.Security ??= [];
        operation.Security.Add(new OpenApiSecurityRequirement
        {
            [new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id   = scheme
                }
            }] = Array.Empty<string>()
        });
    }
}
```

### `/swagger filter tags` — TagDescriptionsDocumentFilter

```csharp
// Filters/TagDescriptionsDocumentFilter.cs
public class TagDescriptionsDocumentFilter : IDocumentFilter
{
    public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
    {
        var allTags = new List<OpenApiTag>
        {
            new() { Name = "<Tag1>", Description = "### <Tag1>\nDescripción del grupo de endpoints." },
            new() { Name = "<Tag2>", Description = "### <Tag2>\nDescripción del grupo de endpoints." },
        };

        var usedTags = swaggerDoc.Paths
            .SelectMany(p => p.Value.Operations.Values)
            .SelectMany(op => op.Tags)
            .Select(t => t.Name)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        swaggerDoc.Tags = allTags
            .Where(t => usedTags.Contains(t.Name))
            .OrderBy(t => t.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
```

### `/swagger filter sort` — AlphabeticalDocumentFilter

```csharp
// Filters/AlphabeticalDocumentFilter.cs
public sealed class AlphabeticalDocumentFilter : IDocumentFilter
{
    public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
    {
        if (swaggerDoc.Tags is not null)
            swaggerDoc.Tags = swaggerDoc.Tags
                .OrderBy(t => t.Name, StringComparer.OrdinalIgnoreCase).ToList();

        var ordered = swaggerDoc.Paths
            .OrderBy(p => p.Key, StringComparer.OrdinalIgnoreCase).ToList();

        swaggerDoc.Paths = new OpenApiPaths();
        foreach (var (key, value) in ordered)
            swaggerDoc.Paths.Add(key, value);
    }
}

// Filters/ClearServersFilter.cs
public sealed class ClearServersFilter : IDocumentFilter
{
    public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
        => swaggerDoc.Servers.Clear();
}
```

---

## Examples

### `/swagger example <nombre>`

```csharp
// Examples/<Nombre>Examples.cs
// Single example
public sealed class Create<Nombre>RequestExample : IExamplesProvider<Create<Nombre>RequestDto>
{
    public Create<Nombre>RequestDto GetExamples() => new()
    {
        Nombre      = "Ejemplo de <nombre>",
        Descripcion = "Descripción del ejemplo"
    };
}

public sealed class Create<Nombre>ResponseExample : IExamplesProvider<SuccessResponse<<Nombre>DetailDto>>
{
    public SuccessResponse<<Nombre>DetailDto> GetExamples() => new()
    {
        Message = "<Nombre> creado exitosamente.",
        Data    = new <Nombre>DetailDto { Id = 1, Nombre = "Ejemplo" }
    };
}

// Multiple examples
public sealed class <Nombre>ListExamples : IMultipleExamplesProvider<Create<Nombre>RequestDto>
{
    public IEnumerable<SwaggerExample<Create<Nombre>RequestDto>> GetExamples()
    {
        yield return SwaggerExample.Create(
            "Ejemplo básico",
            "Campos mínimos requeridos",
            new Create<Nombre>RequestDto { Nombre = "Ejemplo básico" });

        yield return SwaggerExample.Create(
            "Ejemplo completo",
            "Todos los campos opcionales incluidos",
            new Create<Nombre>RequestDto
            {
                Nombre      = "Ejemplo completo",
                Descripcion = "Con todos los campos"
            });
    }
}
```

---

## DTO — Anotación estándar

### `/swagger annotate dto <nombre>`

```csharp
/// <summary>Datos requeridos para crear un <nombre>.</summary>
public sealed class Create<Nombre>RequestDto
{
    /// <summary>Nombre del <nombre>. Requerido, máximo 255 caracteres.</summary>
    [Required]
    [MaxLength(255)]
    [JsonPropertyName("nombre")]
    public string Nombre { get; set; } = string.Empty;

    /// <summary>Descripción opcional del <nombre>.</summary>
    [MaxLength(500)]
    [JsonPropertyName("descripcion")]
    public string? Descripcion { get; set; }

    /// <summary>Monto en lempiras. Debe ser mayor a 0.</summary>
    [Range(0.01, double.MaxValue, ErrorMessage = "El monto debe ser mayor a 0.")]
    [JsonPropertyName("monto")]
    public decimal Monto { get; set; }
}

/// <summary>Detalle completo de un <nombre>.</summary>
public sealed class <Nombre>DetailDto
{
    /// <summary>Identificador único.</summary>
    [JsonPropertyName("id")]
    public int Id { get; set; }

    /// <summary>Nombre del <nombre>.</summary>
    [JsonPropertyName("nombre")]
    public string Nombre { get; set; } = string.Empty;

    /// <summary>Fecha de creación en UTC.</summary>
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }
}
```

---

## Auditoría

### `/swagger audit`

Leer todos los controllers del proyecto activo (`**/*.controller.cs` o `*Controller.cs`) y reportar:

```
Auditoria Swagger — <NombreProyecto>
──────────────────────────────────────────
ProductsController (src/Controllers/ProductsController.cs)
  ✓ [ApiController], [Route], [Tags]
  ✗ Falta [SwaggerOperation] en: Get, Create
  ✗ Falta [ProducesResponseType] en: Get, GetById, Create
  ✗ Faltan XML comments en la clase

OrdersController (src/Controllers/OrdersController.cs)
  ✓ Completamente documentado

──────────────────────────────────────────
Resumen: 2 controllers, 1 completamente documentado, 4 endpoints sin documentar
```

### `/swagger audit fix`

Para cada endpoint sin documentar: leer el método, inferir el recurso y los tipos de respuesta, y agregar las anotaciones faltantes siguiendo el patrón completo de YaloVendo.
