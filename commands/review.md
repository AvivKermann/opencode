---
description: Standalone code review — review recent changes or staged diff before committing.
agent: kermintor
---

## Pipeline: Standalone Review

Route: `context-gather → code-reviewer`

You are running a **standalone code review**. Review recent changes without executing any code.

**Task:** $ARGUMENTS

**Instructions:**
1. Send to **context-gather** to gather the recent changes. Context-gather should run `git diff` and `git diff --staged` to capture all changes.
2. Using the diff output from context-gather, pass this structured briefing to **code-reviewer**:
   ```
   ## Task Summary
   [user's review request, or "Review recent changes" if no specific request]
   
   ## Implementation Spec
   N/A — standalone review, no spec to compare against
   
   ## Changes (git diff output)
   [the actual git diff output from context-gather]
   
   ## Review Focus
   - Code quality, correctness, performance
   - Security concerns
   - Any obvious risks or issues
   ```
3. Relay the review to the user: `## code-reviewer — review complete`
4. If the reviewer found issues, summarize the key findings and suggested fixes. Suggest the user run `/fix` with the specific issues if they want them addressed.

**Do NOT invoke architect, planner, executar, or qa-tester.** This is a review-only operation.
