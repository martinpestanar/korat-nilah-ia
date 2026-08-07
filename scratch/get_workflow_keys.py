import requests

url = "https://n8n.koratflow.agency/api/v1/workflows/M0wWce2FoGLMKbjfym5RN"
api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNjEyNDA3Zi0wY2Y5LTQ0NDktOThmYi1jZDdhODFmMTFhZmUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNTlmMGU4ZGEtYjU4Yi00ODA3LTk5MmQtNjNmZGYxYWM5YmJjIiwiaWF0IjoxNzcwNzQxMDM4fQ.lvFKb5WhiLRYNjA0l-LPTuc7f6_AT-mcFkPUpFjyXD4"

headers = {
    "X-N8N-API-KEY": api_key
}

response = requests.get(url, headers=headers)
print("Keys:", list(response.json().keys()))
