---
description: Plan only — think it through, produce HLD and implementation spec, but write no code.
agent: kermintor
---

## Pipeline: Plan Only

Route: `context-gather → architect → planner → STOP`

You are running the **plan only** pipeline. Think through the problem, design the solution, and produce a concrete implementation spec. **Do NOT write any code.**

**Task:** $ARGUMENTS

**Instructions:**
1. Send to **context-gather** to map out the relevant codebase
2. Present your understanding and task breakdown to the user for approval
3. Send to **architect** for high-level design
4. Relay architect's HLD to the user: `## architect — awaiting approval`
5. Once approved, send HLD + context to **planner** for concrete implementation spec
6. Relay planner's spec to the user: `## planner — awaiting approval`
7. Present a complete summary of the plan: the HLD, the implementation spec, and any open questions

**Do NOT invoke executar, code-reviewer, or qa-tester.** This is a thinking exercise only. The user may later run `/feature` or `/refactor` to execute the plan.
