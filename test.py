import requests

try:
    print("Testing upload...")
    with open("test.csv", "w") as f:
        f.write("date,amount\n2023-01-01,100")
    
    upload_res = requests.post("http://localhost:8001/api/upload", files={"file": open("test.csv", "rb")})
    print("UPLOAD STATUS:", upload_res.status_code)
    upload_data = upload_res.json()
    print("UPLOAD DATA:", upload_data)
    
    if upload_data.get("success"):
        print("\nTesting audit...")
        audit_res = requests.post("http://localhost:8001/api/audit", json={
            "document_id": upload_data["document_id"],
            "extracted_text": upload_data["extracted_text"]
        })
        print("AUDIT STATUS:", audit_res.status_code)
        try:
            print("AUDIT DATA KEYS:", audit_res.json().keys())
            print("AUDIT SUCCESS?", audit_res.json().get("success"))
            if not audit_res.json().get("success"):
                print("AUDIT ERROR:", audit_res.json().get("error"))
        except Exception as e:
            print("AUDIT FAILED TO DECODE JSON:", e)
            print("RAW TEXT:", audit_res.text)
except Exception as e:
    print("ERROR:", e)
