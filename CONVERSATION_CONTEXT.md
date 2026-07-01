# DevScreen Conversation Context

## Why this file exists

This file lets a new conversation recover the product and architectural
decisions made before implementation.

Read this file together with:

- `README.md`
- `ARCHITECTURE.md`
- `PLAN.md`
- `AGENTS.md`, if present

`ARCHITECTURE.md` contains the system design and locked technical behavior.
`PLAN.md` is the implementation checklist. This file records the reasoning
style, decision history, unresolved decisions, and the script for continuing.

## Collaboration agreement

The user wants to own the implementation and learn by building it.

The assistant should behave like a senior engineer working with a junior
engineer:

- Do not dumb down unfamiliar architecture.
- Do not interpret uncertainty as inability.
- Challenge proposals using query patterns, data integrity, failure cases, and
  future migration cost.
- Explain why a relationship or constraint exists.
- Ask the user to make product decisions when multiple valid behaviors exist.
- Separate product decisions from implementation decisions.
- Do not write application code unless the user explicitly asks.
- The assistant may update planning documentation when asked.
- Be direct about contradictions and unnecessary complexity.
- Do not use em dashes.

The working loop is:

1. The user proposes behavior or a model.
2. The assistant identifies invariants, contradictions, and tradeoffs.
3. The assistant gives a recommendation.
4. The user accepts, rejects, or modifies it.
5. The decision is documented.
6. The user implements it.
7. The assistant reviews the implementation and asks the user to explain it.

## Product summary

DevScreen is an interview-readiness application.

The MVP:

1. Authenticates users with Google through Better Auth.
2. Onboards the user.
3. Synchronizes curated questions from Google Sheets into versioned Postgres
   question banks.
4. Creates balanced tests across one or more selected domains.
5. Presents one question at a time and persists draft answers.
6. Evaluates the submitted attempt objectively.
7. Produces a separate personalized interpretation.
8. Stores reports and attempt history.

GitHub repository analysis and RAG are post-MVP extensions.

## Current repository state

As of 2026-06-27, the repository has:

- Next.js with TypeScript
- Tailwind and shadcn components
- Better Auth Google sign-in
- Neon Postgres and Drizzle
- Automatic profile creation after new-user creation
- A basic profile schema
- Placeholder onboarding and homepage UI

The complete interview flow does not exist yet.

There were pre-existing local edits in:

- `components/pages/homepage.tsx`
- `lib/db/drizzle.ts`

Do not overwrite those changes without inspecting them.

## Locked profile decisions

Better Auth owns:

- User ID
- Name
- Email
- Profile image
- Authentication accounts and sessions

The application profile should use Better Auth's `user.id` as `profiles.userId`.
Do not generate identity from email.

Do not duplicate name or email in the profile unless DevScreen later introduces
a separate public identity.

MVP profile fields:

- `userId`
- `experienceLevel`
- `about`
- `otherTechnologies`
- `onboardingCompleted`
- `createdAt`
- `updatedAt`

`onboardingCompleted` remains a boolean for the MVP. A completion timestamp may
replace it later.

Resume upload is deferred.

## Locked technology decisions

Technologies are curated choices used in onboarding.

```text
technologies
- id
- name

profileTechnologies
- userId
- technologyId
```

`profileTechnologies` has composite primary key:

```text
(userId, technologyId)
```

Profile technologies describe what the user claims to know.

They do not select questions for the fundamentals MVP and cannot change the
objective score.

An optional Other text field may store technologies missing from the curated
list. The application must not promise tests for those values.

## Locked domain decisions

The MVP is domain-driven.

Initial domains include:

- Frontend
- Backend
- Full Stack

Additional domains such as Databases, System Design, and DevOps can be added
after their intended question sets are defined.

Users may select multiple domains.

Some domains are composite:

```text
Full Stack -> Frontend
Full Stack -> Backend
```

Selecting Full Stack therefore tests:

- Full Stack
- Frontend
- Backend

Full Stack also has its own cross-layer questions. It is not just an alias for
Frontend plus Backend.

The relationship is represented by:

```text
domainComponents
- parentDomainId
- componentDomainId
```

Weighted domain preferences are deferred.

## Locked question-domain decisions

A question has exactly one primary domain and zero or more additional domains.

```text
questions
- primaryDomainId

questionDomains
- questionId
- domainId
```

The primary domain owns the question for balanced allocation.

Additional domains make the question eligible for related tests.

A question can appear only once in a test.

If the primary domain is effective for a test, the question counts toward that
domain. If the primary domain is not effective but an additional domain is,
the question may count toward one matching effective domain.

Every locked session question stores the domain bucket it satisfied.

No separate topic table exists in the MVP.

## Locked test configuration decisions

The user selects:

- One or more domains
- One tier
- Question count

Supported tiers:

- Intermediate
- Advanced
- Expert

Supported counts:

- 5
- 10
- 15
- 20
- 25
- 30

Profile technologies do not control selection.

Technology-specific tests are a separate future mode.

## Locked allocation decisions

Question allocation is equal across effective domains.

```text
base = floor(requestedCount / effectiveDomainCount)
remainder = requestedCount % effectiveDomainCount
```

Every effective domain receives the base allocation.

Remainder priority:

1. Explicitly selected domains
2. Expanded component domains in stable order

Example:

```text
Selected: Full Stack
Requested: 10

Full Stack: 4
Frontend: 3
Backend: 3
```

Questions are randomized inside each allocation bucket.

The allocation is deterministic.

## Locked shortage decisions

Shortages are not redistributed into other domains.

If a domain cannot satisfy its target allocation:

1. Calculate the actual balanced test size.
2. Show target and available counts per domain.
3. Tell the user the requested and proposed actual test lengths.
4. Require confirmation.
5. Create the shorter test only after confirmation.

The session stores:

- `requestedQuestionCount`
- `actualQuestionCount`

Each session-domain row stores:

- Target count
- Actual count
- Whether it was requested or expanded

## Locked Google Sheets decisions

Google Sheets is an editorial source, not the runtime database.

Every 24 hours, the application:

1. Fetches the Sheet.
2. Normalizes it.
3. Computes a deterministic checksum.
4. Skips unchanged data.
5. Validates all changed rows.
6. Creates a complete immutable bank version in one transaction.
7. Activates it only after complete success.
8. Preserves previous versions.
9. Records the sync result.

Tests always use Postgres.

The question Sheet includes:

- `external_id`
- `question_text`
- `primary_domain`
- `additional_domains`
- `tier`
- `question_type`
- `expected_points`
- `rubric`
- `source`
- `active`

## Locked evaluation decisions

Evaluation has two stages.

### Stage 1: Objective scoring

Inputs:

- Test domains
- Tier
- Questions
- Answers
- Rubrics
- Maximum points

Excluded:

- Experience level
- Profile technologies
- About
- Other claimed technologies

The model returns per-question points and feedback.

The server validates points and calculates the overall score.

### Stage 2: Personalized interpretation

Inputs:

- Validated Stage 1 output
- Overall score
- Experience level
- Profile technologies
- Other claimed technologies
- Domain coverage

Outputs:

- Readiness interpretation
- Claim-versus-demonstration observations
- Skill coverage
- Study recommendations
- Recommended next test

Stage 2 cannot change Stage 1 points or the overall score.

Requested-skill coverage must cite related question IDs or clearly report that
the test did not cover the skill.

## Deferred work

Do not add these to the MVP:

- Resume upload
- GitHub connection
- RAG
- Embeddings
- Technology-specific tests
- Weighted domain selection
- Voice or video interviews
- Recruiter dashboards
- Payments
- Proctoring

## Unresolved decisions

These require future discussion:

1. Exact experience-level values.
2. The full initial domain list beyond Frontend, Backend, and Full Stack.
3. The stable ordering rule when multiple explicitly selected domains compete
   for remainder slots.
4. Whether additional-domain eligibility should have a lower priority than
   primary-domain questions inside a bucket.
5. The exact question-type enum.
6. The exact score-to-readiness-verdict mapping.
7. The background-job mechanism for AI evaluation.
8. The deployment platform and cron provider.

Do not silently decide these during implementation.

## Immediate next milestone

Start with Phase 0 in `PLAN.md`.

Before onboarding work:

1. Inspect the current uncommitted changes.
2. Make lint pass.
3. Make the production build pass.
4. Verify sign-in.
5. Verify sign-out.
6. Verify one profile is created for a new user.
7. Verify returning sign-in does not create another profile.
8. Explain the auth and profile-creation flow in plain language.

After Phase 0 passes, begin the profile and onboarding schema discussion.

## Script for a new conversation

Paste this into a new conversation:

```text
Read AGENTS.md, README.md, ARCHITECTURE.md, PLAN.md, and
CONVERSATION_CONTEXT.md in this repository before responding.

I am building DevScreen myself to learn full-stack product engineering. Treat
me as a junior engineer working with a senior engineer. Do not dumb down the
architecture and do not write implementation code unless I explicitly ask.

Treat the decisions in ARCHITECTURE.md and CONVERSATION_CONTEXT.md as locked
unless I reopen one. Call out contradictions directly. Ask me to make product
decisions when there are multiple valid behaviors. Explain relationships,
invariants, queries, failure cases, and tradeoffs.

First, summarize the current milestone and the locked decisions relevant to it.
Then guide me through Phase 0 one checkpoint at a time. Ask me to explain what I
understand before moving to the next checkpoint.
```

## Script for implementation review

When the user has implemented a phase, use:

```text
Read ARCHITECTURE.md, PLAN.md, and CONVERSATION_CONTEXT.md, then review my
current implementation against the active phase acceptance checks.

Do not rewrite the implementation immediately. First identify correctness,
authorization, data-integrity, and maintainability problems. Ask me to explain
my design choices. Then recommend the smallest corrections and let me implement
them.
```
