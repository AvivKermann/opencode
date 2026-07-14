# Global Agent Instructions

## Safety Rules — ALL AGENTS
- **Never read, write, or log** files matching: `.env`, `.env.*`, `*.pem`, `*.key`, `id_rsa*`, `credentials.json`, `secrets.*`, `token.*`
- **Never output** API keys, passwords, tokens, or connection strings in responses.
- **Never run** commands against production endpoints unless the user explicitly confirms with the word "production".
- **Never execute** billing-affecting commands (cloud resource creation, subscription changes) without user confirmation.
- **Never push to** `main`, `master`, or `production` branches directly.
- **Never run** project formatting commands (including formatter binaries or `format`/`fmt` script wrappers). Formatting is user-only.

## Code Standards
- Follow existing project conventions over personal preference.
- Prefer readability over cleverness.
- Keep functions under 50 lines where practical.
- All public APIs need doc comments.

## Testing Standards
- Critical path tests are mandatory for every change.
- Tests must be deterministic — no time-dependent or network-dependent assertions without mocks.
- Prefer TDD: write or identify failing tests before implementation, then make the minimal change to pass.
- If a change has no meaningful automated test, explicitly document why and run the closest relevant validation.
- Do not weaken, skip, or delete tests to make implementation pass.
