# Career Intelligence Platform — Architecture v1.0

Author: Miguel Velandia  
Architect: CIP Lead Software Architect  
Pattern: Clean Architecture + Domain Driven Design  
Stack: Next.js 14 · TypeScript · PostgreSQL · Prisma · Google Gemini

---

## Vision Alignment

The platform's core philosophy is **"Knowledge First, Resume Second"**.  
This directly maps to Clean Architecture's dependency rule:  
the domain (knowledge) must never depend on infrastructure (documents/outputs).

---

## Tech Stack Decisions

### Next.js 14 (App Router) + TypeScript

For MVP, Next.js is the right call. Server Components reduce client JavaScript. API routes live in the same repo, reducing DevOps surface. TypeScript is non-negotiable for a SaaS — untyped code becomes a maintenance liability within months.

The API layer is designed to be extractable into a standalone service if we ever need to scale the AI generation independently. The repository pattern ensures this migration won't touch domain or application code.

### PostgreSQL + Prisma

Career data is highly relational. An Experience links to Projects. Projects link to PortfolioAssets. Stories link to Experiences. A relational database is the natural fit.

PostgreSQL supports native arrays (`String[]`), which we use for `technologies`, `skills`, and `achievements`. This avoids junction tables for simple reads, which matters for resume generation that needs a complete profile in one query.

Prisma gives us type-safe query generation from our schema, a migration system, and excellent TypeScript integration. We avoid raw SQL in application code.

### Google Gemini API (`gemini-2.5-flash`)

All AI features are routed through a single `GeminiClient` in the infrastructure layer. The model is one configuration value. Swapping models, tweaking prompts, or changing providers requires touching only the infrastructure layer.

We use Gemini 2.5 Flash — it has a free tier (no billing required), and balances quality and latency for document generation use cases like resume writing and cover letters. If quality needs ever outgrow Flash, swapping to `gemini-2.5-pro` or a different provider only touches `GeminiClient.ts`.

### Zod

Zod schemas in `src/lib/validators/` serve dual duty:
- **API routes**: validate incoming request bodies (format/structure)
- **Client forms**: via `@hookform/resolvers/zod` for UI validation

One schema definition, validated in two places. Adding a field constraint propagates automatically to both the API and the UI.

### NextAuth.js v5

Supports Google, GitHub, and email magic link out of the box. JWT sessions keep the auth layer stateless. The `userId` from session threads through every use case and repository — a user can never touch another user's data.

### Zustand + TanStack Query

TanStack Query owns **server state** (experiences, projects, skills — anything that lives in the database). Zustand owns **UI state** (modal open/closed, sidebar collapsed, active tab).

Never fight React's data model. Don't put server data in Zustand.

---

## DDD Bounded Contexts

```
┌──────────────────────────────────────────────────────────────┐
│  IDENTITY CONTEXT (Generic Domain)                           │
│  User · Subscription                                         │
└───────────────────────────┬──────────────────────────────────┘
                            │ foundation
        ┌───────────────────▼────────────────────┐
        │  CAREER CONTEXT (Core Domain)           │
        │  Experience · Project · Skill           │
        │  Story · Certification                  │
        │                                         │
        │  ← THE SOURCE OF TRUTH →                │
        └──────┬────────────────┬─────────────────┘
               │                │
     ┌─────────▼──────┐  ┌──────▼───────────────┐
     │ DOCUMENT       │  │ INTELLIGENCE          │
     │ CONTEXT        │  │ CONTEXT               │
     │ Resume         │  │ JobDescription        │
     │ CoverLetter    │  │ InterviewSession      │
     └─────────┬──────┘  └──────────────────────┘
               │
     ┌─────────▼──────┐
     │ PORTFOLIO      │
     │ CONTEXT        │
     │ PortfolioAsset │
     └────────────────┘
```

Each context is independent. A context's models are internal to that context. When cross-context data is needed, we pass primitive values (ids, DTOs) — never domain entity references across boundaries.

---

## Clean Architecture Layers

```
┌─────────────────────────────────────────────────┐
│  PRESENTATION                                   │
│  Next.js pages · React components · Hooks       │
│  TanStack Query · Zustand                        │
└──────────────────────┬──────────────────────────┘
                       │ depends on
┌──────────────────────▼──────────────────────────┐
│  APPLICATION                                    │
│  Use Cases (Commands + Queries)                 │
│  Depends only on domain abstractions            │
└──────────────────────┬──────────────────────────┘
                       │ depends on
┌──────────────────────▼──────────────────────────┐
│  DOMAIN                                         │
│  Entities · Value Objects · Repository Interfaces│
│  Pure TypeScript — ZERO external dependencies   │
└─────────────────────────────────────────────────┘
                       ▲
                       │ implements
┌──────────────────────┴──────────────────────────┐
│  INFRASTRUCTURE                                 │
│  Prisma Repositories · Gemini AI Client        │
│  Storage · External APIs                        │
└─────────────────────────────────────────────────┘
```

The critical rule: **arrows only point inward**. Domain never imports from infrastructure. Infrastructure imports from domain (to implement interfaces). This is the Dependency Inversion Principle.

---

## Folder Structure

```
cip/
├── prisma/
│   └── schema.prisma              # Database schema — one source of truth
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── experience/
│   │   │   ├── projects/
│   │   │   ├── skills/
│   │   │   ├── stories/
│   │   │   ├── resumes/
│   │   │   └── job-analyzer/
│   │   └── api/
│   │       ├── auth/[...nextauth]/
│   │       ├── experience/route.ts
│   │       ├── projects/route.ts
│   │       ├── skills/route.ts
│   │       ├── stories/route.ts
│   │       ├── resumes/route.ts
│   │       └── ai/
│   │           ├── generate-resume/route.ts
│   │           ├── cover-letter/route.ts
│   │           └── analyze-job/route.ts
│   │
│   ├── domain/                    # Pure TypeScript. Zero dependencies.
│   │   ├── shared/
│   │   │   ├── Entity.ts
│   │   │   ├── ValueObject.ts
│   │   │   └── Result.ts
│   │   ├── career/
│   │   │   ├── entities/
│   │   │   │   ├── Experience.ts  ← Implemented
│   │   │   │   ├── Project.ts
│   │   │   │   ├── Skill.ts
│   │   │   │   └── Story.ts
│   │   │   ├── value-objects/
│   │   │   │   └── DateRange.ts   ← Implemented
│   │   │   └── repositories/
│   │   │       ├── IExperienceRepository.ts ← Implemented
│   │   │       ├── IProjectRepository.ts
│   │   │       ├── ISkillRepository.ts
│   │   │       └── IStoryRepository.ts
│   │   ├── document/
│   │   │   ├── entities/
│   │   │   │   ├── Resume.ts
│   │   │   │   └── CoverLetter.ts
│   │   │   └── repositories/
│   │   └── intelligence/
│   │       ├── entities/
│   │       │   └── JobDescription.ts
│   │       └── services/
│   │           └── IJobAnalyzerService.ts
│   │
│   ├── application/               # Use cases only
│   │   ├── career/
│   │   │   ├── commands/
│   │   │   │   ├── CreateExperience.ts ← Implemented
│   │   │   │   ├── UpdateExperience.ts
│   │   │   │   ├── DeleteExperience.ts
│   │   │   │   ├── CreateProject.ts
│   │   │   │   ├── AddSkill.ts
│   │   │   │   └── CreateStory.ts
│   │   │   └── queries/
│   │   │       ├── GetExperiences.ts
│   │   │       └── GetExperienceById.ts
│   │   ├── document/
│   │   │   └── commands/
│   │   │       ├── GenerateResume.ts
│   │   │       └── GenerateCoverLetter.ts
│   │   └── intelligence/
│   │       └── commands/
│   │           └── AnalyzeJobDescription.ts
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── client.ts           ← Implemented
│   │   │   └── repositories/
│   │   │       ├── PrismaExperienceRepository.ts ← Implemented
│   │   │       ├── PrismaProjectRepository.ts
│   │   │       └── PrismaSkillRepository.ts
│   │   ├── ai/
│   │   │   ├── gemini/
│   │   │   │   ├── GeminiClient.ts
│   │   │   │   ├── ResumeGeneratorService.ts
│   │   │   │   ├── JobAnalyzerService.ts
│   │   │   │   └── InterviewCoachService.ts
│   │   │   └── prompts/
│   │   │       ├── resume.prompts.ts
│   │   │       ├── coverLetter.prompts.ts
│   │   │       └── jobAnalysis.prompts.ts
│   │   └── storage/
│   │       └── StorageService.ts
│   │
│   ├── presentation/
│   │   ├── components/
│   │   │   ├── ui/                # shadcn/ui primitives
│   │   │   ├── career/
│   │   │   │   ├── ExperienceCard.tsx
│   │   │   │   ├── ExperienceForm.tsx
│   │   │   │   └── SkillBadge.tsx
│   │   │   └── shared/
│   │   │       ├── PageHeader.tsx
│   │   │       └── EmptyState.tsx
│   │   └── hooks/
│   │       ├── useExperiences.ts
│   │       └── useSkills.ts
│   │
│   └── lib/
│       ├── auth.ts
│       ├── utils.ts
│       └── validators/
│           ├── experience.schema.ts ← Implemented
│           └── project.schema.ts
│
└── package.json                   ← Implemented
```

---

## Key Tradeoffs

**Monolith vs. Microservices**  
We build a well-structured monolith. Microservices add deployment complexity with zero benefit at MVP scale. Clean Architecture means individual contexts can be extracted into services later without rewriting business logic.

**Resume as JSON vs. String**  
Resume `content` is stored as `Json` in PostgreSQL, not a text blob. This means the same data can be rendered as PDF, HTML, plain text, or fed back to AI for refinement. Storing a rendered string locks you into one format forever.

**Denormalized skills on Experience**  
The `skills` field on `Experience` is `String[]`. This is intentional — resume generation reads the complete experience in one query without joining to the `Skill` table. The canonical skill definitions live in `Skill` for the Skills Database module.

**CQRS at application layer**  
Commands (create/update/delete) and Queries (read) are in separate files. This is lightweight CQRS — no event sourcing, no read models. It organizes code and makes each file's purpose obvious. The pattern scales into full CQRS if we ever need separate read databases.

**userId on every repository method**  
Every `findById`, `update`, and `delete` takes `userId` as a required parameter and includes it in the WHERE clause. This is a security decision. Even if a bug in a use case passes the wrong id, the database query still enforces ownership.

---

## MVP Build Order

1. **Foundation**: Prisma schema + migrations + Auth
2. **Experience CRUD**: Domain entity + Repository + Use cases + API routes + UI
3. **Project CRUD**: Same pattern as Experience
4. **Skills CRUD**: Simpler — no date range VO needed
5. **Story Bank**: STAR format forms + categorization
6. **Job Analyzer**: Gemini integration — analyze job description text
7. **Resume Generator**: Gemini integration — generate from Career Context data
8. **Dashboard**: Aggregate stats from all modules

Each step is independently deployable and testable.
