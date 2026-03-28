const fs = require('fs');

async function test() {
  try {
    const fileBlob = new Blob(["date,amount\n2023-01-01,100"], { type: 'text/csv' });
    const formData = new FormData();
    formData.append("file", fileBlob, "test.csv");

    console.log("Uploading file...");
    const res = await fetch("http://localhost:8001/api/upload", {
      method: "POST",
      body: formData
    });

    const uploadData = await res.json();
    console.log("Upload Success:", uploadData.success);

    if (uploadData.success) {
      console.log("Running audit pipeline...");
      const auditRes = await fetch("http://localhost:8001/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: uploadData.document_id,
          extracted_text: uploadData.extracted_text
        })
      });
      const auditData = await auditRes.json();
      console.log("Audit Success:", auditData.success);
      if (auditData.success) {
        console.log("Health Score:", auditData.health_score);
        console.log("Violations length:", auditData.violations?.length);
        console.log("Knowledge Graph keys:", Object.keys(auditData.knowledge_graph || {}));
      } else {
        console.log("Audit Error:", auditData.error);
      }
    }
  } catch (e) {
    console.error("Test failed:", e);
  }
}
test();
