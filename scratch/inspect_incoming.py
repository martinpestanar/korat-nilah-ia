import json

with open(r"C:\Users\Martin\Documents\Korat-Flow-Agencia\Korat_MVP\scratch\modified_workflow.json", "r", encoding="utf-8") as f:
    data = json.load(f)

connections = data.get("connections", {})

# Let's find all nodes that connect to Cargar Reglas de Recordatorio
incoming = []
for source, targets in connections.items():
    main_targets = targets.get("main", [])
    for output_idx, target_list in enumerate(main_targets):
        for target in target_list:
            if target.get("node") == "Cargar Reglas de Recordatorio":
                incoming.append({
                    "source": source,
                    "output_index": output_idx,
                    "target_index": target.get("index")
                })

print("Incoming connections to Cargar Reglas de Recordatorio:")
print(json.dumps(incoming, indent=2))
