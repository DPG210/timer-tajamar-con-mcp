---
name: technical-writer
description: Professional technical writing knowledge for creating clear, maintainable documentation. Use this skill whenever the user asks for help writing technical documentation, API docs, architecture decision records, runbooks, README files, onboarding guides, changelog entries, or any technical document meant for a developer or operator audience. Trigger on any mention of documentation, docs, README, API reference, ADR, decision record, runbook, playbook, changelog, release notes, onboarding guide, developer guide, tutorial, how-to, reference documentation, or writing for developers.
---

# Technical Writing

A reference skill for writing technical documentation that people actually read and maintain — following the principles of effective technical communication applied to software engineering.

This skill exists to keep two failure modes out of the output:

1. **No documentation** — "the code is self-documenting," tribal knowledge in Slack threads, onboarding takes 3 weeks because nothing is written down, runbooks exist in one person's head.
2. **Documentation theater** — 200 pages of auto-generated API docs that nobody reads, READMEs copied from templates without customization, architecture documents that were accurate 18 months ago, Confluence pages that duplicate the code.

The goal is documentation that answers real questions, stays current, and is maintained as part of the development workflow — not as an afterthought.

## Core principles — apply in order

1. **Write for a specific reader.** Every document has an audience. A runbook is for the on-call engineer at 3am. An API reference is for a developer integrating your service. A tutorial is for a newcomer. Write for THAT person.

2. **Answer the question they actually have.** Readers don't read documentation sequentially — they search for answers. Structure docs around questions and tasks, not around your code's internal structure.

3. **Show, don't just tell.** Code examples are more useful than descriptions. A working `curl` command teaches more than a paragraph explaining the API. Every concept needs an example.

4. **Less is more.** Short documents get read. Long documents get skimmed (or ignored). Say what's needed, then stop. If a README is 500 lines, split it into focused pages.

5. **Documentation is code.** Store it next to the code. Review it in PRs. Test it in CI (link checking, example compilation). If it's not in the repo, it will diverge.

6. **Keep it current or delete it.** Outdated documentation is worse than no documentation — it misleads. If a document can't be maintained, archive it with a "last verified" date.

7. **One source of truth.** Don't duplicate information across documents. Link instead. Duplication guarantees one copy will be outdated.

8. **Progressive disclosure.** Start with the most common use case (quickstart). Provide deeper detail for those who need it (reference). Don't front-load complexity.

## Reference index — load on demand

| Topic | File | When to read |
|---|---|---|
| Document types and templates (README, ADR, runbook, API docs) | `references/document-types.md` | Deciding what to write and how to structure it |
| Writing style guide (clarity, tone, formatting) | `references/style-guide.md` | Writing or reviewing any technical document |
| API documentation patterns | `references/api-docs.md` | Documenting REST/gRPC APIs |
| Anti-patterns in documentation | `references/anti-patterns.md` | Reviewing docs, fixing documentation problems |

## Output expectations

When the agent writes documentation, it should:

- State the audience and purpose at the top (or make it obvious from context).
- Lead with the most common task (quickstart, getting started).
- Include code examples that work (copy-paste-run).
- Use consistent formatting (Markdown, headers, code blocks).
- Link to related documents instead of duplicating.
- Include a "last updated" or "verified on" date for perishable content.

When the agent reviews documentation, it should call out:

- Missing audience or unclear purpose.
- Walls of text without examples.
- Code examples that don't compile or are outdated.
- Duplication with other documents.
- Missing prerequisites or setup instructions.
- Jargon without definition for the intended audience.

## Closing each response

1. **What was assumed** (audience, format, hosting platform).
2. **What was deliberately not included** and why.
3. **One follow-up question** on the most relevant adjacent topic.
