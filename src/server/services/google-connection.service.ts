import "server-only";
import { db } from "@/lib/db";
import { requireBrandAccess } from "@/server/auth/authorize";
import { getValidAccessToken } from "@/google/oauth";
import { listGA4Properties, listSearchConsoleSites, type GA4Property, type SearchConsoleSite } from "@/google/api";
import { logAudit } from "@/server/services/audit-log.service";
import { NotFoundError } from "@/lib/errors";

export async function getGoogleConnection(brandId: string, userId: string) {
  await requireBrandAccess(brandId, userId);
  return db.googleConnection.findUnique({ where: { brandId } });
}

export async function listAvailableGoogleResources(
  brandId: string,
  userId: string
): Promise<{ properties: GA4Property[]; sites: SearchConsoleSite[] } | null> {
  const connection = await getGoogleConnection(brandId, userId);
  if (!connection) return null;

  const accessToken = await getValidAccessToken(connection);

  const [properties, sites] = await Promise.all([
    listGA4Properties(accessToken).catch(() => []),
    listSearchConsoleSites(accessToken).catch(() => []),
  ]);

  return { properties, sites };
}

export async function saveGoogleSelection(
  brandId: string,
  userId: string,
  gaPropertyId: string | null,
  searchConsoleSiteUrl: string | null
) {
  const { brand } = await requireBrandAccess(brandId, userId);

  const connection = await db.googleConnection.findUnique({ where: { brandId } });
  if (!connection) throw new NotFoundError("Google connection");

  const updated = await db.googleConnection.update({
    where: { brandId },
    data: { gaPropertyId, searchConsoleSiteUrl },
  });

  await logAudit({ workspaceId: brand.workspaceId, userId, action: "google.selection_saved", entityType: "GoogleConnection", entityId: connection.id });

  return updated;
}

export async function disconnectGoogle(brandId: string, userId: string) {
  const { brand } = await requireBrandAccess(brandId, userId);
  await db.googleConnection.deleteMany({ where: { brandId } });
  await logAudit({ workspaceId: brand.workspaceId, userId, action: "google.disconnected", entityType: "Brand", entityId: brandId });
}
