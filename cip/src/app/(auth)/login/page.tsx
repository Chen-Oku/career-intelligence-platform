import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { LoginClient } from "./LoginClient";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/");

  return <LoginClient />;
}
