import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r"C:\Users\Martin\.gemini\antigravity\brain\983d1254-6e5d-4408-9f2e-9c48b6015439\.system_generated/steps/1389/output.txt", "r", encoding="utf-8") as f:
    data = json.load(f)

nodes = data.get("data", {}).get("nodes", {})
node_data = nodes.get("Obtener Clientes a Enviar", {})

output_runs = node_data.get("data", {}).get("output", [])
print("Total runs in Obtener Clientes:", len(output_runs))
for idx, run in enumerate(output_runs):
    print(f"Run {idx} has {len(run)} items")
    for item_idx, item in enumerate(run):
        print(f"  Item {item_idx} keys:", list(item.get("json", {}).keys()))
        if len(item.get("json", {}).keys()) > 0:
            print("    ", json.dumps(item.get("json"))[:300])
