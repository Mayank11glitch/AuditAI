import asyncio
from agents import document_agent, rule_agent, validator_agent

async def test():
    print("Testing Agent 1...")
    docs = await document_agent.run("Payment of Rs. 1000 to vendor A")
    print("Agent 1 Result:", docs)
    print("Testing Agent 2...")
    rules = await rule_agent.run("Rule 1: No ITC for food")
    print("Agent 2 Result:", rules)
    print("Testing Agent 3...")
    viols = await validator_agent.run([{"id":1, "amount": 1000, "description":"Food"}], rules)
    print("Agent 3 Result:", viols)

if __name__ == "__main__":
    asyncio.run(test())
