---
name: implement-feature
description: >-
  Reads a Kompass `.feature` file and implements its pytest-bdd scenario bindings,
  reusable steps, black-box harness code, and targeted tests. Use when asked to
  implement, automate, bind, or complete a Gherkin feature or scenario in this repository.
---

# Implement A Feature

Turn an existing Gherkin feature into an executable Kompass acceptance test. Complete the
work in the repository rather than only proposing code.

## Input

Accept a path under `features/` and, optionally, one scenario name. If no feature path can
be inferred from the request, ask for it before editing. If a scenario is named, implement
only that scenario; otherwise implement every scenario in the file that does not already
have a binding.

Treat the feature text as the behavior contract. Do not silently rewrite it to fit an
implementation. Ask one focused question if the behavior or expected external observation
is materially ambiguous.

## Required Constraints

- Follow `AGENTS.md` and the repository's core black-box rule.
- Exercise deployed Kompass only through Helm, Kubernetes, Bridge/network APIs, metrics,
  documented outputs, or network/process-boundary test doubles.
- Never import production packages from sibling repositories, inspect private storage or
  queues, monkeypatch production code, or assert on implementation-only logs.
- Inspect sibling charts or configuration when needed to identify supported deployment
  seams, but do not copy or vendor production source.
- Use the smallest deployed component slice that proves the scenario.
- Do not add dependencies, CI configuration, or broad scaffolding without explicit approval.
- Do not put secrets in features, fixtures, source, logs, or configuration committed to the
  repository.

## Workflow

### Unify the language

1. Read the complete feature and all if its scenarios.
1. Read existing, already implemented, features and scenarios.
1. If the new feature has a step with the same expected outcome but different wording,
   adjust it accordingly.

### Understand The Contract

1. Read the complete feature, including tags, `Background`, examples, data tables, and doc strings.
1. Read `README.md`, root `conftest.py`, `tests/acceptance/conftest.py`,
   `tests/acceptance/harness/world.py`, and relevant existing bindings, steps, harness
   helpers, and fixtures.
1. Search all files under `tests/acceptance/steps/` for each exact step phrase and
   parameterized equivalents before creating anything.
1. Map every Given, When, and Then to an existing reusable step or one new external
   action/observation.
1. Reject or redesign any proposed seam that depends on private implementation details. If
   no supported external seam can prove the outcome, stop and explain the missing contract
   instead of creating a false test.

### Add Scenario Bindings

Create or update `tests/acceptance/test_<feature_slug>.py`.

- Import `scenario` from `pytest_bdd`.
- Add one `@scenario` binding per selected scenario, preserving the scenario title exactly.
- Use the correct relative feature path from the test module.
- Name the test `test_<scenario_slug>` and annotate it with `-> None`.
- Keep the function body as `pass`; behavior belongs in steps and harness helpers.
- Do not duplicate an existing binding.

Example:

```python
from pytest_bdd import scenario


@scenario("../../features/example.feature", "Kompass exposes the expected behavior")
def test_kompass_exposes_the_expected_behavior() -> None:
    pass
```

### Implement Missing Steps

Put reusable definitions in the most relevant module under `tests/acceptance/steps/`. Create
a focused module only when no current module fits, then register it in root `conftest.py`
via `pytest_plugins`.

- Match literal steps exactly with `given`, `when`, or `then`.
- Use `pytest_bdd.parsers.parse` for variable text and keep captured values as strings until
  domain-aware conversion is needed.
- Reuse existing steps even when they originate in another feature.
- Use `target_fixture` only when a Given must provide setup state to later steps.
- Inject `AcceptanceWorld` for shared scenario state and deployed-system clients.
- Add explicit, typed fields to `AcceptanceWorld` when state must cross step boundaries; do
  not attach ad hoc attributes.
- Keep step functions focused on business actions and assertions. Put reusable command
  execution, protocol handling, payload parsing, and bounded polling in
  `tests/acceptance/harness/`.
- Use `pytest.fail` for missing required configuration with an actionable setting or
  environment-variable name.
- Assert eventual behavior with bounded polling based on
  `acceptance_world.config.timeout_seconds`, not fixed sleeps or broad retries that hide
  environment failures.
- Capture actionable diagnostics at the failing boundary while avoiding secrets and
  implementation-only log assertions.

### Add Minimal Fixtures And Cleanup

- Put static Kubernetes manifests in `tests/fixtures/k8s/`.
- Put Helm values in `tests/fixtures/helm/`.
- Put deterministic pricing input in `tests/fixtures/pricing/`.
- Generate dynamic overlays under `acceptance_world.config.work_dir`.
- Extend `AcceptanceWorld.cleanup` for resources created by the scenario. Preserve existing
  failure-preservation behavior.
- Build fake external systems only at network or process boundaries.

### Verify Incrementally

Run the smallest relevant checks yourself:

1. Collect the new module to catch feature paths, scenario names, plugin registration, and
   undefined bindings early:

   ```sh
   uv run pytest tests/acceptance/test_<feature_slug>.py --collect-only -q
   ```

2. Run Ruff against only modified Python files:

   ```sh
   uv run ruff check <modified-python-files>
   uv run ruff format --check <modified-python-files>
   ```

3. Run each implemented scenario by exact node ID with `-vv` and the required non-secret
   local configuration.

Do not weaken assertions, add unconditional skips, or fake external responses merely to
make verification pass. If cluster tools, chart references, images, or credentials are
unavailable, still complete collection and static checks, then report the exact blocked
command and prerequisite.

## Completion Checklist

- Every selected scenario has exactly one thin binding.
- Every selected Gherkin step resolves to one reusable definition.
- Assertions prove customer- or operator-visible behavior through an allowed seam.
- Scenario state, fixture placement, cleanup, polling, and diagnostics follow repository
  conventions.
- No production code is imported or vendored.
- Targeted collection, lint, format, and executable scenario results are reported precisely.

In the final handoff, list changed files, the external contract being verified, commands
that passed, and any environment-blocked command. Do not claim the scenario passed unless
the deployed scenario command completed successfully.

