import fitz  # pyre-ignore[21]
import pandas as pd  # pyre-ignore[21]
import io


def extract_text(file_bytes: bytes, filename: str) -> str:
    """
    Extract readable text from PDF, CSV, or Excel files.
    Returns a plain text string ready to be sent to Gemini.
    """
    name = filename.lower()

    if name.endswith(".pdf"):
        return _extract_pdf(file_bytes)
    elif name.endswith(".csv"):
        return _extract_csv(file_bytes)
    elif name.endswith((".xlsx", ".xls")):
        return _extract_excel(file_bytes)
    else:
        # Try plain text
        try:
            return file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            return ""


def _extract_pdf(file_bytes: bytes) -> str:
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception as e:
        print(f"⚠️  PDF extraction error: {e}")
        return ""


def _extract_csv(file_bytes: bytes) -> str:
    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
        df.dropna(how='all', inplace=True)
        df.dropna(axis=1, how='all', inplace=True)
        # Return both column headers and all rows as readable text
        return f"Columns: {list(df.columns)}\n\n{df.to_string(index=False)}"
    except Exception as e:
        print(f"⚠️  CSV structural formatting error ({e}). Failing-over to raw text extraction.")
        return file_bytes.decode("utf-8", errors="ignore")


def _extract_excel(file_bytes: bytes) -> str:
    try:
        df = pd.read_excel(io.BytesIO(file_bytes))
        df.dropna(how='all', inplace=True)
        df.dropna(axis=1, how='all', inplace=True)
        return f"Columns: {list(df.columns)}\n\n{df.to_string(index=False)}"
    except Exception as e:
        print(f"⚠️  Excel extraction error: {e}")
        return ""