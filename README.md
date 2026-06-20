# DevScreen MVP Work Plan

DevScreen should become a structured interview-readiness product, not a random AI question generator.

Correct product shape:

- Curated question bank
- AI-assisted question tagging and classification
- Tiered test generation
- Controlled user answer flow
- Full-attempt AI evaluation
- Final report with scores, gaps, and readiness verdict
- Attempt history dashboard

Current state is still early. The app has auth, database wiring, a basic profile table, and placeholder pages. The core product flow does not exist yet.

## Project Monitoring

Use the interactive [DevScreen MVP Work Tracker](./work-plan.html) to monitor implementation progress. Each phase includes acceptance checks and example evidence required before it can be marked complete.

## Brutal Scope Rules

Do not build these for MVP:

- Video proctoring
- Recruiter dashboards
- Heavy anti-cheat systems
- Live AI hints during tests
- Model answers during tests
- Overdesigned landing pages

For v1, use an honor-based test mode. The value is the feedback report, not surveillance.

## Target MVP

The MVP is complete when this flow works end to end:

1. User signs in.
2. User completes a real profile.
3. Admin imports questions from CSV.
4. AI classifies imported questions by category, tags, tier, and difficulty.
5. User selects category, tier, role, and question count.
6. System creates a locked randomized test attempt.
7. User answers questions one at a time in a text box.
8. User submits the full attempt.
9. AI evaluates the complete attempt.
10. User sees a detailed report.
11. Dashboard shows previous attempts and scores.

## Day-by-Day Plan

### Day 1: Clean The Foundation

Goal: make the current skeleton stable before adding product logic.

Tasks:

- Fix lint/format issues.
- Confirm `pnpm lint` passes.
- Confirm `pnpm build` passes.
- Clean up unused imports and placeholder code.
- Verify Better Auth login still works.
- Verify profile auto-creation still works after signup.
- Keep the current shadcn setup. Do not introduce a parallel UI system.

Done when:

- The repo has a clean lint result.
- The app starts locally.
- Login still creates a profile row.

### Day 2: Build The Real Profile Model

Goal: replace the weak profile with fields that actually help AI evaluation.

Tasks:

- Expand the `profiles` table.
- Add fields:
  - `education`
  - `background`
  - `targetRole`
  - `techStack`
  - `experienceLevel`
  - `resumeText`
  - `about`
  - `onboardingCompleted`
- Generate and apply a Drizzle migration.
- Build the onboarding form.
- Redirect signed-in users without a completed profile to onboarding.
- Save onboarding data to the database.

Done when:

- A new user can sign in and complete onboarding.
- The saved profile is available for later evaluation prompts.

### Day 3: Add The Core Question Bank Schema

Goal: create the database backbone for curated tests.

Tasks:

- Add `categories` table.
- Add `questions` table.
- Add `questionTags` table.
- Add `questionToTags` join table if tags are normalized.
- Question fields should include:
  - `text`
  - `categoryId`
  - `tier`
  - `difficulty`
  - `expectedPoints`
  - `source`
  - `active`
  - `createdAt`
  - `updatedAt`
- Add enums or constrained values for:
  - tier: `beginner`, `intermediate`, `advanced`
  - difficulty: simple numeric or text scale
- Generate and apply migration.

Done when:

- The database can store categorized, tiered, active/inactive questions.
- Questions are no longer imagined as AI-generated runtime content.

### Day 4: Add Admin CSV Import

Goal: get seed questions into the app quickly.

Tasks:

- Create an admin-only import route/page.
- Support CSV upload.
- Parse fields:
  - question text
  - category
  - tier
  - difficulty
  - expected points
  - source
  - tags
- Insert categories if missing.
- Insert tags if missing.
- Insert questions.
- Show import result:
  - inserted count
  - skipped count
  - validation errors
- Keep Google Sheets out of this day unless CSV is already working.

Done when:

- Admin can import at least 30-50 questions from a CSV file.
- Imported questions appear in the database with category and tier.

### Day 5: Add AI Question Classification

Goal: let AI assist curation, not replace it.

Tasks:

- Add a server-side AI classification function.
- Input:
  - question text
  - optional source category/tags
- Output structured JSON:
  - category
  - tags
  - tier
  - difficulty
  - expected points
- Validate AI output with Zod.
- Save classification back to the question records.
- Add manual override support in the admin UI.

Done when:

- Admin can import raw questions and classify them with AI.
- Bad AI output does not corrupt the database.

### Day 6: Build Test Configuration Flow

Goal: let users create a test from the curated bank.

Tasks:

- Add `testSessions` table.
- Add `testSessionQuestions` table.
- Add fields:
  - `userId`
  - `categoryId`
  - `tier`
  - `role`
  - `questionCount`
  - `status`
  - `startedAt`
  - `submittedAt`
- Build test start page.
- User selects:
  - category/topic
  - tier
  - length: 10, 20, or 30 questions
  - role: frontend, backend, full-stack, AI, AWS, Salesforce, etc.
- System pulls active questions matching category/tier.
- Randomize order.
- Lock selected questions into `testSessionQuestions`.

Done when:

- A signed-in user can create a locked test attempt.
- Refreshing the page does not regenerate different questions.

### Day 7: Build Controlled Answering UI

Goal: build the actual test-taking experience.

Tasks:

- Add `answers` table.
- Show one question at a time.
- Provide only:
  - question text
  - answer text box
  - previous/next controls
  - progress indicator
  - submit button
- Do not show hints.
- Do not show model answers.
- Do not call AI during the test.
- Save answers as drafts while moving between questions.
- Prevent edits after final submission.

Done when:

- User can answer all questions in a locked session.
- Submitted attempts become read-only.

### Day 8: Build AI Evaluation Pipeline

Goal: create the product's main value.

Tasks:

- Add `evaluationReports` table.
- Compile one evaluation document containing:
  - user profile
  - test metadata
  - question list
  - user answers
  - expected points
  - tier and role
- Send the full attempt to AI after submission.
- Require structured JSON output:
  - overall score
  - tier-readiness score
  - verdict
  - per-question feedback
  - strong areas
  - weak areas
  - incorrect assumptions
  - communication clarity
  - topic-wise weakness
  - study plan
  - interviewer notes
  - recommended next test
- Validate with Zod before saving.

Done when:

- Submitting a test creates one stored evaluation report.
- The report can be fetched later without re-running AI.

### Day 9: Build Report Screen

Goal: make the AI evaluation useful to a learner.

Tasks:

- Create report detail page.
- Show:
  - overall score
  - tier
  - readiness verdict
  - strong areas
  - weak areas
  - per-question feedback
  - recommended next steps
  - study plan
- Use clear visual hierarchy.
- Avoid marketing copy.
- Make the report easy to scan.

Done when:

- User can understand exactly why they scored the way they did.
- The report clearly says whether the user is ready for the selected tier.

### Day 10: Build Attempt Dashboard

Goal: make DevScreen feel like a product, not a one-off form.

Tasks:

- Create user dashboard.
- Show previous attempts.
- Include:
  - category
  - tier
  - role
  - score
  - verdict
  - submitted date
  - link to report
- Add empty states.
- Add resume link for in-progress attempts.
- Add retake action.

Done when:

- User can see their test history and open old reports.

### Day 11: Add Admin Review Tools

Goal: keep question quality under control.

Tasks:

- Build question list page.
- Filter by:
  - category
  - tier
  - active/inactive
  - tag
- Add edit form for question metadata.
- Add active/inactive toggle.
- Add basic delete or archive behavior.
- Add manual tag/category correction.

Done when:

- Admin can fix bad imports or AI classifications without touching the database manually.

### Day 12: Demo Hardening

Goal: make the MVP demoable and less fragile.

Tasks:

- Seed enough questions for at least one full role/category path.
- Add loading states.
- Add error states.
- Add authorization checks.
- Prevent users from accessing other users' attempts.
- Test the full flow:
  - signup
  - onboarding
  - start test
  - answer questions
  - submit
  - generate report
  - view dashboard
- Fix obvious UX issues.

Done when:

- The full MVP can be demoed without explaining missing core steps.

## Recommended Build Order

Build in this order:

1. Database schema
2. Onboarding/profile
3. Question import
4. AI classification
5. Test session generation
6. Answering flow
7. AI evaluation
8. Report screen
9. Dashboard
10. Admin cleanup tools

Do not start with the homepage. The homepage will not save a product that cannot run a test.

## Minimum Tables

Required:

- `user`
- `profiles`
- `categories`
- `questions`
- `questionTags`
- `questionToTags`
- `testSessions`
- `testSessionQuestions`
- `answers`
- `evaluationReports`

Optional later:

- `testTemplates`
- `roles`
- `studyRecommendations`
- `adminAuditLogs`

## MVP Acceptance Criteria

DevScreen is MVP-ready only when all of these are true:

- A new user can sign in.
- A new user can complete onboarding.
- Admin can import questions.
- Questions are stored in the database.
- Questions have category, tier, difficulty, and tags.
- User can create a test from stored questions.
- Test questions are locked once the attempt starts.
- User answers inside the app.
- AI evaluates only after final submission.
- Evaluation report is stored.
- User can view old attempts and scores.

If any of those are missing, the product is not yet the correct shape.
