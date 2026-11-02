# Gherkin Syntax for pytest-bdd

This reference targets **pytest-bdd 8.1.0**. Check the target project's installed or pinned version
before using it. Version 8.0 added Rule, keyword aliases, localization, multiple Examples tables,
and example-table tag filtering. Version 8.1 fixed outline substitution in docstrings and tables.
For older versions, verify the needed constructs in that version's documentation.

These are syntax examples, not requirements to adopt. Parsing a feature does not prove its behavior:
pytest-bdd also needs Python scenario bindings and matching step definitions to execute it.

## Structure and keywords

- Use one `Feature:` per `.feature` file. Comments, language directives, and tags may precede it.
- `Rule:` groups scenarios under a business rule.
- `Scenario:` defines a concrete example; `Example:` is an alias.
- `Scenario Outline:` defines a parameterized example; `Scenario Template:` is an alias.
- `Examples:` supplies outline rows; `Scenarios:` is an alias.
- Descriptions below structural headings are explanatory text, not executable steps.
- Keep scenario names unique within a feature, including across Rules. pytest-bdd stores scenarios
  by name, so repeated names can overwrite earlier scenarios.

Use colons after structural keywords, not after `Given`, `When`, `Then`, `And`, or `But`.
Indent consistently to show structure; indentation alone does not end a Rule. Put feature-level
scenarios before Rules rather than trying to return to feature scope by dedenting.

```gherkin
@inventory
Feature: Stock reservations
  Accepted reservations reduce available stock.

  Background:
    Given a warehouse accepting reservations

  @availability
  Rule: Reservations consume available stock
    Background:
      Given a product with 5 units available

    Scenario: Reserve part of the stock
      When a customer reserves 2 units
      Then 3 units remain available
```

## Background and steps

A feature Background applies to its scenarios, including those inside Rules. A Rule Background
applies only to that Rule. Feature background steps run before rule background steps, followed by
the scenario steps, for each execution. Put at most one Background in each scope, before scenarios.
Use `Given` and its continuations for background setup, as pytest-bdd's documentation recommends.

| Keyword | Meaning |
| --- | --- |
| `Given` | Initial state or context |
| `When` | Action or event |
| `Then` | Expected observable outcome |
| `And`, `But` | Continue the preceding step type |
| `*` | Continue the preceding step type, like `And` or `But` |

Start each scenario and each Background with an explicit `Given`, `When`, or `Then` keyword.
pytest-bdd rejects `And`, `But`, or `*` as the first step, even when a Background provides context.
Keep each step's text on one line; use a docstring for multiline content.

## Scenario outlines

Use `<column_name>` placeholders with matching Examples headers. Each data row produces a separate
execution. Multiple Examples blocks are supported; their rows are separate cases, not a Cartesian
product. Empty cells supply empty strings, not Python `None`.

```gherkin
Feature: Stock arithmetic
  Scenario Outline: Remaining stock after a reservation
    Given a product with <available> units available
    When a customer reserves <reserved> units
    Then <remaining> units remain available

    @partial
    Examples: Some stock remains
      | available | reserved | remaining |
      | 5         | 2        | 3         |

    @exhausted
    Examples: All stock reserved
      | available | reserved | remaining |
      | 5         | 5        | 0         |
```

In 8.1, placeholders also render inside attached docstrings and data-table cells. Use outlines
for substitution, not ordinary Scenarios. Do not use feature-level or vertical Examples tables;
pytest-bdd removed those extensions. Examples values are text; numeric conversion belongs in the
step definitions. Python parser patterns such as `{count:d}` do not belong in feature files.

## Data tables and docstrings

Attach a table or docstring immediately below its step. A step table passes data to one step;
unlike Examples, it does not create additional scenario executions.

```gherkin
Feature: Product catalog
  Scenario: Import a product description
    Given the following products exist:
      | sku | name   |
      | W1  | Widget |
    When the description for product "W1" is replaced with:
      """
      A compact widget.
      Suitable for indoor use.
      """
    Then product "W1" has the description:
      """
      A compact widget.
      Suitable for indoor use.
      """
```

- Table escapes are `\n` for newline, `\|` for a literal pipe, and `\\` for a backslash.
- Step definitions receive `datatable` as a list of lists of strings, including any header row.
  Headers do not automatically turn rows into dictionaries or convert their values.
- Triple-quoted docstrings supply multiline text through the `docstring` argument. The delimiter's
  indentation is removed from the content; additional relative indentation can remain.
- A content label such as `"""json` is accepted, but does not deserialize the content. pytest-bdd
  passes the text, not an automatically parsed JSON object or a separate content-type argument.
- Step matching uses the step's text, not the attached table or docstring. Request `datatable` or
  `docstring` only on steps with that attachment. These names are reserved for those arguments;
  do not reuse them as captured step-parser parameter names.

## Tags and selection

Place tags above Feature, Rule, Scenario, Scenario Outline, or Examples, not Background or steps.
Scenarios inherit Feature and Rule tags; outline cases also receive their Examples block's tags.
Tags can share a line or occupy separate lines. A tag cannot contain spaces.

pytest-bdd maps tags to pytest markers, stripping `@`. Prefer Python identifier-style names such
as `@stock_reservation`, rather than hyphenated tags. Select markers with pytest's `-m` expression
syntax, without `@`; do not copy Cucumber's `--tags` commands. Register custom markers in the
project's pytest configuration, especially when strict markers are enabled.

Tags such as `@manual` and `@wip` are labels, not automatic execution policies. Any custom behavior
depends on the project's marker handling or `pytest_bdd_apply_tag` hook.

## Comments and languages

Use `#` on a separate line for comments; inline `#` in step text and scenario names is retained.
There are no block comments. A `#` inside a docstring is content.

English is the default. A first-line directive such as `# language: fr` selects another Gherkin
dialect in pytest-bdd 8.0 and later. Use that dialect's keywords consistently. Python step
definitions still use pytest-bdd's `given`, `when`, and `then` decorators.

## Sources and compatibility checks

Use pytest-bdd documentation and versioned implementation as the compatibility authority; a
general Cucumber reference does not establish support in a particular pytest-bdd release.

- [pytest-bdd documentation](https://pytest-bdd.readthedocs.io/en/stable/)
- [8.1 release notes](https://github.com/pytest-dev/pytest-bdd/blob/8.1.0/CHANGES.rst)
- [8.1 parser](https://github.com/pytest-dev/pytest-bdd/blob/8.1.0/src/pytest_bdd/parser.py)
- [Gherkin language reference](https://cucumber.io/docs/gherkin/reference/)

For a target project, verify feature parsing and scenario collection using its installed version.
Execute bound scenarios when step definitions are available; collection alone does not verify
step matching, attachment handling, or the promised behavior.
