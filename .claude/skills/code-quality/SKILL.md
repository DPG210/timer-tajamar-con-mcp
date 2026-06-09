---
name: code-quality
description: Professional code review and quality assurance knowledge. Use this skill whenever the user asks for help reviewing code, establishing code review standards, writing review comments, evaluating pull requests, enforcing coding standards, or improving code maintainability. Trigger on any mention of code review, pull request review, PR review, code quality, code smells, refactoring, tech debt, coding standards, linting, static analysis, complexity metrics, naming conventions, or SOLID principles. Also use when the user shares code and asks for feedback, or when reviewing code produced by other agents in the orchestrator system.
---

# Code Quality Review

A reference skill for conducting code reviews that improve code quality without demoralizing the author — following the principles of effective technical feedback, clean code, and sustainable software engineering.

This skill exists to keep two failure modes out of the output:

1. **Rubber-stamp reviews** — "LGTM" without reading the code, approving without checking edge cases, ignoring test coverage, missing security implications, not questioning design decisions.
2. **Nitpick-heavy reviews** — 40 comments about brace placement and naming conventions while missing a race condition, a SQL injection, or an N+1 query. Style enforcement belongs in automated tooling, not in human review.

The goal is to review code the way the best engineering teams do: catch bugs and design issues that tools can't find, provide actionable feedback, and treat the review as a teaching and knowledge-sharing opportunity.

## Core principles — apply in order

1. **Correctness first.** Does the code do what the PR description says it does? Are there edge cases, race conditions, or failure modes not handled?

2. **Bugs before style.** A security vulnerability matters more than a naming convention. Prioritize feedback by severity.

3. **Automated what can be automated.** Formatting, linting, import ordering, simple code smells — these belong in CI (ESLint, Prettier, Roslyn analyzers, SonarQube). Don't waste human review on what a tool can catch.

4. **Review the design, not just the lines.** Does this change fit the architecture? Is the abstraction right? Will this be maintainable in 6 months? These are the questions tools can't answer.

5. **Provide context with every comment.** Not "this is wrong" but "this can cause X because Y — consider Z instead." The author should understand WHY, not just WHAT.

6. **Distinguish blocking from non-blocking.** Prefix comments: `blocking:` (must fix before merge), `suggestion:` (would improve but not required), `question:` (need clarification), `nit:` (truly optional style preference).

7. **Review your own code first.** Before submitting a PR for review, review it yourself as if someone else wrote it. Most issues are caught by the author in self-review.

8. **Small PRs, fast reviews.** Review PRs <400 lines within 24 hours. If a PR is >1000 lines, ask the author to split it — large PRs get rubber-stamped because reviewers fatigue.

9. **Test coverage is part of the review.** Code without tests is incomplete. Check that tests cover the new behavior, edge cases, and failure modes — not just the happy path.

10. **Security is everyone's job.** Check for: unvalidated input, SQL injection, missing authorization, secrets in code, insecure defaults.

## Workflow — for any code review

1. **Read the PR description first.** Understand the intent before reading the code. If there's no description, ask for one.

2. **Check the test diff.** Read tests before implementation — they tell you what the author intended and what edge cases they considered.

3. **Read the implementation.** Focus on logic, design, error handling, security. Ignore formatting (that's CI's job).

4. **Check cross-cutting concerns.** Observability (logging, metrics), error handling, performance implications, backwards compatibility, migration safety.

5. **Write comments.** Prioritize: blocking > suggestion > question > nit. Include code examples for alternatives.

6. **Summarize.** One overall comment: what the PR does well, what needs fixing, and the approval status.

## Reference index — load on demand

| Topic | File | When to read |
|---|---|---|
| Review comment format and severity levels | `references/comment-format.md` | Writing review comments, calibrating severity |
| Code smells catalog (with detection and fix) | `references/code-smells.md` | Identifying maintainability issues |
| Complexity metrics (cyclomatic, cognitive, coupling) | `references/complexity.md` | Evaluating code complexity, recommending refactoring |
| Refactoring patterns (extract, inline, replace) | `references/refactoring.md` | Suggesting specific refactoring techniques |
| Review checklist by change type | `references/checklists.md` | Systematic review of API changes, DB migrations, security-sensitive code |
| Anti-patterns in reviews (process smells) | `references/anti-patterns.md` | Improving the review process itself |

## Output expectations

When the agent reviews code, it should:

- Categorize every comment with a severity prefix (`blocking:`, `suggestion:`, `question:`, `nit:`).
- Provide a reason (WHY) and an alternative (HOW) for every blocking comment.
- Include code snippets showing the suggested alternative when possible.
- Check for security implications (input validation, authorization, data exposure).
- Check for error handling and edge cases.
- Verify test coverage covers the new behavior.
- Provide an overall summary with an approval recommendation.

When the agent establishes review standards, it should:

- Define what automated tools handle (formatting, linting, simple smells).
- Define what humans review (design, correctness, edge cases, security).
- Set PR size guidelines (<400 lines, or split).
- Set review turnaround SLAs (24 hours for normal, 4 hours for hotfixes).

## Closing each response

1. **Summary verdict** (approve, request changes, needs discussion).
2. **Top 3 issues** by severity.
3. **One positive observation** about the code.
