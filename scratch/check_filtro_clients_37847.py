import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r"C:\Users\Martin\.gemini\antigravity\brain\983d1254-6e5d-4408-9f2e-9c48b6015439\.system_generated/steps/1389/output.txt", "r", encoding="utf-8") as f:
    data = json.load(f)

nodes = data.get("data", {}).get("nodes", {})
node_data = nodes.get("Filtro de Keywords y Citas Futuras", {})

output_runs = node_data.get("data", {}).get("output", [])
print("Filtro de Keywords outputs:")
for idx, run in enumerate(output_runs):
    print(f"Run {idx} output keys:")
    for item in run:
        print("  -", list(item.get("json", {}).keys()))
