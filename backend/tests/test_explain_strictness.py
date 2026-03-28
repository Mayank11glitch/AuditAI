import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.explain_agent import run as explain

mock_context = ""

print("--- Test 1 (General GST Question - NO Context) ---")
print(explain("What is the penalty for late filing of GSTR-1?", mock_context))

print("\n--- Test 2 (Unrelated Question - NO Context) ---")
print(explain("How do I write a fast inverse square root in C++?", mock_context))
