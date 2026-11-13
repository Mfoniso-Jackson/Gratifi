import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isDemoMode } from "@/lib/demo/mode";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  const isAdminApi = request.nextUrl.pathname.startsWith("/api/admin");
  const isLogin = request.nextUrl.pathname.startsWith("/admin/login") || request.nextUrl.pathname.startsWith("/staff/login");
  const isStaffPath = request.nextUrl.pathname.startsWith("/staff");

  if ((!isAdminPath && !isAdminApi && !isStaffPath) || isLogin) return response;
  // Demo mode serves sample data only; admin pages are open so the product can be previewed.
  if (isDemoMode()) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  const { data } = await supabase.auth.getUser();

  // Staff pages only need a signed-in account; the page itself shows only that person's tips.
  if (isStaffPath) {
    if (data.user) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/staff/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  // Signed in is not enough: the account must be listed in admin_users (as admin or venue owner).
  // RLS lets users read only their own row, so this check runs with their session.
  const access = data.user
    ? await supabase.from("admin_users").select("role").eq("user_id", data.user.id).maybeSingle()
    : null;

  if (!data.user || !access?.data) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Sign in with an account that has access." }, { status: data.user ? 403 : 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = data.user ? "?error=no-access" : "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/staff/:path*"]
};
