import { NextResponse } from "next/server";

/**
 * Next.js Middleware for Protected Routes
 * Checks whether the authentication cookie exists before serving protected pages.
 * Does NOT decode or verify JWT payload (Backend is source of truth).
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protected paths list
  const protectedRoutes = ["/profile", "/dashboard"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Check presence of HttpOnly auth token cookie
    const authToken = request.cookies.get("auth_token")?.value;

    if (!authToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/dashboard/:path*"],
};
