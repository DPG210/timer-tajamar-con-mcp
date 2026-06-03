# Anti-patterns in the Review Process

Smells in how reviews are conducted, not in the code being reviewed.

## Reviewer anti-patterns

### Rubber stamp

**Symptom:** "LGTM" on every PR within minutes. No comments, no questions.

**Why:** The reviewer isn't reading the code. Bugs, security issues, and design problems pass through unchecked. The team loses trust in the review process.

**Fix:** If you don't have time to review properly, say so — don't approve. Minimum: read every changed line, check tests exist, verify the PR description matches the code.

### Gatekeeper

**Symptom:** One reviewer blocks PRs for days with style preferences. Demands the code be written the way they would write it. "This isn't how I'd do it" as a blocking comment.

**Why:** Creates bottlenecks, demoralizes authors, reduces team velocity. There are many valid ways to write correct code.

**Fix:** Only block for correctness, security, and significant design issues. Style goes in automated tooling. "I'd prefer X" is a suggestion, not a blocker.

### Drive-by reviewer

**Symptom:** Drops 15 comments on a PR they don't understand fully, then disappears. Asks questions but never follows up on answers.

**Fix:** If you're reviewing, commit to the review. Read context, follow up on discussions, approve or request changes — don't leave PRs in limbo.

### Nitpick avalanche

**Symptom:** 30 comments, 25 of which are naming preferences, whitespace, or import order. The SQL injection on line 42 is not mentioned.

**Fix:** Automated linting catches formatting issues. Focus human review on: correctness, security, design, testability. If you must nitpick, use the `nit:` prefix and limit to 2-3 per review.

### Scope creep reviewer

**Symptom:** "While you're in this file, could you also refactor X, add Y, and fix Z?"

**Why:** PRs grow unbounded. The author's simple change becomes a multi-day refactoring. Delays the original feature.

**Fix:** If something needs fixing but isn't in scope, file a separate issue. The PR addresses the PR description, nothing more.

## Author anti-patterns

### Giant PR

**Symptom:** 2000+ lines changed. "Here's the new feature, the refactoring, the migration, and some cleanup I did."

**Why:** Reviewers skim (fatigue). Bugs hide in volume. Review takes days, blocking the author and creating merge conflicts.

**Fix:** Split into logical PRs: migration first, then model changes, then API, then UI. Each PR is reviewable in 30 minutes.

**Size guidelines:**
- <200 lines: Quick review, fast merge.
- 200-400 lines: Normal review, should be reviewed within 24 hours.
- 400-1000 lines: Large — consider splitting.
- >1000 lines: Must split. This is not reviewable in one sitting.

### No PR description

**Symptom:** Title is the branch name: "feature/JIRA-123". Body is empty. Reviewer has to reverse-engineer the intent from the code.

**Fix:** Every PR needs: what it does, why, how to test, and any context the reviewer needs. Template:

```markdown
## What
Brief description of the change.

## Why
Link to ticket/issue. Business context.

## How
Approach taken and key decisions.

## Testing
How this was tested. What to look for.

## Screenshots (if UI)
Before/after if applicable.
```

### Self-merging without review

**Symptom:** Author approves and merges their own PR. "It's a small change."

**Fix:** Every change gets a review. Small changes are fast to review. The "small change" exception is how bugs get into production.

Exception: true emergencies (production is down) — merge now, review after. Document the exception.

### Ignoring review comments

**Symptom:** Author resolves comments without addressing them, pushes a new commit, and requests re-review. Reviewer's feedback was not applied.

**Fix:** Address every comment: fix it, explain why not, or discuss. Resolved comments should have a response. If you disagree, say so — don't silently ignore.

## Process anti-patterns

### No review SLA

**Symptom:** PRs sit for 3-5 days waiting for review. Authors context-switch to other work. When review finally happens, the author has forgotten the details.

**Fix:** Set an SLA: 24 hours for normal PRs, 4 hours for hotfixes. Track review latency. If the team consistently misses the SLA, there aren't enough reviewers or PRs are too large.

### Review as gate, not as collaboration

**Symptom:** Review happens at the end, after all code is written. Reviewer finds fundamental design issues that require a rewrite.

**Fix:** For significant changes, discuss the approach BEFORE writing code (design review, RFC, pairing). Code review should validate the implementation, not debate the approach.

### No knowledge sharing

**Symptom:** Only "senior devs" review code. Junior developers never review. Reviews don't teach — they just gatekeep.

**Fix:** Everyone reviews. Junior developers reviewing senior code is one of the best learning tools. Reviews should explain WHY, not just WHAT — the explanation teaches the team.
