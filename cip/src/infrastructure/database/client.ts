import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client Singleton
 *
 * Why not just `new PrismaClient()` at the module level?
 *
 * Next.js dev mode re-evaluates module code on every hot reload.
 * Without this pattern, each reload spawns a new PrismaClient with its
 * own connection pool, eventually exhausting the database's connection limit.
 *
 * The pattern: store the client on the Node.js `global` object during
 * development. In production, module code is only evaluated once per
 * process startup, so a module-level singleton is fine.
 */

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
