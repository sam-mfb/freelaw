# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## General Interactions

- Don't compliment the user. Just be analytical, factual and responsive.
- When discussing concepts or planning with the user, just discuss; don't try to edit files or implement changes until told explicitly to do that
- If the user asks a question, answer the question with trying to implement any code changes.

## Typescript

- Read the tsconfig.json file at the root of the project at the start of every session
- Never use `any`
- Use typeguards instead of type assertions on raw data (e.g., jsons, api returns, etc.)
- Explicitly type the returns of functions, unless the type is unusually complex
- Always assume array elements can be undefined if not checked (noUncheckedArrayAccess)
- Always use `import type` for importing types (enforced by ESLint)
- Never use classes or inheritance; instead use factory functions and composition
- Avoid excessive nesting
- Avoid defining functions inside other functions' scopes
- Always used named exports and imports; never write default exports
- Provide precise typings for async operations with proper error handling
- Always typecheck a file when you have completed edits, before moving on to next set of edits in a different file
- Never use classes. Use builder functions and factory patterns.

## Testing

- Tests in `__tests__` directory next to module being tested
- Test modules named with .test.ts(x)
- Don't use "should" in test names
- Only have a top level describe block if there is going to be more than one top level describe block
- Unit tests should rarely use mocks; needing mocks is a sign of bad code architecture
- Tests should be as strictly typed as production code; no shortcuts
- Typecheck tests before running

## Essential Commands

```bash
# Development (use sample data for faster startup)
npm run dev:sample       # Start with 10 sample cases
npm run dev              # Start with full dataset (34K+ cases)

# Code Quality (run these before committing)
npm run lint             # ESLint checks
npm run typecheck        # TypeScript type checking
npm run format           # Prettier formatting

# Testing
npm run test             # Run all tests
npm run test:ui          # Run tests with UI

# Build
npm run build            # Production build
npm run build:index:sample # Build search indices from sample data
```

## GitHub PR Review Comments

When asked to review Copilot or other comments on a PR, use these methods:

```bash
# 1. Get all comments (high-level review comments)
gh pr view <PR_NUMBER> --comments

# 2. Get review details in JSON format
gh pr view <PR_NUMBER> --json reviews

# 3. Get inline code review comments via API
gh api repos/<OWNER>/<REPO>/pulls/<PR_NUMBER>/comments

# Example for this repo:
gh pr view 11 --comments
gh pr view 11 --json reviews
gh api repos/sam-mfb/freelaw/pulls/11/comments
```

### Understanding GitHub PR Comments Structure:
- **Review Comments**: High-level comments on the entire PR (shown with `--comments`)
- **Inline Comments**: Specific code line comments (retrieved via API)
- **Review Summaries**: Overall review with all comments (shown in `--json reviews`)

### Copilot Comments:
- Author will be "copilot-pull-request-reviewer" 
- May include confidence levels (e.g., "Comments suppressed due to low confidence")
- Often provides suggestions as code blocks
- Comments may be updated across multiple reviews as code changes

