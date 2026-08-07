import json
import requests

url = "https://n8n.koratflow.agency/api/v1/workflows/M0wWce2FoGLMKbjfym5RN"
api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNjEyNDA3Zi0wY2Y5LTQ0NDktOThmYi1jZDdhODFmMTFhZmUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNTlmMGU4ZGEtYjU4Yi00ODA3LTk5MmQtNjNmZGYxYWM5YmJjIiwiaWF0IjoxNzcwNzQxMDM4fQ.lvFKb5WhiLRYNjA0l-LPTuc7f6_AT-mcFkPUpFjyXD4"

headers = {
    "X-N8N-API-KEY": api_key,
    "Content-Type": "application/json"
}

with open(r"C:\Users\Martin\Documents\Korat-Flow-Agencia\Korat_MVP\scratch\modified_workflow.json", "r", encoding="utf-8") as f:
    workflow_data = json.load(f)

payload = {
    "name": workflow_data.get("name"),
    "nodes": workflow_data.get("nodes"),
    "connections": workflow_data.get("connections"),
    "settings": {}
}

response = requests.put(url, headers=headers, json=payload)
print("Response Status Code:", response.status_code)
try:
    print("Response JSON:", response.json())
except Exception as e:
    print("Response Text:", response.text)
