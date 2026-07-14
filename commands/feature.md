---
description: Full pipeline — new feature, new system, multi-file architectural change.
agent: kermintor
---

## Pipeline: Full Feature

Route: `context-gather → architect → planner + qa-tester(red) → executar → qa-tester(green) → code-reviewer`

You are running the **full feature** pipeline. This is for new features, new systems, or changes that require architectural decisions.

**Task:** $ARGUMENTS

**Instructions:**
1. Send to **context-gather** to map out the relevant codebase
2. Present your understanding and task breakdown to the user for approval
3. Send to **architect** for high-level design
4. Relay architect's HLD to the user: `## architect — awaiting approval`
5. Once approved, send approved HLD + context to **planner** for concrete implementation spec
6. In parallel, send approved expected behavior/context to **qa-tester** to write failing tests
7. Relay planner's spec and qa-tester's red-test approach/results to the user: `## planner + qa-tester(red) — awaiting approval`
8. Once approved, send planner spec plus red test locations/results to **executar** for implementation
9. **Scope verification**: send to **context-gather** to run `git diff --name-only` and compare against planner's allowed files. If executar touched anything outside scope → stop and flag to user.
10. Send to **qa-tester** for green validation after implementation
11. Before sending to code-reviewer, ask **context-gather** to run `git diff` and include the output in the code-reviewer briefing.
12. Send to **code-reviewer** with the structured briefing (task summary, spec, diff, tests, red/green results, review focus)
13. If reviewer requests changes → **planner** mediates → executar fixes → qa-tester green validation → reviewer again
14. If reviewer requests changes a SECOND time → present the situation to the user
15. Once reviewer passes → present to user for final approval
16. If user rejects → re-engage **planner** (implementation drifted from plan)
17. Present final diff-style summary
