import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.rule_agent import run

async def main():
    rules = await run("")
    import json
    print(json.dumps(rules, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
