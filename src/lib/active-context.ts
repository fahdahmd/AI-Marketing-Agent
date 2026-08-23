import "server-only";
import { cookies } from "next/headers";

const WORKSPACE_COOKIE = "active_workspace_id";
const BRAND_COOKIE = "active_brand_id";

export function getActiveWorkspaceIdCookie(): string | undefined {
  return cookies().get(WORKSPACE_COOKIE)?.value;
}

export function getActiveBrandIdCookie(): string | undefined {
  return cookies().get(BRAND_COOKIE)?.value;
}
