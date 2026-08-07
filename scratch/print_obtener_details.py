import json

with open(r"C:\Users\Martin\Documents\Korat-Flow-Agencia\Korat_MVP\scratch\modified_workflow.json", "r", encoding="utf-8") as f:
    data = json.load(f)

nodes = data.get("nodes", [])
for node in nodes:
    if node.get("name") == "Obtener Clientes a Enviar":
        print(json.dumps(node, indent=2))
