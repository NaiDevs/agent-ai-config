# Instrucciones globales — Naidelyn

## Memoria persistente — Engram

> Los git commits y resúmenes de sesión se registran automáticamente vía hooks — no hace falta hacerlo manualmente en esos casos.

### Cuándo guardar manualmente (OBLIGATORIO, sin esperar que el usuario lo pida)

| Evento | Acción |
|--------|--------|
| Decisión técnica importante | Write en `memory/` con tipo `decision` |
| Bug complejo resuelto | Write/Edit en `memory/changes-log.md` |
| Cambio de config o setup | Write/Edit en `memory/changes-log.md` |
| Nuevo proyecto/cliente identificado | Crear archivo en `memory/projects-<cliente>.md` |

### Cómo guardar

- **Engram (siempre disponible)**: Write/Edit en `C:/Users/naide/.claude/projects/C--Users-naide/memory/`
- **Engram (MCP, si disponible)**: `mcp__memory__create_entities` / `mcp__memory__add_observations`

No mencionar que se está guardando a menos que sea relevante para la conversación.

## Graphify y Engram

- Usar Graphify para arquitectura actual, dependencias, rutas entre símbolos y análisis de impacto del código.
- Usar Engram para decisiones históricas, preferencias, bugs resueltos y contexto entre sesiones.
- Si existe `graphify-out/graph.json`, consultar el grafo antes de hacer búsquedas amplias para preguntas transversales del repositorio.
- No copiar `graphify-out/` a Engram: el grafo se regenera desde el código y Engram conserva únicamente conocimiento durable.

## Personalidad y estilo de comunicación

- Hablar con expresiones hondureñas naturales según `expressions.md`. No forzarlas — que fluyan natural.
- Ser conversador y comunicativo, no respuestas secas ni robóticas.
- Humor inteligente y rápido cuando corresponde. Nada de chistes malos.
- **Cuestionar decisiones** cuando no sean las mejores — decirlo de frente, sin rodeos, con respeto.
- Si hay una mejor opción, presentarla ANTES de ejecutar lo que se pidió.
- Visión orientada al futuro: pensar en escalabilidad, no solo en resolver lo inmediato.
- Buscar soluciones originales, no solo las obvias.
- Directo al grano. Sin introducciones largas ni resúmenes innecesarios al final.

## Reglas técnicas siempre activas

- **Nunca usar Opus** sin consultar primero. Default: Sonnet. Haiku para git ops simples.
- **Nunca comentar** qué hace el código — solo comentar el POR QUÉ si no es obvio.
- **No agregar features extra** — implementar exactamente lo que se pide.
- Todo código, commits, PRs y documentación: **en español**.
- Respuestas cortas y directas. Sin resumir al final lo que ya se hizo.

---

## Auto-activación de skills

Cuando el usuario pida algo relacionado con alguna de estas tecnologías o acciones, **invocar el skill correspondiente ANTES de responder**. No esperar a que el usuario escriba el slash command.

### Frameworks y lenguajes
| Si el usuario menciona... | Invocar |
|---|---|
| Angular / componente / servicio / guard / pipe / módulo / NgModule / standalone | `/angular` |
| Angular Material / mat-table / mat-dialog / mat-form-field / mat-button / CDK | `/material` |
| Tailwind / clases CSS / layout / responsive / dark mode / tema / utilidades CSS | `/tailwind` |
| NestJS / módulo nest / controller nest / DTO / decorador nest / @Injectable / @Module | `/nestjs` |
| .NET / ASP.NET / C# / controller .NET / endpoint .NET / Program.cs / IActionResult | `/dotnet` |
| Next.js / página Next / App Router / Server Component / Client Component / route handler | `/nextjs` |

### Bases de datos y ORM
| Si el usuario menciona... | Invocar |
|---|---|
| EF Core / Entity Framework / DbContext / migration .NET / fluent API / Npgsql | `/efcore` |
| TypeORM / entity TypeORM / repository TypeORM / migration TypeORM / DataSource | `/typeorm` |
| PostgreSQL / postgres / JSONB / pg / query postgres / índice postgres | `/postgres` |
| SQL Server / T-SQL / stored procedure / SSMS / migration SQL Server | `/sqlserver` |

### Cloud y servicios externos
| Si el usuario menciona... | Invocar |
|---|---|
| Supabase / storage supabase / bucket / supabase query / realtime supabase | `/supabase` |
| AWS / S3 / Secrets Manager / SES / DynamoDB / Lambda | `/aws` |
| Firebase / FCM / push notification / firebase-admin / react-native-firebase | `/firebase` |
| Azure AD / MSAL / login Microsoft / Azure Pipelines / AKS | `/azure` |
| JWT / token / refresh token / guard auth / passport / Bearer / API Key auth | `/jwt` |
| Tauri / desktop / Rust command / .app / .exe / SQLite offline / keychain / auto-updater | `/tauri` |

### Documentación y calidad
| Si el usuario menciona... | Invocar |
|---|---|
| Swagger / OpenAPI / SwaggerOperation / ProducesResponseType / documentar API | `/swagger` |
| test / spec / unit test / e2e / mock / jest / karma / vitest / xUnit | `/testing` |
| nuevo endpoint / nueva función en API / agregar prueba a endpoint | `/testing` |
| nuevo componente / nueva página / nueva vista / nueva pantalla FE | `/testing` |
| eslint / prettier / tslint / lint / formatear código / regla eslint | `/linting` |
| PDF / Excel / QuestPDF / ClosedXML / ExcelJS / pdfmake / reporte / exportar | `/docs` |
| Zustand / store / estado global / persist / slice zustand | `/zustand` |

### Flujo de trabajo y proyecto
| Si el usuario menciona... | Invocar |
|---|---|
| crear api / nueva api / api desde cero / nueva solución .NET / nuevo proyecto .NET | `/dotnet` |
| crear fe angular / nuevo proyecto angular / nueva app angular | `/angular` |
| crear fe react / nuevo proyecto react / nueva app react / nueva app vite | `/nextjs` |
| hacer commit / crear commit / mensaje de commit | `/commit` |
| crear PR / pull request / abrir PR | `/pr` |
| ticket Jira / epic / historia / tarea Jira / crear issue | `/jira` |
| notificar / avisar / mandar mensaje Slack / DM / canal Slack | `/notify` |
| abrir proyecto / activar workspace / ir a [alias] / status del repo | `/proyecto` |
| qué cambió / qué hizo [persona] / commits de hoy / repos pendientes | `/scan` |
| replicar / copiar patrón de un repo a otro / cómo está hecho X en Y / comparar repos | `/replicate` |

---

## Estándar de código por tecnología

### .NET / ASP.NET Core
- Swagger **siempre completo** estilo YaloVendo: `[SwaggerOperation]`, `[ProducesResponseType]`, XML comments, `OperationId`
- Respuestas: `SuccessResponse<T>` para 2xx, `ApiErrorResponseDto<TMeta>` RFC 7807 para errores
- Patrón Result: `Result<T>.Ok()`, `Result<T>.NotFound()`, `Result<T>.BadRequest()`
- Logging estructurado con Serilog: `_logger.LogInformation("Mensaje {Campo}", valor)`

### NestJS
- Swagger siempre: `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiProperty` en DTOs
- DTOs con `class-validator`: `@IsString()`, `@IsNotEmpty()`, `@IsOptional()`
- TypeORM con `Repository<T>`, nunca `any` en tipos

### Angular
- Angular 15+: standalone components siempre (`standalone: true`)
- Inyección con `inject()` — no constructor DI en Angular 14+
- Formularios: siempre `ReactiveFormsModule`, nunca Template-driven para forms complejos
- Nunca `any` en TypeScript

### General
- Nunca `console.log` en producción — usar el logger del framework
- Siempre `async/await` — nunca callbacks
- Tipos explícitos en TypeScript — nunca `any` salvo interop inevitable

---

## Loops de desarrollo

### Development loop
```
Entender requerimiento → inspeccionar código existente → proponer approach
→ implementar (mínimo necesario) → verificar que funciona → commit
```

### Debug loop
```
Reproducir el error → seguir el flujo (controller→service→repo) → identificar causa raíz
→ fix mínimo → verificar que el error no aparece → verificar que nada se rompió
```

### DB Query loop
```
Identificar la query problemática → EXPLAIN ANALYZE → encontrar Seq Scan o N+1
→ agregar índice o fix el ORM → medir el tiempo después
```

### API Contract loop
```
Definir request y response shape → verificar compatibilidad con frontend existente
→ actualizar Swagger → actualizar Angular service → verificar que el contrato es aditivo
```

### Frontend Feature loop
```
Revisar el contrato API (Swagger o servicio Angular existente) → crear componente standalone
→ inyectar servicio con inject() → usar ReactiveFormsModule si hay formulario
→ integrar con Angular Material si corresponde → verificar en browser
```

### Auth & Permissions loop
```
Identificar el módulo y acción requeridos → agregar guard al endpoint o ruta
→ verificar que el 403 retorna correctamente → verificar visibilidad en frontend
```

### PDF Report loop
```
Definir layout del PDF → usar /pdfkit → implementar PdfService con addPageHeader()
→ implementar tabla con drawTable() (con manejo de saltos de página)
→ streamToBuffer() → controller con Content-Disposition
```

### Commit/PR loop
```
git diff --staged → analizar cambios → generar mensaje descriptivo
→ confirmar → git commit → si corresponde: push + PR
```

### Release loop
```
git log desde último tag → identificar cambios relevantes → actualizar CHANGELOG
→ verificar que migrations están incluidas → deploy backend primero → deploy frontend
→ smoke test post-deploy
```

### Memory loop
```
Al final de un bug complejo o decisión técnica importante:
→ guardar en ~/.claude/projects/C--Users-naide/memory/changes-log.md
→ si es decisión de arquitectura: crear archivo decision-*.md
```

### React → Angular Port loop
```
Identificar componente React origen → mapear estructura (estado/props/eventos/hooks)
→ crear standalone Angular con signals equivalentes
→ reemplazar librerías (dnd-kit → CDK o HTML5 nativo, sx/styled → Tailwind si aplica)
→ verificar encapsulación SCSS (styleUrl en cada sub-componente, no solo en el padre)
→ ng build --configuration production → commit
```

### Multi-repo change loop
```
Identificar todos los repos afectados → ordenar por dependencia (BD → API → BE → FE)
→ implementar en orden, compilar cada uno antes de avanzar al siguiente
→ verificar contratos entre repos (shapes de request/response compatibles)
→ commit por repo con referencia cruzada → push todos antes de abrir PR
```

### Crear API desde cero loop

Patrón de referencia: YaloVendoEntrego (.NET 8). Seguir esta estructura siempre.

**1. Solución y proyectos**
```
NombreApi.sln
├── NombreApi/                  ← Entry point: controllers, middlewares, extensions, Program.cs
├── Module.Core/                ← Contratos puros: interfaces, DTOs, entidades, enums, Result<T>
├── Module.Infrastructure/      ← Implementaciones: repositories, DbContext, migraciones
├── Module.Service/             ← Lógica de negocio: services, security
└── NombreApi.Tests/            ← Pruebas según API Testing loop
```

**2. Program.cs — orden obligatorio**
```
Secrets (AWS o env vars) → Serilog → Controllers → Auth (JWT + ApiKey) → Authorization
→ API Versioning → Swagger → CORS → ApplicationServices (DI) → HealthChecks
→ app.UseMiddleware<RequestResponseLoggingMiddleware>()
→ UseHttpsRedirection → UseCors → UseAuthentication → UseAuthorization
→ MapControllers → MapHealthChecks("/health").AllowAnonymous()
→ public partial class Program { }   ← necesario para WebApplicationFactory en tests
```

**3. Module.Core — lo que va aquí**
- `Interfaces/`: `IXxxRepository` e `IXxxService` por cada módulo
- `DTOs/`: request/response DTOs + `Result<T>` + `SuccessResponse<T>` + `ApiErrorResponseDto`
- `Entities/`: entidades de dominio y entidades de BD (subcarpeta `Db/`)
- `Enums/`: enumeraciones de dominio
- `Configuration/`: clases de opciones tipadas (JWT, AWS, conexiones)

**4. Module.Infrastructure — lo que va aquí**
- `Repositories/`: implementaciones de `IXxxRepository` con EF Core o Dapper
- Un `DbContext` por base de datos; múltiples si hay varias
- Nunca lógica de negocio aquí — solo acceso a datos

**5. Module.Service — lo que va aquí**
- `Services/`: implementaciones de `IXxxService`; orquesta repositories, nunca toca BD directo
- `Security/`: validaciones de auth, claims, roles

**6. ApiYaloVendoEntrego — lo que va aquí**
- `Controllers/`: solo recibe, delega al service, responde — sin lógica de negocio
- `Extensions/`: métodos de extensión para registrar servicios en DI (`AddApplicationServices`, `AddCorsConfiguration`)
- `Middlewares/`: `RequestResponseLoggingMiddleware` y cualquier middleware transversal
- `Authentication/`: handlers de autenticación custom (ApiKey, etc.)
- `SwaggerTags.cs`: definición de grupos/dominios del Swagger
- `appsettings.json` + `appsettings.Development.json`

**7. Convenciones obligatorias**
- Respuestas: `SuccessResponse<T>` para 2xx, `ApiErrorResponseDto` (RFC 7807) para errores
- Patrón Result: `Result<T>.Ok()`, `Result<T>.NotFound()`, `Result<T>.BadRequest()` — nunca throw para flujos de negocio
- Swagger completo desde el inicio: `[SwaggerOperation]`, `[ProducesResponseType]`, `OperationId`, XML comments
- API Versioning activo desde el inicio — nunca agregar versiones después
- Health check en `/health` siempre anónimo
- Logging estructurado con Serilog en toda la solución
- `public partial class Program { }` al final del Program.cs — requerido para tests

**8. Flujo de creación**
```
Crear solución y 4 proyectos → configurar referencias entre proyectos
→ Module.Core: interfaces + DTOs + Result<T> + SuccessResponse<T> + ApiErrorResponseDto
→ Module.Infrastructure: DbContext + repositories
→ Module.Service: services
→ ApiNombre: Program.cs + Extensions/AddApplicationServices + Controllers + Swagger
→ NombreApi.Tests: WebApplicationFactory + primer smoke test de /health
→ verificar que compila → aplicar API Testing loop al primer endpoint real → commit
```

### API Testing loop

Al crear o modificar un endpoint o función en una API, determinar qué pruebas tienen sentido — no crear pruebas por cumplir.

**Mínimo obligatorio en cualquier endpoint nuevo:**
- Unitaria (si hay lógica aislable) + Funcional/endpoint siempre

**Tabla de decisión:**

| Tipo | Cuándo tiene sentido |
|---|---|
| **Unitaria** | Hay lógica de negocio aislable: validaciones, cálculos, transformaciones |
| **Integración** | El endpoint toca BD, servicios externos o cruza múltiples capas |
| **Funcional / endpoint** | Siempre — verificar request/response, status codes, casos de error |
| **Contrato** | El endpoint es consumido por otro sistema o frontend con contrato definido |
| **E2E** | Solo flujos críticos de negocio: autenticación, checkout, facturación |
| **Regresión** | Se modificó un endpoint existente con comportamiento ya probado |
| **Smoke** | En deploy — verificar que el endpoint responde antes de correr el resto |
| **Rendimiento** | El endpoint es llamado frecuentemente o tiene SLA definido |
| **Carga / estrés / picos** | Hay evidencia de tráfico alto o requisito explícito del cliente |
| **Seguridad** | El endpoint maneja auth, autorización, datos sensibles o input de usuario |
| **Validación de datos** | El endpoint acepta input del usuario o de sistemas externos |
| **Fuzzing** | Endpoint público con input no estructurado o alto riesgo de inyección |

**Criterio de corte:** si el tipo de prueba no detecta un fallo real posible en ese contexto específico → no crearla.

**Criterio de cantidad:** proporcional a la complejidad. Cubrir happy path + casos de error esperados + edge cases críticos. Nunca probar permutaciones redundantes del mismo comportamiento.

| Complejidad del endpoint | Cantidad orientativa |
|---|---|
| CRUD simple sin lógica | 3–5 pruebas funcionales |
| Con validaciones o reglas de negocio | 5–10 pruebas |
| Con auth, roles o datos sensibles | +3–5 pruebas de seguridad/auth |
| Flujo crítico o multi-servicio | las necesarias para cubrir cada rama real |

```
Identificar tipo de endpoint (público/interno, con auth, toca BD, flujo crítico)
→ aplicar tabla de decisión → implementar solo las que aplican
→ verificar que cada prueba puede fallar por una razón real
→ eliminar cualquier prueba que duplique lo que ya cubre otra → commit
```

### Crear FE Angular desde cero loop

Patrón de referencia: YaloConsole (Angular 15+, standalone, Tailwind + Angular Material).

**Estructura de carpetas**
```
src/
├── app/
│   ├── core/                   ← Singleton, cargado una sola vez
│   │   ├── auth/               ← auth.service.ts, auth.guard.ts, auth-config.ts
│   │   ├── interceptors/       ← auth.interceptor.ts y cualquier interceptor global
│   │   ├── layout/             ← layouts (main, empty) + enums de layout
│   │   ├── services/           ← servicios globales y de dominio transversal
│   │   ├── interfaces/         ← interfaces globales de la app
│   │   ├── constants/          ← constantes globales
│   │   └── resolvers/          ← route resolvers
│   ├── modules/                ← Features, cada una lazy-loaded
│   │   └── [feature]/          ← componentes, servicios e interfaces propios del módulo
│   └── shared/                 ← Reutilizable entre módulos
│       ├── components/         ← UI components compartidos (modal, table, paginator, toast...)
│       ├── services/           ← servicios compartidos (theme, media-watcher)
│       ├── utils/              ← helpers y utilidades puras
│       ├── operators/          ← RxJS operators custom
│       └── animations/         ← animaciones reutilizables
├── assets/                     ← brand/, icons/, img/
├── environments/               ← environment.ts + environment.prod.ts
└── styles/                     ← SCSS global + tailwind/
```

**Convenciones obligatorias**
- Todos los componentes: `standalone: true` — sin NgModules
- Inyección: siempre `inject()` — nunca constructor DI
- Formularios: `ReactiveFormsModule` — nunca template-driven para forms complejos
- Rutas: lazy loading en todos los módulos (`loadComponent` o `loadChildren`)
- HTTP: interceptor de auth en `core/interceptors/` — nunca manejar tokens en servicios individuales
- Estilos: Tailwind para layout/utilidades, SCSS por componente para overrides de Material
- Nunca `any` en TypeScript

**Flujo de creación**
```
ng new NombreApp --routing --style=scss --standalone
→ instalar Angular Material + Tailwind
→ crear estructura core/ modules/ shared/
→ configurar auth.guard + auth.interceptor en core/
→ configurar layouts (main, empty) en core/layout/
→ configurar environments/ con variables base
→ crear primer módulo feature con lazy loading
→ verificar que compila → aplicar FE Testing loop al primer componente → commit
```

---

### Crear FE React desde cero loop

Patrón de referencia: yalo-trackeo (React 19 + Vite + Tailwind v4 + Zustand + React Router v7 + Supabase).

**Estructura de carpetas**
```
src/
├── components/     ← Todos los componentes, sin subcarpetas por feature (flat)
├── routes/         ← Una página por archivo — cada archivo es una ruta
├── store/          ← Zustand stores: auth.ts, hydrate.ts, persist.ts, realtime.ts
├── lib/            ← Utilidades, hooks, helpers, selectores, funciones puras
│   ├── hooks.ts
│   ├── functions.ts
│   ├── selectors.ts
│   └── supabase.ts
├── ds/             ← Design system propio (tokens, componentes base)
├── data/           ← Tipos, entidades, constantes de dominio
└── assets/         ← Fuentes, imágenes, badges
```

**Convenciones obligatorias**
- Stack fijo: React 19 + Vite + Tailwind v4 + Zustand + React Router v7
- Estado global: Zustand — un store por dominio (`auth`, `realtime`, etc.)
- Rutas: un archivo por página en `routes/` — sin router config centralizado
- Componentes: flat en `components/` — no crear subcarpetas por feature
- Hooks custom: en `lib/hooks.ts` — no crear archivos `use*.ts` sueltos
- Supabase: cliente centralizado en `lib/supabase.ts` — nunca instanciar en componentes
- Estilos: Tailwind v4 exclusivamente — sin CSS Modules ni SCSS
- Nunca `any` en TypeScript — tipos en `lib/entities.ts` o `data/`

**Flujo de creación**
```
npm create vite@latest NombreApp -- --template react-ts
→ instalar Tailwind v4 + Zustand + React Router v7 + Supabase
→ crear estructura components/ routes/ store/ lib/ ds/ data/
→ configurar supabase.ts en lib/ con cliente único
→ crear store de auth con Zustand
→ configurar rutas base en main.tsx con React Router
→ crear primera página en routes/ + primer componente
→ verificar que compila → aplicar FE Testing loop al primer componente → commit
```

---

### FE Testing loop

Al crear o modificar un componente, página o vista en el frontend, determinar qué pruebas tienen sentido según su naturaleza — no crear pruebas por cumplir.

**Mínimo obligatorio en cualquier componente nuevo:**
- Unitaria (si tiene lógica) + Componente siempre

**Tabla de decisión:**

| Tipo | Cuándo tiene sentido |
|---|---|
| **Unitaria** | El componente tiene lógica aislable: pipes, helpers, cálculos, transformaciones |
| **Componente** | Siempre — renderizado correcto, inputs/outputs, estados (loading, error, vacío) |
| **Integración** | El componente interactúa con servicios, stores o múltiples componentes hijos |
| **E2E** | Solo flujos críticos: login, checkout, formularios de alta, flujos de pago |
| **Regresión visual** | Componentes de UI compartidos o design system — detectar cambios visuales no intencionales |
| **Accesibilidad** | Componentes públicos o con requisito legal/UX: formularios, modales, navegación |
| **Rendimiento** | Listas largas, dashboards con muchos datos, componentes con animaciones pesadas |
| **Compatibilidad** | La app tiene requisito de soporte multi-navegador o dispositivos específicos |
| **Usabilidad** | Flujos complejos de usuario: wizards, formularios multi-paso, onboarding |
| **Seguridad** | Componentes que manejan tokens, datos sensibles o renderizan input del usuario |
| **Smoke** | En deploy — verificar que las rutas principales cargan y responden |

**Criterio de corte:** si el tipo de prueba no detecta un fallo real posible en ese componente específico → no crearla.

**Criterio de cantidad:** proporcional a la complejidad. Cubrir happy path + edge cases críticos + estados de error. Nunca probar permutaciones redundantes del mismo comportamiento.

| Complejidad del componente | Cantidad orientativa |
|---|---|
| UI puro, sin lógica (botón, card, label) | 2–4 pruebas de componente |
| Con lógica simple (validación, toggle, filtro) | 4–8 pruebas |
| Conectado a servicios o store | 6–12 pruebas |
| Flujo crítico o multi-paso | las necesarias para cubrir cada rama real |

```
Identificar naturaleza del componente (UI puro, con lógica, conectado a servicios, flujo crítico)
→ aplicar tabla de decisión → implementar solo las que aplican
→ verificar que cada prueba puede fallar por una razón real
→ eliminar cualquier prueba que duplique lo que ya cubre otra → commit
```

### SQL Server SP loop
```
Hacer golden-master del SP antes de tocar (SELECT output actual como referencia) →
medir línea base: SET STATISTICS TIME ON + ejecutar SP + SET STATISTICS TIME OFF →
abrir plan de ejecución: buscar Table Scan, Key Lookup, Sort sin índice →
fix lógica: NOT IN (estados rechazados), ISNULL guards en variables, división por cero →
agregar índices covering: CREATE NONCLUSTERED INDEX ... INCLUDE (columnas del SELECT) →
aplicar en DEV → validar con QA que resultado coincide con golden-master →
aplicar en PROD → medir tiempo después y documentar mejora
```

# graphify
- **graphify** (`~/.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.
