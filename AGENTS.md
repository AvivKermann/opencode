# Working Together

These guidelines define how we collaborate. They are required baseline behavior.

## Quick Obligations

| Situation | Required action |
| --- | --- |
| Reviewing git status or diffs | Treat them as read-only; never revert or assume missing changes were yours. |
| Adding a dependency | Research well-maintained options and confirm fit with the user before adding. |

## Mindset & Process

- Do not leave breadcrumbs when moving or deleting code. Remove obsolete comments such as "// moved to X" or "relocated".

When taking on new work, follow this sequence:
1. Think about the architecture.
2. Research official docs, blogs, or papers on the best architecture.
3. Review the existing codebase.
4. Compare the research with the codebase to choose the best fit.
5. Implement the fix or ask about the tradeoffs the user is willing to make.

- Clean up confusing names, dead code, and obsolete helpers only when they are directly involved in the requested change; update their callers.
- If you are stuck, check official docs or specs before changing direction.
- Use subagents for parallel or independent work whenever possible.
- If there is even a 1% chance a skill applies, you must invoke it.

When code is confusing:
1. Simplify it if you can.
2. Add an ASCII art diagram in a comment if that helps explain the structure.

## Context7
Invoke the `find-docs` skill whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service. Do not invoke it for refactoring, scripts written from scratch, business-logic debugging, code review, or general programming concepts.

## Testing Philosophy

Run the smallest relevant test set that covers the changed behavior. Expand validation when the risk or affected scope warrants it.

Never ask me to run the tests to confirm, run them yourself to confirm.

## Token Efficiency

- Never re-read files you just wrote or edited. You know the contents.
- Never re-run commands to "verify" unless the outcome was uncertain.
- Don't echo back large blocks of code or file contents unless asked.
- Batch related edits into single operations. Don't make 5 edits when 1 handles it.
- Skip confirmations like "I'll continue..." Just do it.
- If a task needs 1 tool call, don't use 3. Plan before acting.

## Final Handoff

Before you consider a task done:

1. Confirm all tests or commands you touched actually passed (list them if the user asks).
2. Summarize what changed, with specific file and line references.
3. Call out any TODOs, follow-up work, or uncertainties so I'm never surprised later.

<!-- context7 -->
Use the `ctx7` CLI to fetch current documentation whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service — even well-known ones like React, Next.js, Prisma, Express, Tailwind, Django, or Spring Boot. This includes API syntax, configuration, version migration, porting code between libraries, platforms, or SQL dialects, library-specific debugging, setup instructions, and CLI tool usage. Use even when you think you know the answer — your training data may not reflect recent changes. Prefer this over web search for library docs.

Do not use for: refactoring, debugging, or reviewing code that does not depend on a library or platform API, or general programming concepts.

## Steps

1. Resolve library: `npx ctx7@latest library <name> "<what to look up>"` — use the official library name with proper punctuation (e.g., "Next.js" not "nextjs", "Customer.io" not "customerio", "Three.js" not "threejs")
2. Pick the best match (ID format: `/org/project`) by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better). If results don't look right, try alternate names or queries (e.g., "next.js" not "nextjs", or rephrase the question)
3. Fetch docs: `npx ctx7@latest docs <libraryId> "<what to look up>"` — run a separate `docs` command per distinct concept if the question spans multiple topics, unless it's about how they interact
4. Answer using the fetched documentation

You MUST call `library` first to get a valid ID unless the user provides one directly in `/org/project` format. Be specific about what to look up in the library's documentation — specific and detailed queries return better results than vague single words, but keep each query to a single concept unless the question is about how concepts interact; combined multi-topic queries dilute ranking and return shallow results for each topic. Do not run more than 3 commands per question. Do not include sensitive information (API keys, passwords, credentials) in queries.

For version-specific docs, use `/org/project/version` from the `library` output (e.g., `/vercel/next.js/v16.2.9`).

If a command fails with a quota error, inform the user and suggest `npx ctx7@latest login` or setting `CONTEXT7_API_KEY` env var for higher limits. Do not silently fall back to training data.
<!-- context7 -->
