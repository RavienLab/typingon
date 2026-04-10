export { default } from "next-auth/middleware";

export const config = { 
  // List all pages that REQUIRE login
  matcher: ["/profile/:path*", "/leaderboard/:path*"] 
};