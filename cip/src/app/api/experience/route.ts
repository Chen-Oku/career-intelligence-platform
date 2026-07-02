import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CreateExperienceUseCase } from "@/application/career/commands/CreateExperience";
import { ClearAllExperiencesUseCase } from "@/application/career/commands/ClearAllExperiences";
import { PrismaExperienceRepository } from "@/infrastructure/database/repositories/PrismaExperienceRepository";
import { createExperienceSchema } from "@/lib/validators/experience.schema";

/**
 * GET /api/experience
 * Returns all experiences for the authenticated user.
 */
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const repository = new PrismaExperienceRepository();
  const experiences = await repository.findByUserId({ userId: session.user.id });

  // Map domain entities to plain response objects.
  // We never serialize domain entities directly — we control exactly
  // what shape the client receives.
  const data = experiences.map((e) => ({
    id: e.id,
    company: e.company,
    position: e.position,
    industry: e.industry,
    location: e.location,
    startDate: e.dateRange.startDate,
    endDate: e.dateRange.endDate,
    isCurrent: e.isCurrent,
    durationLabel: e.durationLabel,
    durationInMonths: e.durationInMonths,
    responsibilities: e.responsibilities,
    achievements: e.achievements,
    technologies: e.technologies,
    skills: e.skills,
    hasLeadership: e.hasLeadership,
    teamSize: e.teamSize,
    challenges: e.challenges,
    starStory: e.starStory,
    portfolioLinks: e.portfolioLinks,
    order: e.order,
  }));

  return NextResponse.json({ data });
}

/**
 * POST /api/experience
 * Creates a new experience for the authenticated user.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // 1. Parse and validate the request body (format/structure validation)
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createExperienceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // 2. Wire up and execute the use case
  // In a larger codebase this wiring moves to a dependency injection container.
  // For MVP, manual wiring here is clear and explicit.
  const repository = new PrismaExperienceRepository();
  const useCase = new CreateExperienceUseCase(repository);

  const result = await useCase.execute({
    userId: session.user.id,
    ...parsed.data,
  });

  // 3. Translate use case result to HTTP response
  if (!result.ok) {
    // Domain validation errors (business rules) → 422 Unprocessable Entity
    return NextResponse.json(
      { error: result.error.message },
      { status: 422 },
    );
  }

  return NextResponse.json({ data: result.value }, { status: 201 });
}

/**
 * DELETE /api/experience
 * Deletes every experience owned by the authenticated user.
 */
export async function DELETE(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const repository = new PrismaExperienceRepository();
  const result = await new ClearAllExperiencesUseCase(repository).execute(session.user.id);

  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
