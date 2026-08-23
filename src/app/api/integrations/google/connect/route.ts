import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { resolveActiveWorkspace, resolveActiveBrand } from "@/lib/require-context";
import { buildGoogleAuthorizeUrl } from "@/google/oauth";

const STATE_COOKIE = "google_oauth_state";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", APP_URL));
  }

  // Route handlers can't use next/navigation's redirect() the way pages
  // can, so we resolve the active brand manually instead of reusing
  // requireActiveBrand (which is meant for Server Component pages).
  const { activeWorkspace } = await resolveActiveWorkspace(session.user.id);
  if (!activeWorkspace) return NextResponse.redirect(new URL("/signup", APP_URL));

  const { activeBrand } = await resolveActiveBrand(activeWorkspace.id);
  if (!activeBrand) return NextResponse.redirect(new URL("/app/brand/new", APP_URL));

  const state = randomUUID();
  cookies().set(STATE_COOKIE, state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });

  return NextResponse.redirect(buildGoogleAuthorizeUrl(state));
}
