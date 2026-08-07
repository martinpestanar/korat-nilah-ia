import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r"C:\Users\Martin\.gemini\antigravity\brain\983d1254-6e5d-4408-9f2e-9c48b6015439\.system_generated/steps/1353/output.txt", "r", encoding="utf-8") as f:
    data = json.load(f)

nodes = data.get("data", {}).get("nodes", {})
node_data = nodes.get(" Loop Negocios", {})

print(json.dumps(node_data, indent=2))
