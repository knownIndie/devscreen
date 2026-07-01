# DevScreen

DevScreen is an interview-readiness application that creates structured tests
from a curated question bank and evaluates completed attempts with AI.

## Current status

The repository currently contains:

- Next.js, TypeScript, Tailwind, and shadcn setup
- Better Auth with Google sign-in
- Neon Postgres and Drizzle
- Automatic application-profile creation
- Placeholder onboarding and homepage UI

The core interview flow has not been built yet.

## MVP

The first MVP will:

1. Onboard an authenticated user.
2. Synchronize curated questions from Google Sheets into a versioned Postgres
   question bank.
3. Create a balanced, locked test by domains, tier, and question count.
4. Save answers one question at a time.
5. Evaluate the submitted attempt without profile claims affecting its score.
6. Add personalized interpretation without changing the objective score.
7. Store a report and show attempt history.

Google Sheets is an editorial source, not the runtime application database.

## Development plan

The product architecture, data relationships, selection rules, synchronization
design, and evaluation boundaries are in [ARCHITECTURE.md](./ARCHITECTURE.md).

The stage-by-stage implementation checklist is in [PLAN.md](./PLAN.md).

The locked product decisions and fresh-conversation restart scripts are in
[CONVERSATION_CONTEXT.md](./CONVERSATION_CONTEXT.md).

Start with Phase 0 and do not skip acceptance checks.
