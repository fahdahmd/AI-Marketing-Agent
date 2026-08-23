import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe subset of the auth config, used by middleware.
 * Keeps Node-only dependencies (bcryptjs, Prisma) out of the Edge runtime bundle —
 * the Credentials provider itself is only registered in the full config (src/auth.ts).
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        (session.user as { id?: string }).id = token.userId as string;
      }
      return session;
    },
  },
};
