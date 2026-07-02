# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project layout

The actual Next.js app lives in `cip/` — run every command below from that directory, not the repo root. The root's `package-lock.json` is an empty stub; ignore it.

## Commands

```
npm run dev          # dev server, localhost:3000
npm run build         # production build
npm run typecheck    # tsc --noEmit — run after any non-trivial change
npm run lint          # next lint
npm run db:generate  # npx prisma generate — regenerate client after schema.prisma changes
npm run db:push       # npx prisma db push — sync schema to DB (no migrations/ dir in this repo)
npm run db:studio    # npx prisma studio — visual DB browser
npm run db:seed       # tsx prisma/seed.ts
```

There is no test framework configured (no `*.test.*`/`*.spec.*` files, no jest/vitest/playwright config). Don't assume one exists or invent test commands.

## Required local environment

Two external services are needed beyond `npm run dev`:

1. **PostgreSQL** (Supabase in practice) — `DATABASE_URL`.
2. **AI Core** — a separate local-first AI platform (its own repo, not part of this codebase) that every AI feature calls over HTTP. It is *not* started by `npm run dev`; it must be run independently (`uvicorn app.main:app --reload --port 8001` from AI Core's `backend/`, after `docker compose up -d` for its Postgres/Chroma and `alembic upgrade head`). Configure `AI_CORE_BASE_URL` / `AI_CORE_API_KEY` in `.env`. Without it, every AI-backed route (resume generation, job analyzer, interview coach, CV import) throws — there is no direct-to-Gemini fallback, despite the client file being named `GeminiClient.ts`.

Full onboarding steps (in Spanish) are in `cip/SETUP.md`.

## Architecture

Clean Architecture + DDD in a single Next.js monolith (`cip/ARCHITECTURE.md` has the full rationale and tradeoffs — read it before making structural changes). The dependency rule: arrows point inward only. Domain has zero external imports; infrastructure implements domain-defined interfaces; application orchestrates; presentation depends on application.

```
src/
  domain/<context>/{entities,value-objects,repositories}/  pure TS, Result-based validation, zero deps
  application/<context>/{commands,queries}/                 use cases — one class, one execute() method
  infrastructure/
    database/repositories/Prisma*Repository.ts              implements the domain repo interfaces
    ai/gemini/*Service.ts                                    AI feature services — actually call AI Core, not Gemini, via GeminiClient.ts
    ai/prompts/*.prompts.ts                                  prompt builders, kept separate from the services that use them
    parsing/                                                 CV import: pdf/docx text extraction
    document/ResumeDocumentRenderer.ts                       renders Resume.content (stored as JSON) to PDF/docx
  app/                                                        Next.js App Router: (auth)/(dashboard) route groups + api/
  components/, hooks/, lib/                                   presentation layer
```

`ARCHITECTURE.md`'s proposed tree nests presentation code under `src/presentation/{components,hooks}`; the actual code puts them at `src/components` and `src/hooks` instead. Follow what's on disk, not the doc, for new files.

### Bounded contexts

- **Identity** — User, auth, profile text (`aboutMe`/`elevatorPitch`)
- **Career** (source of truth) — Experience, Project, Skill, Story, Certification
- **Document** — Resume, CoverLetter. `content` is stored as `Json`, never a rendered string, so the same data can be re-rendered as PDF/HTML/plain text without calling AI again
- **Intelligence** — JobDescription, InterviewSession. AI analysis that consumes Career context data as input
- **Portfolio** — PortfolioAsset

Cross-context references pass primitive ids/DTOs only, never domain entities.

### Conventions when extending the code

- **`Result<T, E>`** (`src/domain/shared/Result.ts`) instead of thrown exceptions for anything in domain/application code that can fail. Callers must check `result.ok` before using `result.value`.
- **Every repository method takes `userId`** and scopes its query by it — this is the ownership/security boundary, not a convenience parameter. A use case bug that passes the wrong id still can't leak another user's row. Don't add a method that skips this.
- **API route pattern** (see `src/app/api/experience/route.ts`): (1) `getServerSession(authOptions)` → 401 if missing; (2) Zod `safeParse` the body → 400 on failure; (3) manually wire `new PrismaXRepository()` into `new XUseCase(repo)` (no DI container — this is deliberate for MVP scale); (4) map `result.ok` → 422/201 and hand-map the domain entity to a plain response object. Never `NextResponse.json(entity)` a domain entity directly.
- **Zod schemas** in `src/lib/validators/` are shared between API request validation and client forms (via `@hookform/resolvers/zod`) — update one schema, not two.
- **AI services** (`src/infrastructure/ai/gemini/*Service.ts`) all funnel through `geminiComplete()` in `GeminiClient.ts`. Model responses come back as markdown-fenced JSON and must be stripped/parsed defensively (see `JobAnalyzerService.parseResponse`) — follow that pattern for new AI calls rather than assuming clean JSON.
- **Denormalized arrays**: `Experience.skills`/`technologies`/etc. are Postgres `String[]`, intentionally not normalized into join tables, so resume generation can read a complete experience in one query. The canonical `Skill` records still live in the `Skill` table for the Skills Database module. Don't "fix" this without checking `ARCHITECTURE.md`'s tradeoffs section.
- **Auth is JWT-only**, no `PrismaAdapter`/session table (see the comment block in `src/lib/auth.ts` for why) — there is no server-side session invalidation.
- **i18n (`next-intl`)** resolves locale from a cookie (`src/i18n/request.ts`), not a `[locale]` URL segment — routes stay under `(auth)`/`(dashboard)`/`api` unchanged. Messages live one JSON file per namespace under `messages/<locale>/`, loaded via `fs.readFileSync` (not the module graph), and are cached only in production so dev picks up namespace edits without a restart.

## Deployment

Vercel. `vercel.json` sets `maxDuration: 60` on the AI-backed routes (resume generate, job-analyzer, import, evaluate-answer) since AI Core calls run long. AI Core itself has no public hosting story yet, so production AI features are effectively local-dev-only until that's resolved (`cip/SETUP.md`, Paso 7 and 11.2).
