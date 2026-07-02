import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/shared/Sidebar";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";

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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
      {/* Mounted at the layout level so the chat and its transcript persist
          while navigating between dashboard sections. */}
      <AssistantWidget />
    </div>
  );
}
