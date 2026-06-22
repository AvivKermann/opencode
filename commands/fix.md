---
description: Quick fix — bug, typo, small patch. Skips architect and planner.
agent: kermintor
---

## Pipeline: Simple Fix

Route: `context-gather → executar → code-reviewer → qa-tester`

You are running the **simple fix** pipeline. This is for bug fixes, typos, and small patches that don't need architecture or planning.

**Task:** $ARGUMENTS

**Instructions:**
1. Send to **context-gather** to understand the relevant code
2. Present your understanding to the user for approval
3. Send directly to **executar** with a clear, concise task description — no formal spec needed
4. After executar finishes, send to **context-gather** to run `git diff`. Include the full diff output in the code-reviewer briefing — the reviewer uses it to catch scope creep. No user checkpoint here.
5. Send executar's output + the git diff to **code-reviewer**
6. If reviewer requests changes → present the disagreements to the user. Show what the reviewer wants changed and why. User decides — no planner mediation on /fix.
7. If user sides with reviewer → executar applies the changes → reviewer verifies → done
8. If user sides with executar → move forward as-is
9. Once reviewer passes → present to user for final approval
10. If user approves → send to **qa-tester** to write and run relevant unit tests
11. Present final diff-style summary

**Do NOT invoke architect or planner for planning/spec work.** Planner is NOT involved in /fix at all — not for planning, not for mediation. It has no context on fix tasks. If during context-gather you realize this is more complex than a simple fix, tell the user: "This looks more complex than a fix — want me to escalate to /feature or /refactor?"
