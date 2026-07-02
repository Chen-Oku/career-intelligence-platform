import { DefaultSession } from "next-auth";

/**
 * Extend the built-in NextAuth types to include our custom fields.
 * Without this, `session.user.id` would be a TypeScript error.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
  }
}
