# Contributing to StudentCenter

Thank you for your interest in contributing to StudentCenter!

## Getting Started

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Follow the code style and project conventions.
4. Write or update tests for your changes.
5. Ensure all tests pass before submitting.

## Development Setup

See [README.md](./README.md) for local development instructions.

## Pull Request Guidelines

- Keep PRs focused on a single concern.
- Reference the related issue in your PR description.
- All CI checks must pass (build, lint, tests, Playwright).
- Maintain backward compatibility — no breaking API changes without discussion.

## Code Standards

| Layer | Standard |
|---|---|
| Backend (C#) | Clean Architecture, no logic in controllers |
| Frontend (JS/JSX) | ESLint rules enforced via `npm run lint` |
| Tests | xUnit for backend; Playwright for E2E |
| Commits | Conventional Commits (`feat:`, `fix:`, `chore:`) |

## Reporting Bugs

Open a GitHub Issue with:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, .NET version, Node version)

## Security Vulnerabilities

Do **not** open a public issue. See [SECURITY.md](./SECURITY.md) for responsible disclosure.
