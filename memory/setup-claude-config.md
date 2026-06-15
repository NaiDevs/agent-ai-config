---
name: setup-claude-config
description: "agent-ai-config repo location and structure — portable config for Claude Code and Codex with skills, MCPs and memory"
metadata: 
  node_type: memory
  type: reference
  originSessionId: baa97b0f-6550-4a98-92f2-501e6aea9d37
---

El sistema de configuración está en `C:\Users\naide\OneDrive\Documentos\Proyectos\Nai\agent-ai-config\` como repo git.
Repo GitHub: **NaiDevs/agent-ai-config** — `https://github.com/NaiDevs/agent-ai-config`

Ubicado en la carpeta NAI para que ambas herramientas (Claude Code y Codex) lo accedan vía filesystem MCP.

Estructura del repo:
- `projects-registry.md` — fuente de verdad de aliases y workspaces (editable)
- `commands/*.md` — 26 skills para Claude Code y Codex
- `memory/` — archivos de memoria por cliente
- `CLAUDE.md` — reglas globales y auto-activación de skills
- `setup.ps1` — instalador multi-tool (detecta Claude Code y/o Codex)
- `mcp.env.example` → copiar a `mcp.env` con tokens reales (gitignored)
- `mcp-config.json` — referencia de MCPs locales

Instalación en nuevo dispositivo:
1. Clonar: `git clone https://github.com/NaiDevs/agent-ai-config.git $repoPath`
2. Copiar y llenar: `mcp.env.example → mcp.env`
3. Correr: `.\setup.ps1` (auto-detecta Claude Code y/o Codex)
4. Reiniciar la herramienta

Para sincronizar cambios:
1. Editar `~/.claude/projects-registry.md` o los commands
2. Copiar de vuelta al repo en Proyectos/Nai/agent-ai-config/
3. Hacer commit y push
4. En otro dispositivo: `git pull && .\setup.ps1`
