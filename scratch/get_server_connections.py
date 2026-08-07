import requests
import json

url = "https://n8n.koratflow.agency/api/v1/workflows/M0wWce2FoGLMKbjfym5RN"
api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNjEyNDA3Zi0wY2Y5LTQ0NDktOThmYi1jZDdhODFmMTFhZmUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNTlmMGU4ZGEtYjU4Yi00ODA3LTk5MmQtNjNmZGYxYWM5YmJjIiwiaWF0IjoxNzcwNzQxMDM4fQ.lvFKb5WhiLRYNjA0l-LPTuc7f6_AT-mcFkPUpFjyXD4"

headers = {
    "X-N8N-API-KEY": api_key
}

response = requests.get(url, headers=headers)
workflow = response.json()

print("Connections currently on the server:")
print(json.dumps(workflow.get("connections", {}).get(" Loop Negocios"), indent=2))
print(json.dumps(workflow.get("connections", {}).get("Loop Reglas"), indent=2))
print(json.dumps(workflow.get("connections", {}).get("Loop Clientes"), indent=2))
