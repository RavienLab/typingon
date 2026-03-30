import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isPro: boolean;
      role: "user" | "admin" | "examiner"; // 🔥 added
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    isPro: boolean;
    role: "user" | "admin" | "examiner"; // 🔥 added
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isPro?: boolean;
    role?: "user" | "admin" | "examiner"; // 🔥 added
  }
}
