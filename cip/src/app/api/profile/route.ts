// src/app/api/profile/route.ts — GET: fetch the current About Me / Elevator Pitch text
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/infrastructure/database/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { aboutMe: true, elevatorPitch: true, strengths: true, voiceGuide: true, geminiApiKey: true },
  });

  return NextResponse.json({
    data: {
      aboutMe: user?.aboutMe ?? null,
      elevatorPitch: user?.elevatorPitch ?? null,
      strengths: user?.strengths ?? null,
      voiceGuide: user?.voiceGuide ?? null,
      geminiApiKey: user?.geminiApiKey ?? null,
    },
  });
}
