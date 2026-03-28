import sys
import os
import asyncio

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents import document_agent

async def main():
    print("Testing document_agent deterministic extraction...")
    res = await document_agent.run("Date: 2026-03-24, Amount: 15400, Type: DEBIT, Description: Office Supplies, Party: OfficeMax, Category: Other")
    import json
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
