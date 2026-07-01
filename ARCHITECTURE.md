# DevScreen Architecture

## Purpose

DevScreen is an interview-readiness application. Its first complete product loop is:

1. Authenticate a user with Google.
2. Collect a minimal profile.
3. Synchronize a curated question bank from Google Sheets into Postgres.
4. Create a balanced test across selected domains.
5. Save answers one question at a time.
6. Evaluate the submitted attempt objectively.
7. Interpret the result using profile context without changing the score.
8. Store the report and attempt history.

GitHub repository analysis and RAG are post-MVP extensions.

## System boundaries

### Better Auth owns identity

Better Auth owns:

- User ID
- Name
- Email
- Profile image
- OAuth accounts
- Sessions

Application code must derive the user ID from the server-side session. It must
not generate identity from email or accept a user ID from submitted form data.

### The profile owns DevScreen-specific context

The profile stores:

- `userId`
- `experienceLevel`
- `about`
- `otherTechnologies`
- `onboardingCompleted`
- `createdAt`
- `updatedAt`

`userId` is both the profile primary key and a foreign key to Better Auth's
`user.id`.

Do not duplicate Better Auth's name, email, or image in the profile unless the
product later introduces a separate public identity.

`onboardingCompleted` remains a boolean for the MVP. A completion timestamp can
replace it later.

Resume upload is deferred.

### Google Sheets owns editorial input

Google Sheets is a private editorial interface for managing questions. It is
not the runtime application database.

Tests always read questions from Postgres. A Google outage must not break an
existing test.

### Postgres owns runtime state

Postgres stores:

- Profiles and technology relationships
- Versioned question banks
- Domains and domain composition
- Locked test sessions
- Draft answers
- Objective evaluations
- Personalized reports
- Synchronization history

## High-level data flow

```text
Google Sheet
    |
    | scheduled read every 24 hours
    v
Parser, normalization, validation, checksum
    |
    | atomic publication
    v
Immutable question-bank version in Postgres
    |
    | domain expansion and balanced selection
    v
Locked test session
    |
    | persisted draft answers
    v
Submitted attempt
    |
    | objective evaluation without profile claims
    v
Validated technical score
    |
    | personalized interpretation with profile context
    v
Stored report and attempt history
```

## Technologies and profiles

### Tables

```text
technologies
- id
- name

profileTechnologies
- userId
- technologyId
```

`technologies.name` is unique.

`profileTechnologies` has a composite primary key:

```text
(userId, technologyId)
```

This is many-to-many:

- One profile may claim many technologies.
- One technology may be claimed by many profiles.

Profile technologies describe what the user claims to know. They do not select
questions for the fundamentals MVP and cannot affect objective scoring.

An optional Other field may store technologies missing from the curated list.
The application must not promise a test for those values.

Technology-specific tests are a separate future mode.

## Domains

### Basic model

```text
domains
- id
- name
```

`domains.name` is unique.

Initial domains:

- Frontend
- Backend
- Full Stack

Additional domains such as Databases, System Design, and DevOps should be added
only after their question sets and behavior are defined.

### Composite domains

Some domains expand into component domains:

```text
domainComponents
- parentDomainId
- componentDomainId
```

The composite primary key is:

```text
(parentDomainId, componentDomainId)
```

Example:

```text
Full Stack -> Frontend
Full Stack -> Backend
```

Selecting Full Stack therefore tests:

- Full Stack
- Frontend
- Backend

Full Stack retains its own cross-layer questions. It is not merely an alias for
Frontend plus Backend.

Self-relations and cycles are invalid.

## Question domains

A question has:

- Exactly one primary domain
- Zero or more additional domains

```text
questions
- primaryDomainId

questionDomains
- questionId
- domainId
```

`questionDomains` has composite primary key:

```text
(questionId, domainId)
```

Example:

```text
Question: Explain authentication across a frontend and backend.
Primary domain: Full Stack
Additional domains: Frontend, Backend
```

The primary domain owns the question for balanced allocation. Additional
domains make it eligible for related tests.

Rules:

1. A question can appear only once in a session.
2. If its primary domain is effective, it counts toward the primary domain.
3. If its primary domain is not effective but an additional domain is, it may
   count toward one matching effective domain.
4. A primary domain cannot also appear as an additional domain.
5. Every selected session question records the domain allocation it satisfied.

There is no topic table in the MVP.

## Test configuration

The user selects:

- One or more domains
- One tier
- A question count

Tiers:

- `intermediate`
- `advanced`
- `expert`

Tier definitions:

- Intermediate: minimum practical knowledge expected from an employable developer
- Advanced: application, debugging, implementation, and tradeoff knowledge
- Expert: architecture, edge cases, performance, security, and system reasoning

Question counts:

- 5
- 10
- 15
- 20
- 25
- 30

Profile technologies do not control test selection.

## Domain expansion and allocation

### Expansion

Explicitly selected domains are expanded through `domainComponents`.

The effective domain set is deduplicated.

Example:

```text
Selected: Full Stack
Effective: Full Stack, Frontend, Backend
```

### Equal allocation

For `N` requested questions and `D` effective domains:

```text
base = floor(N / D)
remainder = N % D
```

Every domain receives `base`.

Remainder priority:

1. Explicitly selected domains
2. Expanded component domains in stable order

Examples:

```text
Requested: 10
Effective domains: Full Stack, Frontend, Backend

Full Stack: 4
Frontend: 3
Backend: 3
```

```text
Requested: 5
Effective domains: Full Stack, Frontend, Backend

Full Stack: 2
Frontend: 2
Backend: 1
```

Allocation is deterministic. Questions inside each bucket are randomized.

Weighted domain preferences are deferred.

### Question assignment

For each domain allocation:

1. Prefer unused questions whose primary domain matches the bucket.
2. Use additional-domain eligibility only when the primary domain is not an
   effective domain.
3. Remove every selected question ID from all later buckets.
4. Store the bucket in `testSessionQuestions.allocatedDomainId`.

### Shortage handling

Shortages are not redistributed into other domains.

Example:

```text
Requested: 15

Target:
Full Stack: 5
Frontend: 5
Backend: 5

Available:
Full Stack: 5
Frontend: 5
Backend: 2

Proposed test: 12
```

Before creating the session:

1. Show the requested count.
2. Show the available count.
3. Show shortages per domain.
4. Ask the user to confirm the shorter test.

The session stores:

- `requestedQuestionCount`
- `actualQuestionCount`

Each session-domain row stores:

- Whether it was requested or expanded
- Target question count
- Actual question count

## Question-bank synchronization

### Daily process

Every 24 hours:

1. Fetch the configured Google Sheet range.
2. Normalize the rows.
3. Calculate a deterministic checksum.
4. Compare it with the last successful checksum.
5. Stop if unchanged.
6. Validate the complete changed dataset.
7. Create a complete immutable question-bank version in one transaction.
8. Activate it only after all rows succeed.
9. Preserve previous versions.
10. Record the synchronization result.

For the MVP, fetching the small Sheet and comparing a checksum is simpler than
making a separate Drive API request for `modifiedTime`.

### Sheet contract

The `Questions` tab uses:

| Column | Required | Meaning |
| --- | --- | --- |
| `external_id` | yes | Stable question identity |
| `question_text` | yes | Exact user-facing question |
| `primary_domain` | yes | Canonical allocation domain |
| `additional_domains` | no | Comma-separated eligible domains |
| `tier` | yes | `intermediate`, `advanced`, or `expert` |
| `question_type` | yes | Question classification |
| `expected_points` | yes | Positive maximum score |
| `rubric` | yes | Expected facts and reasoning |
| `source` | no | Editorial source |
| `active` | yes | `TRUE` or `FALSE` |

Rules:

- `external_id` never changes after publication.
- Required fields cannot use formulas.
- The complete proposed version is rejected if any row is invalid.
- `primary_domain` must reference a known domain.
- Additional domains must be known and unique.
- Additional domains cannot repeat the primary domain.
- Inactive questions remain available to historical versions.

## Test lifecycle

### Session statuses

```text
in_progress
submitted
evaluating_objective
objective_completed
personalizing
completed
evaluation_failed
personalization_failed
```

### Session invariants

- A session belongs to exactly one user.
- A session references exactly one question-bank version.
- Question order is locked at creation.
- Refreshing never regenerates questions.
- A question cannot appear twice in a session.
- Submitted answers cannot be edited.
- Submission is idempotent.
- Users cannot access another user's sessions or reports.

## Evaluation architecture

Evaluation has two separate stages.

### Stage 1: Objective evaluation

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

Required per-question output:

- `questionId`
- `awardedPoints`
- `maxPoints`
- `correctParts`
- `missingParts`
- `incorrectClaims`
- `reasoningQuality`
- `feedback`

The server validates awarded points and calculates the overall score.

### Stage 2: Personalized interpretation

Inputs:

- Validated Stage 1 results
- Overall score
- Test domains and coverage
- Experience level
- Profile technologies
- Other claimed technologies

Outputs:

- Readiness interpretation
- Strong and weak domains
- Claim-versus-demonstration observations
- Skill coverage
- Study recommendations
- Recommended next test

Skill-coverage values:

- `covered`
- `partially_covered`
- `not_covered`
- `uncertain`

Every coverage claim cites related question IDs or reports that the test did not
cover the skill.

Stage 2 cannot change Stage 1 points or the overall score. A Stage 2 failure must
not destroy a successful Stage 1 evaluation.

## Data model summary

```text
Better Auth:
user
session
account
verification

Profile:
profiles
technologies
profileTechnologies

Question bank:
domains
domainComponents
questionBankVersions
questions
questionDomains
sheetSyncRuns

Testing:
testSessions
testSessionDomains
testSessionQuestions
answers

Evaluation:
evaluationReports
```

## Important constraints and indexes

- `profiles.userId` primary key and foreign key to `user.id`
- Unique `technologies.name`
- Composite primary key `(userId, technologyId)`
- Unique `domains.name`
- Composite primary key `(parentDomainId, componentDomainId)`
- Unique `(bankVersionId, externalId)`
- Index `(bankVersionId, active, tier, primaryDomainId)`
- Composite primary key `(questionId, domainId)`
- Unique `(sessionId, domainId)`
- Unique `(sessionId, position)`
- Unique `(sessionId, questionId)`
- Index `(userId, createdAt)` for attempt history
- At most one successful evaluation report per session

Indexes should follow real query patterns. They are not substitutes for domain
modeling.

## Security and reliability rules

- Derive user identity from the server session.
- Treat profile, question, rubric, and answer text as untrusted data.
- Validate every external payload with Zod.
- Never expose Google service-account credentials to the browser.
- Publish question-bank versions atomically.
- Preserve old bank versions and reports.
- Make synchronization, submission, and evaluation retries idempotent.
- Store model names and prompt versions.
- Do not log secrets, complete resumes, or unnecessary answer content.

## Post-MVP architecture

### GitHub-grounded interviews

The future repository mode will:

1. Accept a public repository first.
2. Record repository, branch, and commit SHA.
3. Filter generated, binary, vendored, secret, and oversized files.
4. Chunk useful files with path, language, symbol, and line metadata.
5. Establish keyword retrieval before embeddings.
6. Add pgvector semantic retrieval.
7. Compare keyword, vector, and hybrid retrieval.
8. Generate questions that retain source evidence.
9. Add private access through a read-only GitHub App.
10. Support adaptive follow-up questions.

Every repository question must store its source chunks, paths, symbols, and
commit SHA.

### RAG quality requirements

- Every generated question has traceable repository evidence.
- Retrieved evidence belongs to the indexed commit.
- The system can report insufficient evidence.
- Repository text is data, not model instructions.
- Users can delete indexed repository data.
- Retrieval is evaluated against manually verified cases.
- RAG quality is compared with a non-RAG baseline.

## Deliberate MVP exclusions

- Resume upload
- GitHub connection
- RAG and embeddings
- Technology-specific tests
- Weighted domain selection
- Voice and video interviews
- Proctoring
- Recruiter dashboards
- Organizations
- Payments
- Fine-tuning
- A separate vector database
- Complex admin roles

## Unresolved decisions

- Exact experience-level values
- Initial domains beyond Frontend, Backend, and Full Stack
- Stable remainder ordering for multiple explicitly selected domains
- Exact question-type values
- Score-to-readiness mapping
- Background execution mechanism for AI evaluation
- Deployment platform and cron provider

Do not silently decide these during implementation.

## References

- Google Sheets values API:
  <https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/get>
- Google Sheets value-reading guide:
  <https://developers.google.com/workspace/sheets/api/guides/values>
- Vercel cron jobs:
  <https://vercel.com/docs/cron-jobs>
- GitHub repository tree API:
  <https://docs.github.com/en/rest/git/trees>
- GitHub App installation authentication:
  <https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation>
- Neon vector-search concepts:
  <https://neon.com/docs/ai/ai-concepts>
- pgvector:
  <https://github.com/pgvector/pgvector>
- AI SDK structured output:
  <https://ai-sdk.dev/docs/reference/ai-sdk-core/output>
