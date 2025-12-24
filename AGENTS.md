# AGENTS.md

Guidelines for LLM coding assistants working in this repository.

## Commit Practices

- **Use conventional commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- **Commit at logical stopping points** - each commit should represent a coherent, working state
- **Split large changes** into multiple commits - one concept per commit
- **Write meaningful commit messages** - explain *why*, not just *what*

## Code Quality

- **Run the formatter** (Prettier) before committing
- **Run the linter** (ESLint) and fix all warnings
- **Write unit tests** for complex logic
- **Write e2e tests** when feasible for user-facing flows
- **Keep functions small** - if it needs a comment to explain what it does, consider splitting it

## Before Submitting Changes

1. Run `npm run lint` - fix any issues
2. Run `npm run format` - ensure consistent formatting
3. Run `npm test` - all tests must pass
4. Review your own diff - would you approve this PR?

## Code Style

- Prefer explicit over implicit
- Prefer composition over inheritance
- Avoid premature abstraction - wait until you have 3 concrete cases
- Delete dead code rather than commenting it out
