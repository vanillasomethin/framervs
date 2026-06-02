import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminUI = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isContentAPI = pathname === "/api/content";

  if (!isAdminUI && !isContentAPI) {
    return NextResponse.next();
  }

  const token = request.cookies.get("admin_session")?.value;
  if (token && token === process.env.ADMIN_SECRET) {
    return NextResponse.next();
  }

  if (isContentAPI) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/content"],
};
