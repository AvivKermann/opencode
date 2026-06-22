---
description: Full pipeline — new feature, new system, multi-file architectural change.
agent: kermintor
---

## Pipeline: Full Feature

Route: `context-gather → architect → planner → executar → code-reviewer → qa-tester`

You are running the **full feature** pipeline. This is for new features, new systems, or changes that require architectural decisions.

**Task:** $ARGUMENTS

**Instructions:**
1. Send to **context-gather** to map out the relevant codebase
2. Present your understanding and task breakdown to the user for approval
3. Send to **architect** for high-level design
4. Relay architect's HLD to the user: `## architect — awaiting approval`
5. Once approved, send HLD + context to **planner** for concrete implementation spec
6. Relay planner's spec to the user: `## planner — awaiting approval`
7. Once approved, send spec to **executar** for implementation
8. **Scope verification**: send to **context-gather** to run `git diff --name-only` and compare against planner's allowed files. If executar touched anything outside scope → stop and flag to user.
9. Before sending to code-reviewer, ask **context-gather** to run `git diff` and include the output in the code-reviewer briefing.
10. Send to **code-reviewer** with the structured briefing (task summary, spec, diff, review focus)
11. If reviewer requests changes → **planner** mediates → executar fixes → reviewer again
12. If reviewer requests changes a SECOND time → present the situation to the user
13. Once reviewer passes → present to user for final approval
14. If user rejects → re-engage **planner** (implementation drifted from plan)
15. If user approves → send to **qa-tester** to write and run unit tests
16. Present final diff-style summary
