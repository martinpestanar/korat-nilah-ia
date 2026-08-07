import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r"C:\Users\Martin\.gemini\antigravity\brain\983d1254-6e5d-4408-9f2e-9c48b6015439\.system_generated/steps/1389/output.txt", "r", encoding="utf-8") as f:
    data = json.load(f)

nodes = data.get("data", {}).get("nodes", {})
node_data = nodes.get("Loop Reglas", {})

output_runs = node_data.get("data", {}).get("output", [])
print("Loop Reglas outputs:")
for idx, run in enumerate(output_runs):
    print(f"Run {idx} output:")
    for item in run:
        print("  - Rule ID:", item.get("json", {}).get("id"))
        print("    Service:", item.get("json", {}).get("servicio"))
        print("    Business ID:", item.get("json", {}).get("business_id"))
        print("    Keywords:", item.get("json", {}).get("keywords"))
        print("    Dias Min:", item.get("json", {}).get("dias_min"))
        print("    Dias Max:", item.get("json", {}).get("dias_max"))
