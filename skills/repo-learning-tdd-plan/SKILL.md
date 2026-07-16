---
name: repo-learning-tdd-plan
description: Use when the user wants to learn a new repo through context gathering, component walkthroughs, test-first planning, pseudocode/spec-driven implementation, or asks for a step-by-step TDD implementation workflow.
---

# Repo Learning TDD Plan

## What this skill does

This skill helps a user learn a repository by turning a requested change into a teaching-oriented, test-first implementation plan. Prioritize understanding over speed, and produce plans the user can implement themselves.

## When to use

Use this skill when the user asks to:

- learn a new or unfamiliar repo
- get step-by-step implementation guidance
- write or plan tests before implementation
- receive pseudocode, implementation specs, or a TDD workflow
- understand repo components involved in a specific change

## Workflow

1. [pending] Discover the repo context relevant to the requested change.
2. [pending] Teach the important components involved in the requested change.
3. [pending] Produce a learning-oriented design before implementation.
4. [pending] Create a step-by-step implementation plan.
5. [pending] Define the test plan first, including expected red-test failures.
6. [pending] Provide pseudocode or implementation guidance for the user to follow.
7. [pending] Define green validation commands or checks.
8. [pending] Review the result and summarize learning notes.

## Component walkthrough guidance

- Identify files, modules, functions, data flow, tests, and entry points related to the requested change.
- Explain each component's responsibility in beginner-friendly language.
- Explain how the components interact.
- Call out patterns the user should imitate.
- Call out files or abstractions the user should avoid changing.
- Keep explanations tied to the specific requested change, not a generic repo tour.

## Output contract

Return responses using these sections, in this order:

1. Repo Context — discovered files, patterns, and constraints.
2. Component Walkthrough — teaching explanation of important components for the requested change.
3. Learning-Oriented Design — proposed design with tradeoffs explained.
4. Step-by-Step Implementation Plan — atomic steps using `[pending]`, `[in-progress]`, `[done]` if useful.
5. Test Plan First — tests to create or update before implementation and expected red failures.
6. Pseudocode / Implementation Guide — code-level guidance without fully doing the implementation unless asked.
7. Validation — commands or checks to confirm green state.
8. Review Notes — what the user learned, risks, and follow-up questions.

## Guardrails

- Be global and repo-agnostic.
- Do not assume a specific language, framework, agent name, or test runner.
- Prefer existing repo patterns over invented architecture.
- Do not skip tests unless no meaningful automated test exists; explain why.
- Do not modify files directly unless the user explicitly asks for implementation.
- Keep the plan educational and implementation-ready.
- Highlight safety constraints from applicable repo/global instructions.
