---
name: Create BDD Scenarios
description: >-
  Turn requirements, user stories, and acceptance criteria into focused BDD/Gherkin scenarios.
  Use when creating behavioral examples from requirements; not for reviewing an existing scenario
  suite or implementing step definitions.
---

# Create BDD Scenarios

Translate requirements into a small, readable set of examples that explain important rules and make
correctness objectively decidable. Scenarios specify promised behavior; they do not establish
stakeholder agreement or prove that automation works.

## Establish the behavioral contract

Read the supplied requirements and relevant existing domain definitions and neighboring features.
Follow local language and organization when available. Identify the intended audience, actors,
rules, observable outcomes, and consequential failures. Technical contracts, security guarantees,
and operational behavior are valid subjects when they matter to that audience.

Separate established requirements from illustrative data and unresolved decisions:

- Use concrete example values freely when they merely illustrate an established rule.
- Do not invent thresholds, defaults, permissions, ordering, failure behavior, or other acceptance
  criteria. Existing implementation can inform questions but is not automatically the authority for
  intended behavior.
- When sources conflict or an outcome is unspecified, ask the focused question needed to resolve it.
  Continue with independent, supported rules where possible.
- Keep proposals and unresolved cases outside ready-to-adopt Gherkin. If the user requests a
  provisional draft, label its assumptions explicitly rather than presenting them as agreed
  requirements.

## Select key examples

Map each known rule to representative examples before writing steps. Consider boundaries,
exceptions, important interactions, and known regression risks only where the requirements or domain
evidence support them.

For every proposed example, identify what understanding or protection would be lost without it.
Different input values alone do not justify separate scenarios. Include meaningful equivalence
classes and boundary cases rather than exhaustive permutations; do not mechanically add a happy
path, failure, and edge case for every sentence.

Prefer examples focused on one rule. Keep journey scenarios when the interaction between rules is
itself important. Do not impose a fixed step count or one-assertion rule.

## Formulate observable behavior

Read [Gherkin syntax](references/gherkin-syntax.md) before drafting.

Check the project's pytest-bdd version against the reference's 8.1 baseline; do not assume older
versions support every construct or change dependencies to make a draft compatible.

Use scenario names that state the behavior or rule being illustrated. Write:

- **Given:** only the concrete state and domain context needed to distinguish the behavior.
- **When:** the relevant action or event.
- **Then:** observable outcomes that independently distinguish correct behavior from a plausible
  mistake.

Use the audience's domain language and intent. Avoid incidental navigation, storage details, and
implementation mechanics unless they are part of the contract. Gherkin does not imply UI or
end-to-end automation.

Make the expected result precise enough that independent implementers would reach the same pass/fail
decision:

- Quantities need units and relevant boundary, precision, or tolerance rules.
- Collections need the intended membership, count, order, or uniqueness semantics. Checking that all
  returned items qualify can pass for an empty result; establish required presence when the contract
  guarantees it.
- Failures need the observable rejection and any required unchanged state or side-effect guarantees.
- Asynchronous behavior needs observable completion and a bounded window when timing is part of the
  requirement.
- Performance needs the metric, threshold, and conditions that give the measurement meaning.

Use exact states, events, and relationships when numbers add no value. Resolve words such as
“successful,” “fast,” and “eventually” through established definitions or a clarification question,
not an invented number. Specify expected outcomes independently rather than instructing the reader
to repeat the production calculation.

Use Feature and Rule to organize related behavior when helpful. Use Background only for genuinely
shared, essential context that remains easy to understand. Use a Scenario Outline when rows
illustrate the same rule and step structure; each row should add meaningful coverage. Do not hide
unrelated behaviors in a large table.

## Check the draft's value

Before handing off, inspect each scenario and outline row:

1. Which established rule or risk does it illustrate?
2. What distinct contribution does it make compared with the other examples?
3. Can correctness be decided without inventing missing requirements?
4. What plausible incorrect behavior would its expectation reject?
5. Would an implementation-only change require rewriting it despite unchanged promised behavior?

Reformulate weak examples whose underlying behavior matters. Merge redundant examples without losing
distinct rules or risks. Check the set against the known requirements, distinguishing uncovered
rules from questions about unspecified behavior. Do not claim complete coverage beyond the sources
and scope inspected.

## Deliver

Provide the Gherkin in the requested format or authorized feature files. Include a concise
rule-to-scenario mapping when it helps expose coverage, plus any unresolved questions that block
additional examples. Keep unsupported proposals separate from established scenarios.

Creating scenarios does not authorize implementation, step definitions, or changes to existing
acceptance criteria. Report the result as a specification draft unless stronger agreement or
execution evidence is actually available.
