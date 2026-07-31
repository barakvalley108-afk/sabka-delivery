import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const session =
    request.cookies.get("sabka_session")?.value ||
    request.cookies.get("apna_session")?.value;

  if (session) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/customer-access";
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/", "/orders", "/profile"],
};
