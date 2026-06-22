---
description: Write and run tests for existing code. No modifications to source.
agent: kermintor
---

## Pipeline: Test Only

Route: `context-gather → qa-tester`

You are running the **test only** pipeline. Write and run tests for existing code without modifying any source files.

**Task:** $ARGUMENTS

**Instructions:**
1. Send to **context-gather** to understand the code that needs testing — its behavior, edge cases, dependencies
2. Present your understanding of what should be tested to the user for approval
3. Send to **qa-tester** to write unit tests and run them
4. Relay test results to the user: `## qa-tester — tests complete`
5. If tests fail, report which tests failed and likely causes — but do NOT modify source code

**Do NOT invoke architect, planner, executar, or code-reviewer.** This is a testing-only operation. If tests reveal bugs in the source, the user should run `/fix` to address them.
