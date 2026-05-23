import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sanitizeCountry } from "@/lib/geo";

// Headers that Next.js uses internally for sub-requests. Strip them from
// incoming external requests to prevent middleware bypass attacks
// (CVE-2025-29927 class of issues — spoofing internal routing headers).
const INTERNAL_HEADERS = [
  "x-middleware-subrequest",
  "x-middleware-invoke",
  "x-invoke-path",
  "x-invoke-query",
  "x-invoke-output",
  "x-nextjs-data",
];

export async function middleware(request: NextRequest) {
  // Block any external request that carries internal Next.js routing headers.
  for (const h of INTERNAL_HEADERS) {
    if (request.headers.has(h)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // Detect user's country from CDN-injected headers (Vercel/Cloudflare) or local override.
  // sanitizeCountry rejects placeholder codes (T1/Tor, XX/unknown, EU/regional) and
  // malformed values so only valid ISO 3166-1 alpha-2 codes reach downstream logic.
  const rawCountry =
    process.env.NEXT_PUBLIC_GEO_TEST_COUNTRY ||
    (request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    null);
  const country = sanitizeCountry(rawCountry);
  // Forward country as a request header so server components can read it
  // via headers().get("x-user-country") in the same request cycle.
  const requestHeaders = new Headers(request.headers);
  if (country) requestHeaders.set("x-user-country", country);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Recreate with modified request headers so geo header survives cookie resets
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — must call getUser(), not getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Expose country in a non-HttpOnly cookie so client components can read it
  if (country) {
    supabaseResponse.cookies.set("user-country", country, {
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
      path: "/",
      httpOnly: false,
    });
  } else {
    supabaseResponse.cookies.delete("user-country");
  }
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
