# proyecto

Lee `~/.claude/projects-registry.md` para resolver aliases de proyectos y workspaces. Este skill gestiona la navegación entre los proyectos de trabajo y mantiene sincronización con repositorios remotos.

## Uso

```
/proyecto [alias]          → Activa un proyecto específico
/proyecto ws [workspace]   → Activa un workspace (múltiples repos)
/proyecto list             → Lista todos los proyectos por cliente
/proyecto ws list          → Lista todos los workspaces definidos
/proyecto sync [alias]     → git pull directo sin confirmar
/proyecto github [alias]   → Muestra commits remotos pendientes
```

## Instrucciones de comportamiento

### Al invocar `/proyecto [alias]`

1. Leer `~/.claude/projects-registry.md`
2. Buscar el alias en las tablas (case-insensitive)
3. Construir el path completo: `<base_path_del_cliente>\<carpeta>`
4. Ejecutar `cd "<path>"` para cambiar al directorio
5. Si el directorio tiene `.git`:
   - Correr `git fetch --all --quiet`
   - Mostrar `git status --short`
   - Mostrar `git log --oneline -5`
   - Si hay commits remotos pendientes (`git log HEAD..@{u} --oneline`), informar cuántos
   - Preguntar: "¿Hacemos git pull?" antes de ejecutarlo
6. Mostrar resumen: alias, path, stack, proyectos relacionados del mismo cliente

### Al invocar `/proyecto ws [workspace]`

1. Leer `~/.claude/projects-registry.md`, sección Workspaces
2. Resolver cada alias del workspace a su path completo
3. Para cada repo en paralelo: `git fetch --all --quiet`
4. Mostrar tabla de status:

```
┌─ workspace: yalo pos ──────────────────────────────┐
│ yalo bo     │ ..\YALO\YaloPOSBackoffice            │
│             │ ✓ Al día  (branch: main)              │
├─────────────┼──────────────────────────────────────┤
│ yalo bo api │ ..\YALO\YaloPOSBackofficeAPI         │
│             │ ↓ 2 commits por bajar  (branch: dev)  │
│             │ Último: "fix: endpoint facturas" 3h   │
└─────────────┴──────────────────────────────────────┘
```

5. Si hay repos con commits pendientes: preguntar "¿Hacer git pull en los que tienen cambios? (todos/algunos/no)"

### Con workspace activo en la conversación

Cuando el usuario hace una pregunta sobre los repos del workspace (ej. "¿qué cambió hoy?", "¿hay algo sin mergear?"):
- Consultar `git log --since="1 day ago" --oneline` en cada repo del workspace
- Unificar y mostrar agrupado por repo

### Al mencionar un alias sin invocar el skill

Si el usuario dice "estoy trabajando en yalo bo" o "abre bodega ecom api":
1. Reconocer el alias desde la memoria
2. Informar el path y stack del proyecto
3. Ofrecer: "¿Activamos el proyecto? (`/proyecto yalo bo`)"

### Paths base por cliente

```
YALO:          C:\Users\naide\OneDrive\Documentos\Proyectos\YALO\
LA BODEGA:     C:\Users\naide\OneDrive\Documentos\Proyectos\LA BODEGA\
CORINSA BI:    C:\Users\naide\OneDrive\Documentos\Proyectos\CORINSA BI\
CORINSA CPA:   C:\Users\naide\OneDrive\Documentos\Proyectos\CORINSA CPA\
ULTIMATE LABS: C:\Users\naide\OneDrive\Documentos\Proyectos\ULTIMATE LABS\
EMSULA DOCTOR: C:\Users\naide\OneDrive\Documentos\Proyectos\EMSULA DOCTOR\
NAI:           C:\Users\naide\OneDrive\Documentos\Proyectos\Nai\
```

### `/proyecto list`

Mostrar tabla compacta agrupada por cliente con alias, stack y descripción.

### `/proyecto list [cliente]`

Filtrar por cliente (ej. `/proyecto list yalo`, `/proyecto list bodega`).

### `/proyecto sync [alias]`

Hacer `git pull` directamente sin preguntar.

### `/proyecto github [alias]`

- Hacer `git fetch`
- Mostrar `git log HEAD..origin/<branch> --oneline` (commits remotos que no están en local)
- Mostrar nombre de la rama actual y rama remota
