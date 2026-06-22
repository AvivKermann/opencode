---
description: Refactor — restructure existing code, no new architecture needed. Uses planner.
agent: kermintor
---

## Pipeline: Refactor

Route: `context-gather → planner → executar → code-reviewer → qa-tester`

You are running the **refactor** pipeline. This is for restructuring existing code where the architecture stays the same but the implementation changes.

**Task:** $ARGUMENTS

**Instructions:**
1. Send to **context-gather** to understand the current structure and dependencies
2. Present your understanding and refactoring approach to the user for approval
3. Send to **planner** for a concrete implementation spec of the refactoring steps
4. Relay planner's spec to the user: `## planner — awaiting approval`
5. Once approved, send spec to **executar** for implementation
6. **Scope verification**: send to **context-gather** to run `git diff --name-only` and compare against planner's allowed files. If executar touched anything outside scope → stop and flag to user.
7. Before sending to code-reviewer, ask **context-gather** to run `git diff` and include the output in the code-reviewer briefing.
8. Send to **code-reviewer** with the structured briefing — reviewer should pay special attention to whether behavior is preserved
9. If reviewer requests changes → **planner** mediates → executar fixes → reviewer again
10. If reviewer requests changes a SECOND time → present the situation to the user
11. Once reviewer passes → present to user for approval
12. If user rejects → re-engage **planner**
13. If user approves → send to **qa-tester** to write and run unit tests verifying behavior is preserved
14. Present final diff-style summary

**Do NOT invoke architect.** The architecture isn't changing — only the implementation structure.
