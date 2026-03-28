 
import React, { createContext, useContext, useState } from 'react';

interface AppContextType {
  hasUploadedData: boolean;
  setHasUploadedData: (val: boolean) => void;
  documentId: number | null;
  setDocumentId: (val: number | null) => void;
  auditResults: any | null;
  setAuditResults: (val: any | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [hasUploadedData, setHasUploadedDataRaw] = useState(() => {
    try { return sessionStorage.getItem('auditai_hasUploaded') === 'true'; } catch { return false; }
  });
  const [documentId, setDocumentIdRaw] = useState<number | null>(() => {
    try { const v = sessionStorage.getItem('auditai_docId'); return v ? Number(v) : null; } catch { return null; }
  });
  const [auditResults, setAuditResultsRaw] = useState<any | null>(() => {
    try { const v = sessionStorage.getItem('auditai_results'); return v ? JSON.parse(v) : null; } catch { return null; }
  });

  const setHasUploadedData = (val: boolean) => {
    setHasUploadedDataRaw(val);
    try { sessionStorage.setItem('auditai_hasUploaded', String(val)); } catch {}
  };
  const setDocumentId = (val: number | null) => {
    setDocumentIdRaw(val);
    try { sessionStorage.setItem('auditai_docId', val != null ? String(val) : ''); } catch {}
  };
  const setAuditResults = (val: any | null) => {
    setAuditResultsRaw(val);
    try { sessionStorage.setItem('auditai_results', JSON.stringify(val)); } catch {}
  };

  return (
    <AppContext.Provider value={{ hasUploadedData, setHasUploadedData, documentId, setDocumentId, auditResults, setAuditResults }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
