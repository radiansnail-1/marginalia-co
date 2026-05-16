import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Paths that never need the supabase auth round-trip. The API routes do their
// own bearer-token auth via `lib/api/auth.ts`, the marketing root and auth
// pages are public, and `_next`/static assets are already excluded by the
// matcher below.
function isPublicPath(path: string) {
  if (path === "/") return true;
  if (path.startsWith("/auth")) return true;
  if (path.startsWith("/invite/")) return true;
  if (path.startsWith("/api/")) return true;
  if (path === "/api") return true;
  if (path === "/privacy") return true;
  if (path === "/terms") return true;
  if (path === "/license") return true;
  if (path.startsWith("/_next/")) return true;
  if (path === "/manifest.webmanifest") return true;
  if (path.startsWith("/.well-known/")) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  let response = NextResponse.next({ request });

  // Fast path for clearly public routes — skip the entire supabase call.
  if (isPublicPath(path)) return response;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Optimistic local-only check first. `getSession` reads the cookie without
  // hitting the supabase auth API; if the cookie is missing, we know the user
  // is anonymous without any round-trip.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || session.user?.is_anonymous) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/auth/sign-in";
    return NextResponse.redirect(redirect);
  }

  // Server components downstream call `getCurrentUser()` (React-cached) which
  // does the verified `getUser()` round-trip once per render. The proxy does
  // not need to verify the JWT again here — the cookie presence is enough to
  // route past the sign-in wall; data RLS still enforces the real check.
  return response;
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
