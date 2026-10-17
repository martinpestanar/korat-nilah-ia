---
name: supabase-korat
description: Inspección, consulta de esquemas, tablas y ejecución de queries SQL en la base de datos de Supabase de Korat MVP.
---

# Supabase Korat MVP Skill

Utiliza este skill siempre que el usuario pida ver tablas, esquemas, columnas o ejecutar consultas en la base de datos de este proyecto.

## Datos de Conexión
- **Host**: `aws-1-us-east-2.pooler.supabase.com`
- **Puerto**: `6543`
- **Base de datos**: `postgres`
- **Usuario**: `postgres.cfggpqpbqqeavdbdzwoz`
- **Password**: `impredecible`
- **Cadena Completa**: `postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres`

## Utilidad de Consulta
Puedes ejecutar consultas de forma rápida usando el helper `_ai_tools/db-query.js`:
```powershell
node _ai_tools/db-query.js "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
```
O directamente con cualquier sentencia SQL SELECT.
