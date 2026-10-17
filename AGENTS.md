# Supabase & Database Guidelines for Korat_MVP

## Contexto de la Base de Datos del Proyecto
Este proyecto (`Korat_MVP`) utiliza una base de datos de Supabase **independiente y aislada**:
- **Project ID**: `cfggpqpbqqeavdbdzwoz`
- **URL**: `https://cfggpqpbqqeavdbdzwoz.supabase.co`
- **Cadena de Conexión Postgres**:
  `postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres`

## Regla Estricta para Herramientas de Base de Datos y Supabase
1. **NO usar la cuenta global de Supabase:** Si existe una conexión MCP oficial global de Supabase (`https://mcp.supabase.com/mcp`), esta pertenece a otro proyecto de restaurantes (`koratflow-suna's Project`). **NUNCA** utilices las tablas de restaurantes (`restaurantes`, `categorias_menu`, `items_menu`, etc.) para este proyecto.
2. **Acceso a Datos y Tablas:**
   - Cuando el usuario pregunte por tablas, consultas SQL, esquemas o migraciones de Supabase en este workspace, utiliza siempre la base de datos de este proyecto (`cfggpqpbqqeavdbdzwoz`).
   - El workspace cuenta con la librería `pg` instalada y la cadena de conexión configurada en [.vscode/mcp.json](.vscode/mcp.json) y [mcp_config.json](mcp_config.json).
   - Para consultas directas a la base de datos o verificar esquemas, puedes ejecutar queries contra la cadena de conexión del pooler usando Node.js o el script utilitario disponible en el proyecto.
3. **Tablas Principales de este Proyecto:**
   - `Citas`, `Clientes`, `Usuarios`, `campanas`, `negocios`, `staff`, `servicios`, `copilot_conversations`, `plantillas_automatizacion`, etc.
