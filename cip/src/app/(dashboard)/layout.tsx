import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardShell } from "@/components/shared/DashboardShell";

/**
 * Dashboard Layout — Server Component.
 *
 * Auth check happens server-side. If there's no session,
 * the user is redirected to /login before any HTML is sent.
 * This prevents any flash of authenticated content.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
