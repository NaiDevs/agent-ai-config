# claude-config

Configuración personal de Claude Code — proyectos, aliases, workspaces, skills, MCPs y memoria persistente.

## Contenido

- **`CLAUDE.md`** — Reglas siempre activas + auto-activación de skills por contexto
- **`projects-registry.md`** — Registro editable de proyectos, aliases, Jira keys y workspaces
- **`commands/`** — 26 skills personalizados (`/angular`, `/nestjs`, `/dotnet`, `/swagger`, etc.)
- **`memory/`** — Archivos de memoria por cliente (cargados automáticamente por Claude)
- **`mcp-config.json`** — Configuración de MCPs locales (GitHub, PostgreSQL, Filesystem, Brave, Memory)
- **`mcp-secrets-guide.md`** — Guía de variables de entorno para MCPs
- **`setup.ps1`** — Instalador completo para Windows

---

## Instalación en nuevo dispositivo

### 1. Clonar el repo

```powershell
git clone https://github.com/NaiDevs/claude-config.git "$env:USERPROFILE\.claude\claude-config"
cd "$env:USERPROFILE\.claude\claude-config"
.\setup.ps1
```

El script instala automáticamente: commands, memoria, registry, CLAUDE.md y MCPs.

### 2. Configurar tokens para MCPs

Los tokens se guardan como variables de entorno del sistema — **nunca en archivos**.

#### GitHub Token — `GITHUB_PERSONAL_ACCESS_TOKEN`

1. Ir a **github.com → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Clic en **"Generate new token (classic)"**
3. Permisos mínimos: `repo`, `read:org`, `read:user`
4. Copiar el token `ghp_...`

#### PostgreSQL URL — `DATABASE_URL`

String de conexión de tu DB local de desarrollo:
```
postgresql://usuario:password@localhost:5432/nombre_db
```

#### Brave Search API Key — `BRAVE_API_KEY`

1. Ir a **brave.com/search/api**
2. Crear cuenta → plan gratuito (2,000 queries/mes)
3. Copiar el key `BSA...`

#### Guardar los tokens en Windows (permanente)

```powershell
[System.Environment]::SetEnvironmentVariable("GITHUB_PERSONAL_ACCESS_TOKEN", "ghp_TU_TOKEN", "User")
[System.Environment]::SetEnvironmentVariable("DATABASE_URL", "postgresql://user:pass@localhost/dev_db", "User")
[System.Environment]::SetEnvironmentVariable("BRAVE_API_KEY", "BSA_TU_KEY", "User")
```

### 3. Reiniciar Claude Code

Los MCPs y skills quedan disponibles automáticamente en la siguiente sesión.

---

## MCPs locales incluidos

| MCP | Qué hace |
|---|---|
| **github** | Buscar código en repos, crear PRs, gestionar issues sin salir de Claude |
| **postgres** | Queries directas a DBs PostgreSQL de desarrollo |
| **filesystem** | Acceso a todos los proyectos en `Proyectos/` sin hacer cd |
| **brave-search** | Buscar docs y librerías desde la conversación |
| **memory** | Knowledge graph complementario al sistema de memoria |

> Los MCPs cloud (Jira, Slack, Microsoft 365, Figma) se conectan por cuenta de claude.ai — no requieren configuración en el repo.

---

## Skills disponibles (`/comando`)

| Skill | Para qué |
|---|---|
| `/proyecto` | Navegar entre proyectos y workspaces con git sync |
| `/scan` | Ver qué cambió hoy, qué hizo [autor], repos pendientes |
| `/commit` | Generar commits descriptivos en español |
| `/pr` | Crear Pull Requests descriptivos |
| `/jira` | Crear epics, historias y tareas en Jira |
| `/notify` | Notificar cambios a compañeros por Slack |
| `/angular` | Generar componentes, servicios, guards Angular |
| `/material` | Tablas, dialogs, formularios con Angular Material |
| `/tailwind` | Layouts, componentes, temas Tailwind CSS |
| `/nestjs` | Módulos, controllers, DTOs, guards NestJS |
| `/dotnet` | Endpoints, DTOs, migrations .NET |
| `/nextjs` | Páginas, componentes, stores Next.js |
| `/efcore` | DbContext, migrations, queries EF Core |
| `/typeorm` | Entidades, repos, migrations TypeORM |
| `/postgres` | Queries, índices, migrations PostgreSQL |
| `/sqlserver` | T-SQL, stored procedures, migrations SQL Server |
| `/zustand` | Stores con persist, devtools, slices |
| `/jwt` | Auth JWT y API Key en NestJS y .NET |
| `/aws` | Secrets Manager, S3, SES, DynamoDB |
| `/firebase` | Push notifications FCM, Firebase Admin |
| `/azure` | MSAL Angular, Azure AD, Azure Pipelines |
| `/supabase` | Storage, queries, realtime Supabase |
| `/swagger` | Documentación OpenAPI estándar YaloVendo |
| `/testing` | Unit tests, e2e, mocks por framework |
| `/linting` | ESLint, Prettier, TSLint |
| `/docs` | PDFs con QuestPDF, Excel con ClosedXML/ExcelJS |

> Los skills se activan automáticamente por contexto — no siempre es necesario escribir el comando.

---

## Actualizar en otro dispositivo

```powershell
git -C "$env:USERPROFILE\.claude\claude-config" pull
.\setup.ps1
# Reiniciar Claude Code
```

## Editar aliases o workspaces

```powershell
code "$env:USERPROFILE\.claude\projects-registry.md"

git -C "$env:USERPROFILE\.claude\claude-config" add projects-registry.md
git -C "$env:USERPROFILE\.claude\claude-config" commit -m "update aliases"
git -C "$env:USERPROFILE\.claude\claude-config" push
```

## Estructura de aliases

| Prefijo | Cliente |
|---|---|
| `yalo *` | YALO |
| `bodega *` | La Bodega |
| `bi *` / `cpa *` | CORINSA |
| `ult *` | Ultimate Labs |
| `doctor *` | EMSULA Doctor |
| `nai *` | NAI (personal) |
