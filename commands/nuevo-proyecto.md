---
name: nuevo-proyecto
description: Inicializa configuración de Claude Code y Codex en el proyecto actual — detecta el stack y genera .claude/settings.json y AGENTS.md automáticamente
---

# nuevo-proyecto

Inicializa la configuración de agentes en el proyecto actual. Se activa cuando el usuario dice "inicializar proyecto", "setup agentes", "configurar claude aquí", o cuando se detecta un proyecto sin `.claude/`.

## Instrucciones

### Paso 1 — Detectar el stack

Leer en paralelo los archivos de configuración del proyecto:
- `package.json` → Node.js / framework JS
- `angular.json` → Angular
- `next.config.*` → Next.js
- `*.csproj` o `*.sln` → .NET / C#
- `nest-cli.json` → NestJS
- `tailwind.config.*` → Tailwind CSS
- `tsconfig.json` → TypeScript
- `requirements.txt` / `pyproject.toml` → Python

Determinar el stack principal. Puede ser una combinación (ej: Angular + .NET API).

### Paso 2 — Crear `.claude/settings.json`

Crear (o actualizar si ya existe) `.claude/settings.json` con permisos base:

```json
{
  "permissions": {
    "allow": [
      "Bash(git *)",
      "Bash(npm *)",
      "Bash(npx *)"
    ],
    "defaultMode": "default"
  }
}
```

Agregar permisos adicionales según stack detectado:
- .NET → `"Bash(dotnet *)"`, `"Bash(ef *)"` 
- Angular/Node → `"Bash(ng *)"`, `"Bash(yarn *)"`, `"Bash(pnpm *)"` si aplica
- Docker → `"Bash(docker *)"`, `"Bash(docker-compose *)"` si hay Dockerfile

### Paso 3 — Crear `AGENTS.md`

Crear `AGENTS.md` en la raíz del proyecto con los skills relevantes al stack.

**Plantilla base:**

```markdown
# [Nombre del proyecto] — Agent Skills Index

## Skills activos

| Skill | Cuándo usarlo | Path |
|-------|--------------|------|
```

Agregar skills según stack detectado:

| Stack detectado | Skills a incluir |
|-----------------|-----------------|
| Angular | `angular`, `material`, `tailwind` |
| Next.js | `nextjs`, `tailwind`, `zustand` |
| NestJS | `nestjs`, `typeorm`, `jwt`, `swagger` |
| .NET / ASP.NET | `dotnet`, `efcore`, `swagger`, `jwt` |
| PostgreSQL | `postgres` |
| SQL Server | `sqlserver` |
| AWS | `aws` |
| Supabase | `supabase` |
| Firebase | `firebase` |
| Tests | `testing` |

### Paso 4 — Agregar `.claude/` a `.gitignore` parcialmente

Si hay `.gitignore`, verificar que `settings.local.json` esté ignorado:

```
.claude/settings.local.json
```

No ignorar `.claude/settings.json` (ese sí va al repo para compartir con el equipo).

### Paso 5 — Confirmar

Mostrar resumen de lo creado:
- Stack detectado
- Archivos generados
- Skills configurados en AGENTS.md

Informar al usuario que `.claude/settings.json` y `AGENTS.md` deben commitearse para que el equipo los comparta.

## Notas
- Si `.claude/settings.json` ya existe, mergear permisos — no sobreescribir
- `AGENTS.md` sí se sobreescribe (siempre refleja el stack actual)
- No crear `CLAUDE.md` a nivel de proyecto a menos que el usuario lo pida explícitamente
