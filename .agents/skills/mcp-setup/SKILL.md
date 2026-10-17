---
name: mcp-setup
description: Reference and instructions for configuring, verifying, and troubleshooting MCP servers (n8n, GitHub, Notion, Supabase, Chrome DevTools) across workspaces and IDEs.
---

# MCP Setup & Workspace Portability Guide

Este skill explica la arquitectura y configuración de servidores MCP en este repositorio para que cualquier entorno o IDE (Antigravity, Cursor, Windsurf, VS Code) los cargue sin fricción.

---

## 1. Archivos de Configuración en el Proyecto

El repositorio cuenta con dos ubicaciones estándar:
- [`.vscode/mcp.json`](file:///c:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/.vscode/mcp.json): Usado de forma nativa por VS Code y herramientas basadas en él.
- [`mcp_config.json`](file:///c:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/mcp_config.json): Ubicado en la raíz del proyecto para Antigravity y herramientas compatibles con la especificación MCP de Anthropic/Gemini.

---

## 2. Servidores Configurados

| Servidor | Tipo / Comando | Función Principal |
| :--- | :--- | :--- |
| **`n8n-mcp`** | `node ${workspaceFolder}/_ai_tools/n8n-mcp/dist/mcp/index.js` | Automatización de flujos, nodos y ejecuciones en n8n de Korat Flow. |
| **`github`** | `npx -y @modelcontextprotocol/server-github` | Manejo de PRs, issues, commits y ramas de GitHub. |
| **`notion-mcp-server`** | `npx -y @notionhq/notion-mcp-server` | Consulta y edición de páginas, bases de datos y bloques en Notion. |
| **`supabase`** | SSE (`https://mcp.supabase.com/mcp`) | Gestión de tablas, migraciones, SQL y funciones de Supabase. |
| **`chrome-devtools`** | `npx -y chrome-devtools-mcp@latest` | Inspección visual, consola, DOM y automatización de navegador web. |
| **`StitchMCP`** *(deshabilitado)* | `npx -y mcp-remote ...` | Conector Google Stitch (activar si se requiere diseño UI). |
| **`netlify`** *(deshabilitado)* | `npx -y @netlify/mcp` | Despliegue y administración de sitios en Netlify. |

---

## 3. ¿Cómo migrar este proyecto a otra PC o IDE?

1. **Clonar o mover el proyecto:**
   Al usar `${workspaceFolder}`, la ruta hacia `_ai_tools/n8n-mcp/` se resuelve automáticamente sin depender del nombre de usuario de Windows (`Martin`).

2. **Requisitos previos en la nueva máquina:**
   - **Node.js** (v18 o superior) instalado con `npm` y `npx`.
   - Dependencias del MCP local: si se clona en limpio, verificar que `_ai_tools/n8n-mcp` tenga sus dependencias (`npm install` dentro de `_ai_tools/n8n-mcp` si faltara `node_modules` o build `dist/`).

3. **Cargar en Antigravity Globalmente (Opcional):**
   Si quieres que estos mismos MCP estén disponibles en **cualquier otro proyecto nuevo**, copia el contenido de [`mcp_config.json`](file:///c:/Users/Martin/Documents/Korat-Flow-Agencia/Korat_MVP/mcp_config.json) en:
   - Windows: `C:\Users\<TuUsuario>\.gemini\config\mcp_config.json`
   - Linux/Mac: `~/.gemini/config/mcp_config.json`

---

## 4. Verificación Rápida de Salud

- En Antigravity: Revisa la sección de herramientas MCP disponibles en el sistema o prueba invocando una herramienta (ej. listar tablas con `supabase` o flujos con `n8n`).
- En caso de error de ruta en `n8n`: Verifica que `_ai_tools/n8n-mcp/dist/mcp/index.js` exista en el workspace.
