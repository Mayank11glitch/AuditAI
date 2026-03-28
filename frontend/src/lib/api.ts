 
 
export const api = {
  uploadDocument: async (file: File, userId?: string | null) => {
    const formData = new FormData();
    formData.append("file", file);
    if (userId) {
      formData.append("user_id", userId);
    }

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Upload failed with status: ${res.status}`);
    }
    return res.json();
  },

  runAuditPipeline: async (documentId: number, extractedText: string) => {
    const res = await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id: documentId, extracted_text: extractedText }),
    });

    if (!res.ok) {
      throw new Error(`Audit failed with status: ${res.status}`);
    }
    return res.json();
  },

  askChatbot: async (question: string, documentId: number | null) => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, document_id: documentId }),
    });

    if (!res.ok) {
      throw new Error(`Chat request failed with status: ${res.status}`);
    }
    return res.json();
  },

  getUserHistory: async (userId: string) => {
    const res = await fetch(`/api/history/${userId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch history: ${res.status}`);
    }
    return res.json();
  },

  getAuditDetails: async (documentId: number) => {
    const res = await fetch(`/api/history/details/${documentId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch audit details: ${res.status}`);
    }
    return res.json();
  },

  clearUserHistory: async (userId: string) => {
    const res = await fetch(`/api/history/clear/${userId}`, { method: "DELETE" });
    if (!res.ok) {
      throw new Error(`Failed to clear history: ${res.status}`);
    }
    return res.json();
  },

  deleteAuditDocument: async (documentId: number, userId: string) => {
    const res = await fetch(`/api/history/document/${documentId}?user_id=${userId}`, { method: "DELETE" });
    if (!res.ok) {
      throw new Error(`Failed to delete document: ${res.status}`);
    }
    return res.json();
  }
};
