import json

with open(r"C:\Users\Martin\Documents\Korat-Flow-Agencia\Korat_MVP\scratch\modified_workflow.json", "r", encoding="utf-8") as f:
    data = json.load(f)

connections = data.get("connections", {})
print("Loop Negocios connections:")
print(json.dumps(connections.get(" Loop Negocios"), indent=2))
print("Loop Reglas connections:")
print(json.dumps(connections.get("Loop Reglas"), indent=2))
print("Loop Clientes connections:")
print(json.dumps(connections.get("Loop Clientes"), indent=2))
