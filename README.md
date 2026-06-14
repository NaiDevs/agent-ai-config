# claude-config

Configuración personal de Claude Code con registro de proyectos, aliases y workspaces.

## Contenido

- **`projects-registry.md`** — Registro editable de todos los proyectos con aliases y workspaces
- **`skills/proyecto.md`** — Skill `/proyecto` para navegar entre proyectos con git sync
- **`memory/`** — Archivos de memoria por cliente (cargados automáticamente por Claude)
- **`setup.ps1`** — Script de instalación para Windows
- **`settings-hook.json`** — Fragmento opcional para git fetch automático

## Instalación en nuevo dispositivo

### Opción A: Clonar en la ubicación estándar

```powershell
git clone <repo-url> "$env:USERPROFILE\.claude\claude-config"
cd "$env:USERPROFILE\.claude\claude-config"
.\setup.ps1
```

### Opción B: Path de proyectos diferente

```powershell
.\setup.ps1 -ProjectsRoot "D:\MisProyectos"
```

### Después de la instalación

1. Reiniciar Claude Code
2. La memoria se carga automáticamente en cada conversación
3. El skill `/proyecto` está disponible de inmediato

## Uso del skill /proyecto

```
/proyecto                    Lista todos los proyectos por cliente
/proyecto list               Idem
/proyecto list yalo          Solo los proyectos de YALO
/proyecto yalo bo            Activa YaloPOSBackoffice (cd + git fetch + status)
/proyecto yalo bo api        Activa la API del POS
/proyecto ws list            Lista todos los workspaces
/proyecto ws yalo pos        Activa workspace POS (bo + bo api, muestra status unificado)
/proyecto sync yalo bo       git pull directo sin confirmar
/proyecto github yalo bo     Muestra commits remotos pendientes
```

## Reconocimiento automático de aliases

Sin invocar el skill, Claude reconoce los aliases en conversación:
- "estoy trabajando en **yalo bo**" → Claude sabe el path y stack
- "qué hay en **bodega shop**" → lista los repos del workspace

## Editar aliases o workspaces

```
# Editar el registry (fuente de verdad)
code "$env:USERPROFILE\.claude\projects-registry.md"

# Sincronizar cambios
git -C "$env:USERPROFILE\.claude\claude-config" add projects-registry.md
git -C "$env:USERPROFILE\.claude\claude-config" commit -m "update aliases"
git -C "$env:USERPROFILE\.claude\claude-config" push
```

## Actualizar en otro dispositivo después de cambios

```powershell
git -C "$env:USERPROFILE\.claude\claude-config" pull
.\setup.ps1
# Reiniciar Claude Code
```

## Agregar un workspace nuevo

Editar `projects-registry.md`, sección **Workspaces**, y agregar una fila a la tabla:

```markdown
| mi workspace | alias1, alias2, alias3 | Descripción del grupo |
```

Luego hacer commit y push.

## Estructura de aliases

| Prefijo        | Cliente         |
|----------------|-----------------|
| `yalo *`       | YALO            |
| `bodega *`     | La Bodega       |
| `corinsa bi *` | CORINSA BI      |
| `cpa *`        | CORINSA CPA     |
| `ult *`        | Ultimate Labs   |
| `doctor *`     | EMSULA Doctor   |
| `nai *`        | NAI (personal)  |
