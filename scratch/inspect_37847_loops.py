import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r"C:\Users\Martin\.gemini\antigravity\brain\983d1254-6e5d-4408-9f2e-9c48b6015439\.system_generated/steps/1389/output.txt", "r", encoding="utf-8") as f:
    data = json.load(f)

nodes = data.get("data", {}).get("nodes", {})

# Check Loop Clientes
lc_data = nodes.get("Loop Clientes", {})
print("Loop Clientes Items Output:", lc_data.get("itemsOutput"))
print("Loop Clientes Output length:", len(lc_data.get("data", {}).get("output", [])))
print("Loop Clientes Output[0] length:", len(lc_data.get("data", {}).get("output", [[]])[0]))

# Check Sin Clientes?
sc_data = nodes.get("Sin Clientes?", {})
print("\nSin Clientes? Items Output:", sc_data.get("itemsOutput"))
print("Sin Clientes? Output:")
print(json.dumps(sc_data.get("data", {}).get("output", []), indent=2)[:500])
