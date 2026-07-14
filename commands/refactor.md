---
description: Refactor — restructure existing code, no new architecture needed. Uses planner.
agent: kermintor
---

## Pipeline: Refactor

Route: `context-gather → planner + qa-tester(red) → executar → qa-tester(green) → code-reviewer`

You are running the **refactor** pipeline. This is for restructuring existing code where the architecture stays the same but the implementation changes.

**Task:** $ARGUMENTS

**Instructions:**
1. Send to **context-gather** to understand the current structure and dependencies
2. Present your understanding and refactoring approach to the user for approval
3. Once approved, send to **planner** for a concrete implementation spec and to **qa-tester** to write characterization/regression tests from the approved behavior/context
4. Relay planner's spec and qa-tester's red-test approach/results to the user: `## planner + qa-tester(red) — awaiting approval`
5. Once approved, send planner spec plus red test locations/results to **executar** for implementation
6. **Scope verification**: send to **context-gather** to run `git diff --name-only` and compare against planner's allowed files. If executar touched anything outside scope → stop and flag to user.
7. Send to **qa-tester** for green validation after implementation
8. Before sending to code-reviewer, ask **context-gather** to run `git diff` and include the output in the code-reviewer briefing.
9. Send to **code-reviewer** with the structured briefing — reviewer should pay special attention to behavior preservation, tests, and TDD compliance
10. If reviewer requests changes → **planner** mediates → executar fixes → qa-tester green validation → reviewer again
11. If reviewer requests changes a SECOND time → present the situation to the user
12. Once reviewer passes → present to user for approval
13. If user rejects → re-engage **planner**
14. Present final diff-style summary

**Do NOT invoke architect.** The architecture isn't changing — only the implementation structure.
