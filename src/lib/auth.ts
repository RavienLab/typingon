import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(
          credentials.password.trim(),
          user.password,
        );

        if (!valid) return null;

        // ✅ Email Verification Guard
        if (!user.emailVerified) {
          throw new Error("Please verify your email before logging in");
        }

        return user;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 1. Initial Sign In: Capture user data from the database
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isPro = user.isPro;
        token.image = user.image;
        token.name = user.name;
      }

      // 2. 🔥 Reactive Updates: Handle changes when update() is called on the client
      if (trigger === "update" && session) {
        // We check for user sub-object or top-level session properties depending on how you call update()
        const newUserData = session.user || session;

        if (newUserData.image !== undefined) token.image = newUserData.image;
        if (newUserData.isPro !== undefined) token.isPro = newUserData.isPro;
        if (newUserData.name !== undefined) token.name = newUserData.name;
        if (newUserData.role !== undefined) token.role = newUserData.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "user" | "admin" | "examiner";
        session.user.isPro = token.isPro as boolean;
        session.user.image = token.image as string | null;
        session.user.name = token.name as string | null;
      }

      return session;
    },
  },

  pages: {
    signIn: "/signin",
  },
};
