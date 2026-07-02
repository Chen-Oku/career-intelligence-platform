// src/app/api/skills/detect/route.ts — GET: skill candidates found in
// Experience/Project/Story data that aren't in the Skill table yet.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaSkillRepository } from "@/infrastructure/database/repositories/PrismaSkillRepository";
import { PrismaExperienceRepository } from "@/infrastructure/database/repositories/PrismaExperienceRepository";
import { PrismaProjectRepository } from "@/infrastructure/database/repositories/PrismaProjectRepository";
import { PrismaStoryRepository } from "@/infrastructure/database/repositories/PrismaStoryRepository";
import { DetectSkillCandidatesQuery } from "@/application/career/DetectSkillCandidates";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const query = new DetectSkillCandidatesQuery(
    new PrismaSkillRepository(),
    new PrismaExperienceRepository(),
    new PrismaProjectRepository(),
    new PrismaStoryRepository(),
  );

  const result = await query.execute(session.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ data: result.value });
}
