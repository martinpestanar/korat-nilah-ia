import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r"C:\Users\Martin\.gemini\antigravity\brain\983d1254-6e5d-4408-9f2e-9c48b6015439\.system_generated/steps/1197/output.txt", "r", encoding="utf-8") as f:
    text = f.read()

for keyword in ["p_business_id", "p_dias_min", "p_dias_max", "p_keywords"]:
    count = text.count(keyword)
    print(f"Keyword '{keyword}' count:", count)
