import json

with open(r"C:\Users\Martin\.gemini\antigravity\brain\983d1254-6e5d-4408-9f2e-9c48b6015439\.system_generated/steps/1205/output.txt", "r", encoding="utf-8") as f:
    data = json.load(f)

# Extract workflow data
workflow = data.get("data", {})

# Modifying connections
connections = workflow.get("connections", {})

# 1. Loop Negocios
# Original: main: [ [], [ { node: Cargar Reglas de Recordatorio, ... } ] ]
# Correct: main: [ [ { node: Cargar Reglas de Recordatorio, ... } ], [] ]
if " Loop Negocios" in connections:
    orig = connections[" Loop Negocios"].get("main", [])
    if len(orig) == 2:
        connections[" Loop Negocios"]["main"] = [orig[1], orig[0]]
        print("Updated Loop Negocios connections.")

# 2. Loop Reglas
# Original: main: [ [ { node: Loop Negocios, ... } ], [ { node: Obtener Clientes a Enviar, ... } ] ]
# Correct: main: [ [ { node: Obtener Clientes a Enviar, ... } ], [ { node: Loop Negocios, ... } ] ]
if "Loop Reglas" in connections:
    orig = connections["Loop Reglas"].get("main", [])
    if len(orig) == 2:
        connections["Loop Reglas"]["main"] = [orig[1], orig[0]]
        print("Updated Loop Reglas connections.")

# 3. Loop Clientes
# Original: main: [ [ { node: Pasar Reglas de Vuelta, ... } ], [ { node: Sin Clientes, ... } ] ]
# Correct: main: [ [ { node: Sin Clientes, ... } ], [ { node: Pasar Reglas de Vuelta, ... } ] ]
if "Loop Clientes" in connections:
    orig = connections["Loop Clientes"].get("main", [])
    if len(orig) == 2:
        connections["Loop Clientes"]["main"] = [orig[1], orig[0]]
        print("Updated Loop Clientes connections.")

# Save the modified workflow JSON
with open(r"C:\Users\Martin\Documents\Korat-Flow-Agencia\Korat_MVP\scratch\modified_workflow.json", "w", encoding="utf-8") as f:
    json.dump(workflow, f, indent=2)
print("Saved modified workflow to scratch/modified_workflow.json")
