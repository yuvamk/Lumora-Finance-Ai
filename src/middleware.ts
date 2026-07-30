import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const url = request.nextUrl.clone();
  const { pathname } = url;

  // Routes that never redirect regardless of auth state
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/api") ||
    pathname === "/auth/callback" ||
    pathname === "/auth/reset-password";

  // Auth routes (login, signup, forgot-password)
  const isAuthRoute =
    pathname.startsWith("/auth") &&
    !pathname.startsWith("/auth/callback") &&
    !pathname.startsWith("/auth/reset-password");

  // Onboarding is accessible only when authenticated
  const isOnboarding = pathname.startsWith("/onboarding");

  // If user is not logged in and trying to access a protected route → login
  if (!user && !isAuthRoute && !isPublicRoute && !isOnboarding) {
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // If user is not logged in and tries onboarding → login
  if (!user && isOnboarding) {
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // If user is logged in and tries to access login/signup → dashboard
  if (user && isAuthRoute) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
