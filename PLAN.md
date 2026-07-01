# DevScreen Implementation Plan

This file tracks implementation only.

Read [ARCHITECTURE.md](./ARCHITECTURE.md) before changing schemas, relationships,
selection behavior, synchronization, or evaluation.

## Current progress

- Phase 0 is not verified.
- Phase 1 is in progress.
- Phase 2 was started early with an initial `domains` table.
- Phases 3 through 9 have not started.

# Phase 0: Verify the foundation

Goal: establish a clean baseline before adding product behavior.

## Tasks

- [x] Inspect all current uncommitted changes.
- [ ] Decide which homepage and database changes should remain.
- [ ] Remove or resolve commented-out experimental homepage code.
- [ ] Fix every lint error.
- [ ] Fix every TypeScript error.
- [ ] Produce a successful production build.
- [ ] Trace Google sign-in from the UI to Better Auth and back.
- [ ] Verify a first-time login creates one application profile.
- [ ] Verify a returning login does not create a duplicate profile.
- [ ] Verify sign-out returns to a signed-out state.
- [ ] Document the manual authentication test performed.

## Acceptance checks

- [ ] `pnpm lint` passes.
- [ ] `pnpm build` passes.
- [ ] Google sign-in works.
- [ ] Google sign-out works.
- [ ] A new user creates exactly one profile.
- [ ] A returning user reuses the existing profile.
- [ ] The browser and server responsibilities can be explained without reading code.

- [ ] **Phase 0 complete**

# Phase 1: Build onboarding

Goal: persist the minimum user context needed for later personalization.

Current status:

- The generated internal profile ID has been replaced with the Better Auth user
  identity as the profile key.
- Technology and profile-technology schemas are being implemented.
- Phase acceptance has not been verified.

## Schema tasks

- [ ] Choose and document the exact experience-level values.
- [x] Use the Better Auth user ID as the profile primary and foreign key.
- [ ] Rename the profile key consistently to `userId`.
- [ ] Remove duplicated username and email from the application profile.
- [ ] Remove obsolete course and semester fields.
- [ ] Add `experienceLevel`.
- [ ] Add optional `about`.
- [ ] Add optional `otherTechnologies`.
- [ ] Keep `onboardingCompleted` for the MVP.
- [ ] Add `updatedAt`.
- [ ] Add the `technologies` table.
- [ ] Add a unique constraint on technology name.
- [ ] Add the `profileTechnologies` join table.
- [ ] Make both join-table foreign keys non-null.
- [ ] Add composite primary key `(userId, technologyId)`.
- [ ] Generate and inspect the migration.
- [ ] Apply the migration locally.

## Data and form tasks

- [ ] Seed a curated technology list.
- [ ] Define the onboarding Zod schema before building submission logic.
- [ ] Build the experience-level input.
- [ ] Build searchable technology multi-select.
- [ ] Render selected technologies as removable values.
- [ ] Build the Other technologies input.
- [ ] Build the About input.
- [ ] Load existing values for returning users.
- [ ] Derive `userId` from the server session.
- [ ] Reject submitted user IDs from the client.
- [ ] Validate that every selected technology exists.
- [ ] Save profile fields and technology relationships in one transaction.
- [ ] Set `onboardingCompleted` only after persistence succeeds.
- [ ] Show validation and database failures to the user.

## Routing tasks

- [ ] Redirect incomplete authenticated users to onboarding.
- [ ] Redirect completed users away from onboarding.
- [ ] Keep public pages accessible without onboarding.
- [ ] Send completed users to the dashboard or next valid route.

## Acceptance checks

- [ ] Invalid experience levels are rejected.
- [ ] Unknown technology IDs are rejected.
- [ ] Duplicate technology relationships cannot be stored.
- [ ] A user cannot update another user's profile.
- [ ] Better Auth remains the source of name and email.
- [ ] Saved onboarding values survive refresh.
- [ ] Completed users are not trapped in onboarding.
- [ ] A failed transaction does not leave partial profile relationships.

- [ ] **Phase 1 complete**

# Phase 2: Build the local question-bank model

Goal: model and query the complete question bank without Google Sheets.

Current status:

- The first `domains` table has been started.
- The complete phase is not implemented.

## Schema tasks

- [ ] Finish the `domains` table.
- [ ] Add a unique constraint on domain name.
- [ ] Add the `domainComponents` table.
- [ ] Add composite primary key `(parentDomainId, componentDomainId)`.
- [ ] Reject self-referential components.
- [ ] Add validation that rejects composite-domain cycles.
- [ ] Define tier values once.
- [ ] Define question-type values once.
- [ ] Add `questionBankVersions`.
- [ ] Add `questions`.
- [ ] Give every question one non-null primary domain.
- [ ] Add `questionDomains` for additional domains.
- [ ] Prevent the primary domain from being repeated as additional.
- [ ] Add `sheetSyncRuns`.
- [ ] Add required foreign keys and delete behavior.
- [ ] Add the indexes listed in `ARCHITECTURE.md`.
- [ ] Generate and inspect the migration.
- [ ] Apply the migration locally.

## Seed and query tasks

- [ ] Seed Frontend.
- [ ] Seed Backend.
- [ ] Seed Full Stack.
- [ ] Configure Full Stack to include Frontend and Backend.
- [ ] Seed at least 18 questions.
- [ ] Include all three tiers.
- [ ] Include at least three question types.
- [ ] Include one cross-domain question.
- [ ] Query by active bank version.
- [ ] Query by primary and additional domain membership.
- [ ] Query by tier.
- [ ] Query by question type.

## Acceptance checks

- [ ] Full Stack expands to Full Stack, Frontend, and Backend.
- [ ] Composite expansion has no duplicates.
- [ ] Composite-domain cycles are rejected.
- [ ] Every question has exactly one primary domain.
- [ ] Additional domains cannot repeat the primary domain.
- [ ] Duplicate external IDs are rejected within one bank version.
- [ ] Old bank versions can coexist with the active version.
- [ ] Invalid tiers and question types cannot be stored.
- [ ] Every question has a usable rubric.
- [ ] Every schema constraint and index can be explained.

- [ ] **Phase 2 complete**

# Phase 3: Build manual Google Sheets import

Goal: import one complete validated question-bank version manually.

## Google configuration

- [ ] Create the `Questions` Sheet using the architecture contract.
- [ ] Create a Google Cloud service account.
- [ ] Share only the required Sheet with the service account.
- [ ] Grant read-only access.
- [ ] Store credentials only in server environment variables.

## Import pipeline

- [ ] Fetch the configured Sheet range.
- [ ] Convert rows into named objects.
- [ ] Normalize whitespace.
- [ ] Normalize booleans.
- [ ] Normalize enum casing.
- [ ] Parse additional-domain lists.
- [ ] Validate every row with Zod.
- [ ] Reject unknown domains.
- [ ] Reject duplicate external IDs.
- [ ] Reject a primary domain repeated as additional.
- [ ] Calculate a deterministic dataset checksum.
- [ ] Add a protected manual synchronization action.
- [ ] Import a complete version in one transaction.
- [ ] Activate the version only after complete success.
- [ ] Record inserted rows and validation errors.

## Acceptance checks

- [ ] A valid Sheet creates one active bank version.
- [ ] An unchanged Sheet creates no version.
- [ ] One invalid row rejects the proposed version.
- [ ] A failed import preserves the previous active version.
- [ ] Previous test data remains unchanged.
- [ ] Credentials never appear in browser code or logs.

- [ ] **Phase 3 complete**

# Phase 4: Automate daily synchronization

Goal: run the proven import process safely every 24 hours.

## Tasks

- [ ] Extract one synchronization service shared by manual and scheduled calls.
- [ ] Choose the deployment platform and scheduler.
- [ ] Protect the scheduled endpoint with a secret.
- [ ] Configure a daily schedule.
- [ ] Prevent concurrent imports.
- [ ] Record the start and result of every run.
- [ ] Compare the normalized checksum with the latest successful version.
- [ ] Skip unchanged datasets.
- [ ] Publish changed versions atomically.
- [ ] Preserve the previous version on every failure.
- [ ] Add retry-safe behavior.
- [ ] Add an internal view for last success and last failure.
- [ ] Keep manual synchronization for development and recovery.

## Acceptance checks

- [ ] Repeated calls are idempotent.
- [ ] Concurrent calls cannot create two active versions.
- [ ] An unchanged Sheet performs no import.
- [ ] API failure does not change the active version.
- [ ] Validation failure does not change the active version.
- [ ] Every run can be diagnosed from stored synchronization data.

- [ ] **Phase 4 complete**

# Phase 5: Create balanced locked tests

Goal: create reproducible tests from one immutable question-bank version.

## Schema tasks

- [ ] Add `testSessions`.
- [ ] Store requested and actual question counts.
- [ ] Add `testSessionDomains`.
- [ ] Store requested versus expanded domain kind.
- [ ] Store target and actual counts per domain.
- [ ] Add `testSessionQuestions`.
- [ ] Store question position.
- [ ] Store allocated domain.
- [ ] Add unique session-position constraint.
- [ ] Add unique session-question constraint.

## Configuration tasks

- [ ] Build multi-domain selection.
- [ ] Build tier selection.
- [ ] Support counts 5, 10, 15, 20, 25, and 30.
- [ ] Validate the complete configuration on the server.

## Selection tasks

- [ ] Expand composite domains.
- [ ] Deduplicate effective domains.
- [ ] Calculate equal base allocation.
- [ ] Apply deterministic remainder priority.
- [ ] Load eligible questions from the active version.
- [ ] Reserve primary-domain questions when their primary domain is effective.
- [ ] Use additional-domain eligibility according to architecture rules.
- [ ] Exclude already selected question IDs from later buckets.
- [ ] Calculate shortages per domain.
- [ ] Show the proposed shorter test when shortages exist.
- [ ] Require explicit confirmation before shortening.
- [ ] Randomize questions inside each allocation bucket.
- [ ] Create the session and all locked rows in one transaction.

## Acceptance checks

- [ ] Frontend plus Backend receives balanced allocation.
- [ ] Full Stack expands into three effective domains.
- [ ] Remainders follow the documented priority.
- [ ] A cross-domain question appears at most once.
- [ ] Every question records its allocation bucket.
- [ ] Shortages are not redistributed.
- [ ] A shorter test requires confirmation.
- [ ] Requested and actual counts are preserved.
- [ ] Refreshing does not change questions or order.
- [ ] A later Sheet synchronization does not alter the session.
- [ ] A user cannot open another user's session.

- [ ] **Phase 5 complete**

# Phase 6: Build the answering experience

Goal: persist answers safely and make submission immutable.

## Tasks

- [ ] Add the `answers` table and constraints.
- [ ] Create the session-question route.
- [ ] Show one question at a time.
- [ ] Show position and progress.
- [ ] Ask for answer, assumptions, approach, and tradeoffs.
- [ ] Add previous navigation.
- [ ] Add next navigation.
- [ ] Save before navigation.
- [ ] Restore answers on revisit and refresh.
- [ ] Add unanswered-question review.
- [ ] Add final submission confirmation.
- [ ] Mark submission on the server.
- [ ] Prevent editing after submission.
- [ ] Make submission idempotent.

## Acceptance checks

- [ ] Draft answers survive navigation.
- [ ] Draft answers survive refresh.
- [ ] Navigation cannot escape the session.
- [ ] Progress comes from stored state.
- [ ] Double submission creates no duplicate transition.
- [ ] Submitted answers cannot be changed through direct requests.
- [ ] Empty-answer behavior is documented and verified.

- [ ] **Phase 6 complete**

# Phase 7: Build two-stage AI evaluation

Goal: score answers objectively, then personalize interpretation separately.

## Objective evaluation

- [ ] Define the Stage 1 Zod schema.
- [ ] Version the objective prompt.
- [ ] Exclude profile claims from Stage 1.
- [ ] Include domains, tier, questions, answers, rubrics, and maximum points.
- [ ] Request per-question awarded points.
- [ ] Request correct, missing, and incorrect claims.
- [ ] Request reasoning-quality feedback.
- [ ] Validate every question ID.
- [ ] Validate every awarded score.
- [ ] Calculate the overall score on the server.
- [ ] Store the objective model and prompt version.
- [ ] Persist objective results before personalization.

## Personalized interpretation

- [ ] Define the Stage 2 Zod schema.
- [ ] Version the personalization prompt.
- [ ] Provide only validated Stage 1 results as scoring evidence.
- [ ] Add experience level and claimed technologies as context.
- [ ] Request readiness interpretation.
- [ ] Request claim-versus-demonstration observations.
- [ ] Request skill-coverage results.
- [ ] Require coverage evidence through question IDs.
- [ ] Prevent Stage 2 from changing points or overall score.
- [ ] Store the personalization model and prompt version.

## Reliability

- [ ] Add objective-evaluation states.
- [ ] Add personalization states.
- [ ] Make each stage retry-safe.
- [ ] Preserve objective results when personalization fails.
- [ ] Never rerun a successful stage when opening a report.

## Acceptance checks

- [ ] Malformed output from either stage is rejected.
- [ ] Out-of-range points are rejected.
- [ ] Overall score is deterministic from validated points.
- [ ] Profile claims cannot affect objective scoring.
- [ ] Skill coverage cites evidence or reports no coverage.
- [ ] Personalization failure preserves objective results.
- [ ] Retries do not create duplicate reports.
- [ ] Evaluation failure never loses submitted answers.

- [ ] **Phase 7 complete**

# Phase 8: Build reports and attempt history

Goal: expose stored evaluation data as a useful product.

## Report tasks

- [ ] Build report detail route with ownership checks.
- [ ] Show objective score and readiness verdict first.
- [ ] Show domain coverage.
- [ ] Show strengths and weaknesses.
- [ ] Show per-question points and feedback.
- [ ] Show claim-versus-demonstration observations.
- [ ] Show requested-skill coverage.
- [ ] Show a concrete study plan.
- [ ] Show recommended next test.

## History tasks

- [ ] Build attempt-history dashboard.
- [ ] Show requested domains.
- [ ] Show tier.
- [ ] Show requested and actual counts.
- [ ] Show score, status, and date.
- [ ] Link completed attempts to reports.
- [ ] Link in-progress attempts to the next unanswered question.
- [ ] Add evaluation retry for valid failure states.
- [ ] Add empty, loading, and failure states.

## Acceptance checks

- [ ] Users can only view their own attempts and reports.
- [ ] Every session status is represented correctly.
- [ ] Reports explain why points were awarded.
- [ ] In-progress attempts can be resumed.
- [ ] Old reports remain unchanged after prompt or Sheet updates.
- [ ] Opening a report performs no AI call.

- [ ] **Phase 8 complete**

# Phase 9: Test and harden the MVP

Goal: verify the complete production workflow.

## Automated tests

- [ ] Sheet row normalization.
- [ ] Sheet dataset validation.
- [ ] Duplicate external-ID detection.
- [ ] Checksum stability.
- [ ] Composite-domain expansion.
- [ ] Composite-domain cycle rejection.
- [ ] Balanced allocation.
- [ ] Remainder handling.
- [ ] Cross-domain question deduplication.
- [ ] Strict shortage calculation.
- [ ] Random selection uniqueness.
- [ ] Score calculation.
- [ ] Objective-output validation.
- [ ] Personalization-output validation.
- [ ] Session ownership.
- [ ] Submitted-session immutability.

## Manual production test

- [ ] Sign in with a new Google account.
- [ ] Complete onboarding.
- [ ] Synchronize a valid Sheet.
- [ ] Create a multi-domain test.
- [ ] Answer some questions.
- [ ] Refresh and verify draft recovery.
- [ ] Complete and submit the attempt.
- [ ] Complete objective evaluation.
- [ ] Complete personalized interpretation.
- [ ] Open the report.
- [ ] Open the attempt from history.
- [ ] Synchronize a changed Sheet version.
- [ ] Confirm the old attempt and report are unchanged.
- [ ] Attempt cross-user access and confirm rejection.

## Acceptance checks

- [ ] The complete flow works in production.
- [ ] No known cross-user data leak exists.
- [ ] Every external call has a tested failure path.
- [ ] Every long operation has a visible state.
- [ ] Logs contain no secrets or unnecessary personal content.
- [ ] The MVP can be demonstrated without manual database edits.

- [ ] **Phase 9 complete**

# Post-MVP: GitHub-grounded interviews

Do not start until Phase 9 is complete.

## Stage A: Public repository ingestion

- [ ] Accept one public repository URL.
- [ ] Record repository, branch, and commit SHA.
- [ ] Fetch the repository tree.
- [ ] Filter generated, binary, vendored, secret, and oversized files.
- [ ] Store useful content with path, language, symbol, and line metadata.
- [ ] Generate a deterministic repository summary.
- [ ] Let the user identify their contributions.

- [ ] **Stage A complete**

## Stage B: Retrieval baseline

- [ ] Chunk files on useful semantic boundaries.
- [ ] Implement keyword and path retrieval.
- [ ] Create manually verified retrieval queries.
- [ ] Measure whether expected evidence appears in top results.

- [ ] **Stage B complete**

## Stage C: Embeddings and hybrid retrieval

- [ ] Add pgvector to Neon.
- [ ] Generate embeddings for repository chunks.
- [ ] Add semantic retrieval.
- [ ] Combine keyword and semantic results.
- [ ] Compare keyword, vector, and hybrid retrieval.
- [ ] Record hit rate, latency, and cost.

- [ ] **Stage C complete**

## Stage D: Grounded questions

- [ ] Generate questions from retrieved evidence.
- [ ] Store repository and commit identity.
- [ ] Store source chunk IDs.
- [ ] Store source paths and symbols.
- [ ] Store rubrics and expected points.
- [ ] Reject questions without evidence.

- [ ] **Stage D complete**

## Stage E: Private GitHub access

- [ ] Create a GitHub App.
- [ ] Request read-only metadata and contents.
- [ ] Let users select repositories.
- [ ] Store installation IDs, not permanent access tokens.
- [ ] Add resync.
- [ ] Add disconnect.
- [ ] Add indexed-data deletion.
- [ ] Reindex only when the commit changes.

- [ ] **Stage E complete**

## Stage F: Adaptive project interviews

- [ ] Ask one grounded repository question.
- [ ] Save the answer.
- [ ] Retrieve related evidence.
- [ ] Decide whether to probe, challenge, clarify, or change subject.
- [ ] Ask one grounded follow-up.
- [ ] Store the complete transcript.
- [ ] Evaluate against repository evidence and rubrics.

- [ ] **Stage F complete**

# Recommended commit sequence

- [ ] `fix foundation and verify auth flow`
- [ ] `expand profile schema for onboarding`
- [ ] `implement validated onboarding`
- [ ] `add domain composition and question bank schema`
- [ ] `seed and query cross-domain question bank`
- [ ] `add validated manual sheets import`
- [ ] `add idempotent daily sheets sync`
- [ ] `add balanced domain allocation`
- [ ] `create locked test sessions`
- [ ] `persist test answers`
- [ ] `submit immutable attempts`
- [ ] `add objective AI evaluation`
- [ ] `add personalized report interpretation`
- [ ] `render evaluation reports`
- [ ] `add attempt history`
- [ ] `test and harden the MVP`

# MVP completion gate

- [ ] Google authentication works.
- [ ] Onboarding is persisted and protected.
- [ ] Google Sheets publishes a valid versioned question bank.
- [ ] Invalid Sheet data cannot replace the active version.
- [ ] Composite domains expand correctly.
- [ ] Tests are balanced, unique, locked, and versioned.
- [ ] Short tests require explicit confirmation.
- [ ] Draft answers survive refresh.
- [ ] Submitted attempts are immutable.
- [ ] Objective evaluation excludes profile claims.
- [ ] Personalized interpretation cannot change the score.
- [ ] Reports reopen without AI calls.
- [ ] Attempt history works.
- [ ] Cross-user access is rejected.
- [ ] The complete flow works in production.

- [ ] **DevScreen MVP complete**
