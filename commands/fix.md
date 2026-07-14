---
description: Quick fix — bug, typo, small patch with lightweight TDD. Skips architect and planner.
agent: kermintor
---

## Pipeline: Simple Fix

Route: `context-gather → qa-tester(red) → executar → qa-tester(green) → code-reviewer`

You are running the **simple fix** pipeline. This is for bug fixes, typos, and small patches that don't need architecture or planning.

**Task:** $ARGUMENTS

**Instructions:**
1. Send to **context-gather** to understand the relevant code
2. Present your understanding to the user for approval
3. For behavior bugs, send to **qa-tester** to write one focused failing regression test first
4. For typo/docs/config-only fixes where automated tests are not meaningful, qa-tester documents “no meaningful automated test” and runs relevant existing validation if available
5. Present the red-test approach/result to the user for approval before implementation
6. Send directly to **executar** with a clear, concise task description plus red test locations/results — no formal spec needed
7. After executar finishes, send to **qa-tester** for green validation
8. After green validation, send to **context-gather** to run `git diff`. Include the full diff output in the code-reviewer briefing — the reviewer uses it to catch scope creep. No user checkpoint here.
9. Send executar's output + tests/results + the git diff to **code-reviewer**
10. If reviewer requests changes → present the disagreements to the user. Show what the reviewer wants changed and why. User decides — no planner mediation on /fix.
11. If user sides with reviewer → executar applies the changes → qa-tester green validation → reviewer verifies → done
12. If user sides with executar → move forward as-is
13. Once reviewer passes → present to user for final approval
14. Present final diff-style summary

**Do NOT invoke architect or planner for planning/spec work.** Planner is NOT involved in /fix at all — not for planning, not for mediation. It has no context on fix tasks. If during context-gather you realize this is more complex than a simple fix, tell the user: "This looks more complex than a fix — want me to escalate to /feature or /refactor?"
