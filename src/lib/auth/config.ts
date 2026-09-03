import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/domain/enums";

/**
 * Edge-safe half of the auth setup. The middleware imports this file, so it must
 * never pull in Prisma or bcrypt. The credentials provider lives in ./index.ts,
 * which only runs in the Node runtime.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  callbacks: {
    // The JWT type carries an index signature of `unknown`, so the two custom
    // claims are cast back on the way out.
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
