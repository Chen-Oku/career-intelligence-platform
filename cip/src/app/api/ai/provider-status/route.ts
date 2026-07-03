import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withUserAiContext } from "@/infrastructure/ai/requestAiContext";
import { getAiProviderStatus } from "@/infrastructure/ai/providerStatus";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const data = await withUserAiContext(session.user.id, getAiProviderStatus);
  return NextResponse.json({ data });
}
