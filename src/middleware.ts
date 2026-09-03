import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = new Set(["/login", "/register"]);

/**
 * The edge runtime cannot reach the database, so this only answers "is there a
 * session cookie". Whether the account behind it is still allowed in is decided
 * by the guards on every page. /login stays reachable with a cookie in hand,
 * otherwise a session whose account is gone has no way back out.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (!PUBLIC_PATHS.has(pathname) && !req.auth?.user) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("next", pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
