import requests  # pyre-ignore[21]

with open("test.csv", "w") as f:
    f.write("date,amount\n2023-01-01,100")

upload_res = requests.post("http://localhost:8001/api/upload", files={"file": open("test.csv", "rb")})
print("UPLOAD:", upload_res.json())

doc_id = upload_res.json().get("document_id")
text = upload_res.json().get("extracted_text")
if doc_id:
    audit_res = requests.post("http://localhost:8001/api/audit", json={"document_id": doc_id, "extracted_text": text})
    print("\nAUDIT:", audit_res.json())
