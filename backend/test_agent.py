import asyncio
import os
import sys
import warnings

warnings.filterwarnings("ignore")

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents import document_agent

async def main():
    text = "Purchase from ACME corp on 2026-03-27 for 5000 INR. Type DEBIT. Category GST."
    print("Running document agent...")
    try:
        res = await document_agent.run(text)
        print("Result:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
