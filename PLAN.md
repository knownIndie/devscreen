# DevScreen Development Plan

## Purpose

DevScreen is a learning-first project and a real interview-readiness product.

The immediate goal is to build a small, complete MVP that works end to end:

1. A user signs in with Google.
2. The user completes onboarding.
3. DevScreen synchronizes a curated question bank from Google Sheets into Postgres.
4. The user chooses one or more domains, a tier, and a test length.
5. DevScreen creates an immutable test from the active question-bank version.
6. The user answers one question at a time.
7. The user submits the full attempt.
8. AI evaluates the full attempt against stored rubrics.
9. DevScreen stores and displays the report.
10. The user can revisit previous attempts.

GitHub repository analysis and RAG are post-MVP work. They should extend a working
interview engine, not replace it.

## Current Baseline

The repository currently demonstrates:

- Next.js application setup
- TypeScript and React fundamentals
- Tailwind and shadcn component integration
- Better Auth with Google sign-in
- Drizzle and Neon Postgres setup
- Basic schema creation and migrations
- Automatic profile creation after a new auth user is created
- Basic client-side session handling

The repository does not yet demonstrate:

- Complete onboarding
- Server-side authorization rules
- Form validation and safe database mutations
- A stable question domain model
- External-data synchronization
- Background or scheduled jobs
- Versioned content
- Transactional test creation
- Answer persistence
- AI output validation
- Automated tests
- A complete product flow

This plan teaches those capabilities in that order.

## Product Decisions

### Google Sheets is not the runtime database

Google Sheets is the private editorial interface for managing questions. It is
the source from which question-bank versions are published.

Postgres remains the application database.

The user-facing application must never read test questions directly from Google
Sheets. Tests should still work if Google Sheets is unavailable.

### Sheet synchronization model

Every 24 hours, a scheduled server-side job will:

1. Fetch the configured question range from Google Sheets.
2. Normalize the returned rows.
3. Calculate a checksum for the complete normalized dataset.
4. Compare it with the last successfully imported checksum.
5. Stop if the checksum is unchanged.
6. Validate every row if the checksum changed.
7. Create a new immutable question-bank version inside one database transaction.
8. Mark the new version active only after the complete import succeeds.
9. Keep the previous version available for historical attempts.
10. Record a sync report with counts and errors.

For a small MVP sheet, fetching once and comparing a checksum is simpler than
making a separate Google Drive API request just to inspect `modifiedTime`.

### Question text is curated, not generated during test creation

For the MVP, "generate a test" means select a randomized set of stored questions.
It does not mean ask AI to invent new question text.

AI-generated questions can be tested later, but they are not allowed to weaken
the reliability of the initial question bank.

### Tiers

DevScreen has exactly three tiers:

- `intermediate`: minimum practical knowledge expected from an employable developer
- `advanced`: deeper application, debugging, tradeoffs, and implementation knowledge
- `expert`: architecture, edge cases, performance, security, and system-level reasoning

There is no beginner tier.

The descriptions above must be written into the product and prompt contracts.
Without operational definitions, different editors and AI calls will classify
the same question inconsistently.

### Test lengths

The supported lengths are:

- 5 questions
- 10 questions
- 15 questions
- 20 questions
- 25 questions
- 30 questions

A test must never repeat a question to satisfy the requested count.

If a balanced test cannot reach the requested count, the application must show
the shortage before creating the session. The user may confirm a shorter test.
The system must not silently redistribute missing questions into other domains.

### Domain-driven test selection

The fundamentals test is configured primarily through domains, not profile
technologies.

Examples of domains:

- Frontend
- Backend
- Full Stack
- Databases
- System Design
- DevOps

A user may select multiple domains. Question allocation is balanced equally
across the effective domains for the MVP.

Some domains are composite. Selecting Full Stack expands the effective test
domains to:

- Full Stack
- Frontend
- Backend

Full Stack retains its own cross-layer questions. It is not merely an alias for
Frontend plus Backend.

Weighted domain preferences are deferred. A later advanced configuration may
allow users to assign different percentages.

### Balanced domain allocation

Given `N` requested questions and `D` effective domains:

```text
base allocation = floor(N / D)
remainder = N % D
```

Every domain receives the base allocation. Remainder slots go first to domains
explicitly selected by the user, then to expanded component domains in stable
order.

Example for a 10-question Full Stack test:

```text
Full Stack: 4
Frontend: 3
Backend: 3
```

Example for a 5-question Full Stack test:

```text
Full Stack: 2
Frontend: 2
Backend: 1
```

The questions inside each allocation bucket are randomized. The allocation
itself is deterministic.

### Strict shortage handling

If a domain cannot satisfy its allocation, do not silently move its missing
slots into another domain.

Example:

```text
Requested: 15
Target allocation:
  Full Stack: 5
  Frontend: 5
  Backend: 5

Available:
  Full Stack: 5
  Frontend: 5
  Backend: 2

Proposed shorter test: 12
```

Before creating the session, show the requested count, actual available count,
and shortage per domain. The user must confirm the shorter test.

The session stores both `requestedQuestionCount` and `actualQuestionCount`.

### Question domain ownership

A question may apply to multiple domains, but it has exactly one primary domain.

Example:

```text
Question: Explain authentication across a frontend and backend.
Primary domain: Full Stack
Additional domains: Frontend, Backend
```

The primary domain owns the question for balanced allocation. Additional domain
relationships make it eligible for related interviews.

Allocation rules:

1. A question can appear only once in a session.
2. If its primary domain is one of the effective domains, it counts toward that
   primary domain.
3. If its primary domain is not effective but an additional domain is effective,
   it may count toward one matching effective domain.
4. Selected question IDs are excluded from every remaining bucket.

The phrases "additional domain" and "subdomain" refer to question classification.
They do not mean that every domain is globally a child of another domain.

### Profile technologies

Profile technologies describe what the user claims to know. They do not select
questions for the MVP.

They may later support:

- Suggested tests
- Claim-versus-performance analysis
- Personalized study recommendations
- Profile-based presets

A technology-specific test is a separate future test mode.

### Two future interview modes

The completed product can eventually support:

1. Fundamentals test
   - Uses the curated question bank.
   - Has no AI intervention during the test.
   - AI evaluates only after final submission.

2. Project deep-dive interview
   - Uses retrieved evidence from a selected GitHub repository.
   - Can ask adaptive follow-up questions.
   - Every repository question must retain its source evidence.

Only the fundamentals test belongs in the first MVP.

## Target MVP Architecture

```text
Google Sheet
    |
    | scheduled read every 24 hours
    v
Sheet parser and validator
    |
    | successful atomic import
    v
Versioned question bank in Postgres
    |
    | filtered randomized selection
    v
Locked test session
    |
    | draft answers
    v
Submitted attempt
    |
    | objective evaluation without profile claims
    v
Stored technical score
    |
    | personalized interpretation using profile context
    v
Stored report and attempt history
```

## Proposed Data Model

This is a design target, not a command to create every table immediately.

### `profiles`

Application-specific user context:

- `userId`
- `experienceLevel`
- `about`
- `otherTechnologies`
- `onboardingCompleted`
- `createdAt`
- `updatedAt`

`userId` is both the profile primary key and a foreign key to the Better Auth
`user.id`. Do not generate IDs from email. Do not duplicate Better Auth's name,
email, or image fields in the profile unless DevScreen later introduces a
separate public identity.

`otherTechnologies` is optional profile context. It does not make those
technologies available for test selection and cannot affect objective scoring.

Resume upload is deferred because it introduces file storage, parsing, personal
data handling, deletion, and prompt-size concerns.

### `technologies`

- `id`
- `name`

`name` is unique.

### `profileTechnologies`

- `userId`
- `technologyId`

The composite primary key is `(userId, technologyId)`.

This is a many-to-many relationship. One profile may claim many technologies,
and the same technology may be claimed by many profiles.

### `domains`

- `id`
- `name`

`name` is unique. Slugs and active status are not required for the MVP.

### `domainComponents`

- `parentDomainId`
- `componentDomainId`

The composite primary key is `(parentDomainId, componentDomainId)`.

This table expresses composite-domain expansion:

```text
Full Stack -> Frontend
Full Stack -> Backend
```

Self-relations and cycles must be rejected. Full Stack itself is included
implicitly when selected.

### `questionBankVersions`

- `id`
- `source`
- `sourceChecksum`
- `rowCount`
- `status`
- `isActive`
- `createdAt`

Only a successfully imported version may become active.

### `questions`

- `id`
- `bankVersionId`
- `externalId`
- `text`
- `primaryDomainId`
- `tier`
- `questionType`
- `expectedPoints`
- `rubric`
- `active`
- `source`
- `createdAt`

For the MVP, each bank version can contain a complete immutable snapshot of all
questions. This duplicates some data, but it is much easier to reason about and
protects historical tests. Optimize revisions only after the system works.

### `questionDomains`

- `questionId`
- `domainId`

The composite primary key is `(questionId, domainId)`.

These rows store additional domain eligibility. `questions.primaryDomainId`
remains the canonical allocation owner. Validation must prevent the primary
domain from being repeated as an additional domain.

### `sheetSyncRuns`

- `id`
- `startedAt`
- `finishedAt`
- `status`
- `sourceChecksum`
- `rowsRead`
- `rowsImported`
- `errorCount`
- `errors`

This table answers: Did synchronization run, did it succeed, and what failed?

### `testSessions`

- `id`
- `userId`
- `bankVersionId`
- `tier`
- `requestedQuestionCount`
- `actualQuestionCount`
- `status`
- `startedAt`
- `submittedAt`
- `createdAt`

Suggested statuses:

- `in_progress`
- `submitted`
- `evaluating`
- `completed`
- `evaluation_failed`

### `testSessionDomains`

- `sessionId`
- `domainId`
- `selectionKind`
- `targetQuestionCount`
- `actualQuestionCount`

The composite primary key is `(sessionId, domainId)`.

`selectionKind` records whether a domain was explicitly requested or expanded
from a composite domain. Target and actual counts preserve the allocation used
to build the test.

### `testSessionQuestions`

- `id`
- `sessionId`
- `questionId`
- `position`
- `allocatedDomainId`

Required constraints:

- Unique `(sessionId, position)`
- Unique `(sessionId, questionId)`

`allocatedDomainId` records which domain bucket the question satisfied. This is
required because a question may belong to multiple domains.

### `answers`

- `id`
- `sessionQuestionId`
- `answerText`
- `savedAt`

There must be at most one current answer per session question.

### `evaluationReports`

- `id`
- `sessionId`
- `objectiveModel`
- `objectivePromptVersion`
- `objectiveData`
- `overallScore`
- `personalizationModel`
- `personalizationPromptVersion`
- `personalizedData`
- `readinessVerdict`
- `createdAt`

There must be at most one successful evaluation report per session.

Objective scoring and personalized interpretation are separate stages. A
personalization failure must not destroy a successful objective evaluation.

## Google Sheet Contract

Create one sheet tab named `Questions`.

Use this exact first-row header:

| Column | Required | Meaning |
| --- | --- | --- |
| `external_id` | yes | Stable identifier such as `fe-rendering-001` |
| `question_text` | yes | The exact question shown to users |
| `primary_domain` | yes | Canonical allocation domain such as `Frontend` |
| `additional_domains` | no | Comma-separated eligible domains such as `Full Stack` |
| `tier` | yes | `intermediate`, `advanced`, or `expert` |
| `question_type` | yes | `concept`, `debugging`, `design`, `scenario`, or `comparison` |
| `expected_points` | yes | Maximum points for the answer |
| `rubric` | yes | Semicolon-separated facts or reasoning expected |
| `source` | no | Book, documentation, interviewer, or internal reference |
| `active` | yes | `TRUE` or `FALSE` |

Rules:

- `external_id` must never change after publication.
- Editing `external_id` means creating a new question identity.
- No merged cells.
- No formulas in required fields.
- No blank rows between questions.
- `expected_points` must be a positive integer.
- `rubric` must contain enough information to evaluate an answer.
- `primary_domain` must match a known domain.
- `additional_domains` must contain only known, unique domains.
- `additional_domains` must not repeat `primary_domain`.
- Inactive questions remain in the sheet for history.
- Missing questions in a later sheet version should not rewrite old attempts.

## Database Index Plan

Database indexes are not a replacement for domains or question types.

Start with:

- Unique index on `(bankVersionId, externalId)`
- Index on `(bankVersionId, active, tier, primaryDomainId)`
- Index on `(bankVersionId, active, tier, questionType)`
- Unique index on `(questionId, domainId)`
- Unique index on `(parentDomainId, componentDomainId)`
- Unique index on `(userId, technologyId)`
- Unique index on `(sessionId, domainId)`
- Unique index on `(sessionId, position)`
- Unique index on `(sessionId, questionId)`
- Index on `(userId, createdAt)` for attempt history

Do not add indexes because they sound fast. Add them for actual query patterns,
then inspect query plans later.

## Development Method

For every phase:

1. Read the relevant documentation.
2. Write the data flow in plain English.
3. Implement the smallest version.
4. Test the happy path.
5. Test authorization and failure paths.
6. Explain the implementation without reading the code.
7. Commit only that phase.

Do not continue when the phase acceptance checks fail.

# MVP Implementation Phases

## Phase 0: Clean and understand the current foundation

### Goal

Reach a known-good starting point before adding product logic.

### Learn

- How the Next.js App Router organizes pages and layouts
- The difference between client and server code
- Better Auth session flow
- The difference between auth users and product profiles
- How environment variables enter the application
- What lint, type checking, and production build each verify

### Steps

1. Remove or resolve commented-out experimental homepage code.
2. Fix every lint and TypeScript error.
3. Confirm the production build succeeds.
4. Trace Google sign-in from the button to Better Auth and back.
5. Confirm a first-time user creates one profile.
6. Confirm a returning user does not create duplicate profiles.
7. Confirm sign-out returns to a signed-out state.
8. Write a short manual test checklist in the commit message or PR.

### Acceptance checks

- `pnpm lint` passes.
- `pnpm build` passes.
- Google sign-in works.
- Google sign-out works.
- New login creates exactly one profile.
- Returning login reuses the profile.
- You can explain which operations run in the browser and which run on the server.

## Phase 1: Build onboarding

### Goal

Collect only the user context needed to configure and evaluate interviews.

### Learn

- Controlled forms
- Zod validation
- Server-side session checks
- Safe authenticated mutations
- Drizzle migrations
- Redirect and route-protection logic

### Steps

1. Choose and document the allowed experience-level values.
2. Replace the current profile identity with `userId` as primary key and foreign key.
3. Remove duplicated name and email fields from the application profile.
4. Add the technology and profile-technology schemas.
5. Seed a curated technology list.
6. Write the onboarding Zod schema before the form.
7. Create and inspect a Drizzle migration.
8. Apply the migration locally.
9. Build the experience-level, technology multi-select, Other, and About fields.
10. Load existing values for returning users.
11. Submit through a server-side mutation.
12. Derive `userId` from the server session, never from submitted form data.
13. Validate that every selected technology ID exists.
14. Save profile fields and replace technology relationships in one transaction.
15. Set `onboardingCompleted` only after validation and persistence succeed.
16. Redirect completed users to the dashboard.
17. Redirect incomplete authenticated users to onboarding.
18. Keep login and public pages accessible without onboarding.

### Acceptance checks

- Invalid experience levels and technology IDs are rejected.
- A user cannot update another user's profile.
- Duplicate technology selections cannot be stored.
- Better Auth remains the source of name and email.
- Refreshing the page preserves saved information.
- A completed user does not repeatedly return to onboarding.
- Database errors produce a visible failure state.
- You can explain why client-side validation alone is insufficient.

## Phase 2: Model the question bank locally

### Goal

Make Postgres capable of representing the complete curated question bank before
introducing Google API complexity.

### Learn

- Domain modeling
- Enums and constraints
- Foreign keys
- Unique constraints
- Composite indexes
- Immutable snapshots

### Steps

1. Add domain, domain-component, version, question, question-domain, and sync-run schemas.
2. Define tier and question-type values once and reuse them.
3. Add constraints that reject self-referential domain components.
4. Add validation that rejects composite-domain cycles.
5. Add one primary domain to every question.
6. Allow zero or more additional domains through `questionDomains`.
7. Generate and inspect the migration.
8. Seed Frontend, Backend, and Full Stack.
9. Configure Full Stack to include Frontend and Backend.
10. Seed at least 18 questions manually.
11. Include all three tiers and at least three question types.
12. Include at least one cross-domain question with additional domains.
13. Query questions by active version, domain membership, tier, and type.
14. Verify duplicate external IDs are rejected within one bank version.

### Acceptance checks

- The application can retrieve matching questions without Google Sheets.
- Old bank versions can coexist with the active version.
- Invalid tier values cannot be stored.
- Full Stack expands to Full Stack, Frontend, and Backend without duplicates.
- Every question has exactly one primary domain.
- Primary domains cannot be repeated as additional domains.
- A question contains an actual evaluation rubric.
- You can explain every constraint and index.

## Phase 3: Build a manual Google Sheet importer

### Goal

Prove the Sheet contract and import logic before adding scheduling.

### Learn

- Service accounts and API scopes
- Reading external API data
- Separating transport, parsing, validation, and persistence
- Normalization and checksums
- Atomic transactions
- Error reporting

### Steps

1. Create the `Questions` sheet using the documented contract.
2. Create a Google Cloud service account for server-to-server access.
3. Share only the question sheet with the service-account email.
4. Grant read-only access.
5. Store credentials only in environment variables.
6. Fetch the configured range with the Google Sheets API.
7. Convert raw rows into named objects.
8. Normalize whitespace, booleans, domain lists, and enum casing.
9. Validate the complete dataset with Zod.
10. Detect duplicate `external_id` values.
11. Calculate a deterministic checksum.
12. Add a protected manual sync action.
13. Import a complete version inside one transaction.
14. Show inserted-row and validation-error counts.
15. Refuse to activate a partially valid version.

### Acceptance checks

- A valid sheet creates one active bank version.
- Running sync again without changes creates no version.
- One invalid row rejects the proposed version.
- The previous active version remains active after failure.
- Secrets never appear in client code or logs.
- You can explain why validation occurs before activation.

## Phase 4: Automate daily synchronization

### Goal

Turn the working importer into a safe, observable scheduled process.

### Learn

- Cron expressions
- Idempotency
- Concurrency control
- Retry behavior
- Operational logs
- Failure recovery

### Steps

1. Extract one synchronization service used by both manual and scheduled routes.
2. Protect the scheduled endpoint with a secret.
3. Configure a once-per-day cron schedule.
4. Prevent two sync jobs from importing simultaneously.
5. Record the start and result of every sync.
6. Compare the normalized checksum with the last successful version.
7. Skip unchanged datasets.
8. Activate a changed version atomically.
9. Preserve the previous version on all failures.
10. Add an internal status view showing last success and last failure.
11. Keep the manual sync action for development and recovery.

### Acceptance checks

- Repeated calls are safe.
- Concurrent calls do not create duplicate active versions.
- An unchanged sheet performs no import.
- A failed API call does not change the active bank.
- A failed validation does not change the active bank.
- Every run can be diagnosed from stored sync information.

## Phase 5: Create test configuration and locked selection

### Goal

Create reproducible tests from the active question bank.

### Learn

- Transactional workflows
- Random selection without replacement
- Availability validation
- Immutable attempt state
- Authorization

### Steps

1. Add test-session and session-question schemas.
2. Build a test-configuration page.
3. Let the user select one or more domains, a tier, and a supported question count.
4. Expand composite domains and deduplicate the effective domain set.
5. Calculate deterministic equal allocations and remainder priority.
6. Load eligible active questions from the active bank version.
7. Reserve questions for their primary domain when that domain is effective.
8. Use additional domain membership only when the primary domain is not effective.
9. Exclude every selected question ID from all later domain buckets.
10. Calculate target and available counts for every effective domain.
11. If shortages exist, show the proposed shorter balanced test.
12. Require explicit user confirmation before creating a shorter session.
13. Randomly select questions inside each domain allocation.
14. Create the session, session domains, and ordered question rows in one transaction.
15. Store requested count, actual count, active bank version, and allocated domain.
16. Redirect to the first question.
17. Load future pages from the locked session-question rows.
18. Never rerun expansion or random selection when a session is refreshed.

### Acceptance checks

- A 5-question request creates exactly 5 unique questions.
- Frontend plus Backend receives a balanced allocation.
- Full Stack expands to its three effective domains.
- Remainder questions follow the documented deterministic priority.
- A cross-domain question appears at most once.
- Every question records the domain allocation it satisfied.
- A shortage produces a confirmed shorter test rather than redistribution.
- Requested and actual counts are both stored.
- Refreshing never changes order or content.
- A later Sheet sync does not change an existing session.
- One user cannot open another user's session.
- You can explain where the transaction begins and why.

## Phase 6: Build the answering experience

### Goal

Allow reliable one-question-at-a-time answering with draft persistence.

### Learn

- URL-based state
- Server-derived progress
- Upserts
- Race conditions
- Read-only state transitions
- Accessible form behavior

### Steps

1. Add the answer schema and constraints.
2. Create the session question route.
3. Show question text, answer input, position, and progress.
4. Tell the user to include their answer, assumptions, approach, and relevant
   tradeoffs, and to explain partial understanding when unsure.
5. Add previous and next navigation.
6. Save the current answer before navigation.
7. Restore saved answers on revisit and refresh.
8. Add an unanswered-question review before submission.
9. Add a final confirmation step.
10. Mark the session submitted on the server.
11. Prevent all answer edits after submission.
12. Make submission idempotent.

### Acceptance checks

- Draft answers survive navigation and refresh.
- Previous and next cannot escape the session.
- Progress is calculated from stored answers.
- Double submission creates no duplicate state.
- Submitted answers cannot be edited through the UI or direct requests.
- Empty answers are handled according to one documented rule.

## Phase 7: Build AI evaluation

### Goal

Produce a stored, structured, explainable report without allowing profile claims
to influence objective scoring.

### Learn

- Prompt design
- Structured model output
- Zod validation
- Idempotent AI operations
- Retry and failure states
- Separating model judgment from deterministic calculations
- Separating objective scoring from personalized interpretation

### Stage 1: Objective evaluation input

- Test domains and tier
- Question-bank version
- Every question
- Every answer
- Expected points
- Rubric

Do not include experience level, profile technologies, About, or other claimed
skills in Stage 1.

### Required Stage 1 per-question output

- `questionId`
- `awardedPoints`
- `maxPoints`
- `correctParts`
- `missingParts`
- `incorrectClaims`
- `reasoningQuality`
- `feedback`

The server validates every awarded score and calculates the overall score from
the validated per-question points.

### Stage 2: Personalized interpretation input

- Validated Stage 1 results
- Overall score
- Test domains and tier
- Domain coverage
- Profile technologies
- Other claimed technologies
- Experience level

### Required Stage 2 output

- Strong domains and demonstrated skills
- Weak domains and missing knowledge
- Communication feedback
- Readiness verdict
- Claim-versus-demonstration observations
- Requested-skill coverage
- Recommended study actions
- Recommended next test

Requested-skill coverage uses:

- `covered`
- `partially_covered`
- `not_covered`
- `uncertain`

Every coverage claim must cite related question IDs. Requested-skill coverage
cannot alter awarded points or the overall score.

### Steps

1. Define separate Zod schemas for objective and personalized output.
2. Version both prompts independently.
3. Treat all profile, question, rubric, and answer text as untrusted data.
4. Run Stage 1 without profile claims.
5. Ask Stage 1 for per-question awarded points and evidence-based feedback.
6. Validate awarded points against each maximum.
7. Calculate the overall score on the server.
8. Persist the successful objective result before personalization.
9. Run Stage 2 using the validated objective result and profile context.
10. Validate coverage claims and cited question IDs.
11. Persist personalization separately from objective data.
12. Store both model names and prompt versions.
13. Add objective and personalization failure states.
14. Make retries safe for each stage.
15. Never call AI again when opening an existing successful stage.

### Acceptance checks

- Malformed output from either stage is rejected.
- Points outside the valid range are rejected.
- The overall score is deterministic from per-question points.
- Identical answers receive identical scoring context regardless of profile claims.
- Profile claims can affect recommendations but not awarded points.
- Every custom-skill coverage claim cites question evidence or says it was not covered.
- A personalization failure preserves the objective evaluation.
- Retrying either stage does not create duplicate reports.
- Reloading a report makes no AI call.
- Evaluation failure does not lose submitted answers.

## Phase 8: Build the report and attempt history

### Goal

Turn stored evaluations into a usable learning product.

### Learn

- Server-side data loading
- Ownership checks
- Data visualization
- Empty and failure states
- Product-oriented information hierarchy

### Steps

1. Build a report detail page.
2. Show overall score and readiness verdict first.
3. Show strengths and weaknesses.
4. Show per-question feedback and awarded points.
5. Show a concrete study plan.
6. Build an attempt-history dashboard.
7. Show requested domains, tier, score, status, and date.
8. Link completed attempts to reports.
9. Link in-progress attempts back to their next unanswered question.
10. Provide a retry action for failed evaluations.

### Acceptance checks

- Users can only view their own attempts and reports.
- In-progress, evaluating, failed, and completed states are distinguishable.
- The report explains why the score was awarded.
- A user can resume an incomplete attempt.
- Old reports remain unchanged after new prompt or Sheet versions.

## Phase 9: Test and harden the MVP

### Goal

Make the complete flow safe enough to demonstrate without developer intervention.

### Minimum automated tests

- Sheet row normalization
- Sheet dataset validation
- Duplicate external-ID detection
- Checksum stability
- Question availability validation
- Composite-domain expansion and cycle rejection
- Balanced allocation and remainder handling
- Cross-domain question deduplication
- Strict shortage calculation
- Random selection uniqueness
- Score calculation
- Objective evaluation output validation
- Personalized interpretation output validation
- Session ownership
- Submitted-session immutability

### Full manual test

1. Sign in with a new Google account.
2. Complete onboarding.
3. Synchronize a valid Sheet version.
4. Create a multi-domain 5-question test.
5. Answer some questions.
6. Refresh and verify draft recovery.
7. Complete and submit the attempt.
8. Wait for evaluation.
9. Open the report.
10. Open the attempt from history.
11. Change the Sheet and synchronize a new version.
12. Confirm the old attempt and report are unchanged.

### Acceptance checks

- The complete flow works in production.
- There are no known cross-user data leaks.
- Every external call has an error path.
- Every long operation has a visible state.
- Logs contain no secrets, full resumes, or unnecessary answer content.
- The MVP can be demonstrated without manually editing the database.

# Post-MVP: GitHub-Grounded Interviews

Do not start this section until Phase 9 is complete.

## Stage A: Public repository proof of concept

1. Accept one public GitHub repository URL.
2. Record repository, branch, and commit SHA.
3. Fetch the repository tree.
4. Ignore binaries, lockfiles, generated output, vendored code, and oversized files.
5. Store useful file content with path, language, and commit metadata.
6. Generate a deterministic repository summary.
7. Let the user state which parts they personally built.

Do not add private repository access yet.

## Stage B: Retrieval baseline

1. Split files by useful semantic boundaries where possible.
2. Store chunks with repository, commit, path, symbol, and line metadata.
3. Implement keyword and path-based retrieval first.
4. Create a small set of manually verified retrieval queries.
5. Measure whether expected files appear in the top results.

This establishes a baseline before embeddings.

## Stage C: Embeddings and hybrid retrieval

1. Add `pgvector` to the existing Neon database.
2. Generate embeddings for repository chunks.
3. Add semantic retrieval.
4. Combine semantic results with full-text or keyword results.
5. Compare keyword, vector, and hybrid retrieval.
6. Record retrieval hit rate, latency, and cost.

Adding embeddings without a comparison baseline is not meaningful engineering.

## Stage D: Grounded question generation

Every generated repository question must store:

- Question text
- Interview intent
- Tier
- Expected answer points
- Rubric
- Repository ID
- Commit SHA
- Source chunk IDs
- Source paths and symbols
- Suggested follow-up questions

Reject questions without supporting evidence.

## Stage E: Private GitHub connection

1. Create a GitHub App.
2. Request read-only repository metadata and contents.
3. Let users select specific repositories.
4. Store installation IDs, not permanent access tokens.
5. Add resync, disconnect, and delete controls.
6. Reindex only when the selected commit changes.

## Stage F: Adaptive project interview

1. Ask one grounded repository question.
2. Save the candidate's answer.
3. Retrieve evidence related to the answer and initial question.
4. Decide whether to probe, challenge, clarify, or change topic.
5. Ask one grounded follow-up.
6. Store the complete interview transcript.
7. Evaluate the interview using repository evidence and explicit rubrics.

This mode may use AI during the interview because AI is acting as the interviewer.
The fundamentals test remains non-interactive until submission.

## Post-MVP RAG quality gates

- Every question has traceable repository evidence.
- Retrieved evidence belongs to the indexed commit.
- The system can say that evidence is insufficient.
- Repository text is treated as untrusted data, not as model instructions.
- Users can delete indexed repository data.
- Retrieval quality is measured against manually verified cases.
- RAG quality is compared with a non-RAG baseline.

# Deliberate Exclusions

Do not add these before the MVP is complete:

- Video interviews
- Voice transcription
- Webcam proctoring
- Recruiter dashboards
- Organizations and teams
- Payments
- AI-generated question-bank content
- Private GitHub repository access
- Embeddings
- Agent frameworks
- Fine-tuning
- A separate vector database
- Complex admin roles
- Overdesigned landing pages

# Recommended Commit Sequence

Use small commits that reflect what you learned:

1. `fix foundation and verify auth flow`
2. `expand profile schema for onboarding`
3. `implement validated onboarding`
4. `add domain composition and question bank schema`
5. `seed and query cross-domain question bank`
6. `add validated manual sheets import`
7. `add idempotent daily sheets sync`
8. `add balanced domain allocation`
9. `create locked test sessions`
10. `persist test answers`
11. `submit immutable attempts`
12. `add objective AI evaluation`
13. `add personalized report interpretation`
14. `render evaluation reports`
15. `add attempt history`
16. `test and harden the MVP`

# Definition of MVP Complete

DevScreen is not an MVP merely because authentication and AI calls work.

It is complete only when:

- Google authentication works.
- Onboarding is persisted and protected.
- Google Sheets can publish a valid question-bank version.
- Invalid Sheet data cannot replace the active version.
- Composite domains expand correctly.
- Tests use balanced, locked questions from one bank version.
- Cross-domain questions cannot appear twice in one test.
- Shorter tests require user confirmation and preserve requested versus actual counts.
- Answers survive refreshes.
- Submitted attempts cannot be edited.
- Objective AI output is validated and scored without profile claims.
- Personalized interpretation is stored separately and cannot change the score.
- Reports can be reopened without rerunning AI.
- Attempt history works.
- Users cannot access each other's data.
- The complete flow works in production.

# Reference Documentation

- Google Sheets values API:
  <https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/get>
- Google Sheets value-reading guide:
  <https://developers.google.com/workspace/sheets/api/guides/values>
- Google Drive file version and modification metadata:
  <https://developers.google.com/workspace/drive/api/reference/rest/v3/files>
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
