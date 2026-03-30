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
        email: {},
        password: {},
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);

        if (!valid) return null;

        return user;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 🔥 On login
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isPro = user.isPro;
        token.image = user.image;
        token.name = user.name;
      }

      // 🔥 THIS IS THE MISSING PIECE
      if (trigger === "update" && session?.image) {
        token.image = session.image;
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
    signIn: "/signin/login",
  },
};
