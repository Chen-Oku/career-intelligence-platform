import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/infrastructure/database/client";

/**
 * Auth Strategy: JWT sessions (no Prisma adapter).
 *
 * Why no PrismaAdapter?
 * PrismaAdapter requires adding Account, Session, and VerificationToken
 * tables to the schema — 3 extra tables for session storage.
 * JWT sessions are stateless and don't need this.
 *
 * Tradeoff: We cannot invalidate sessions server-side (e.g. force-logout
 * all devices). For a solo professional tool in MVP, this is acceptable.
 * Add PrismaAdapter later when multi-device control becomes a requirement.
 *
 * User creation: We upsert the user in our `users` table on every sign-in.
 * The userId is embedded in the JWT so no DB query is needed per request.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      // Upsert user in our database on every sign-in.
      // This handles both first-time sign-up and name/avatar changes.
      await prisma.user.upsert({
        where: { email: user.email },
        create: {
          email: user.email,
          name: user.name ?? null,
          avatar: user.image ?? null,
        },
        update: {
          name: user.name ?? undefined,
          avatar: user.image ?? undefined,
        },
      });

      return true;
    },

    async jwt({ token, account }) {
      // `account` is only present on the first sign-in for this session.
      // We read the userId from DB once and embed it in the JWT.
      if (account) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          select: { id: true },
        });
        token.userId = dbUser?.id;
      }
      return token;
    },

    async session({ session, token }) {
      // Attach our internal userId to the session object.
      // Available everywhere via getServerSession() or useSession().
      return {
        ...session,
        user: {
          ...session.user,
          id: token.userId as string,
        },
      };
    },
  },

  pages: {
    signIn: "/login",
  },
};
