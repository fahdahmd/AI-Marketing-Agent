import "server-only";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { getOrSyncPlan } from "@/server/services/plan.service";
import { requireWorkspaceMembership } from "@/server/auth/authorize";
import { logAudit } from "@/server/services/audit-log.service";

async function generateUniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "workspace";
  let slug = root;
  let attempt = 0;
  while (await db.workspace.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${root}-${attempt}`;
  }
  return slug;
}

export async function createWorkspaceForUser(userId: string, name: string) {
  const slug = await generateUniqueSlug(name);
  const freePlan = await getOrSyncPlan("FREE");

  const workspace = await db.workspace.create({
    data: {
      name,
      slug,
      members: {
        create: { userId, role: "OWNER" },
      },
      subscription: {
        create: {
          planId: freePlan.id,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
        },
      },
    },
    include: { subscription: true },
  });

  await logAudit({ workspaceId: workspace.id, userId, action: "workspace.created", entityType: "Workspace", entityId: workspace.id });

  return workspace;
}

export async function listWorkspacesForUser(userId: string) {
  const memberships = await db.workspaceMember.findMany({
    where: { userId },
    include: { workspace: { include: { subscription: { include: { plan: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  return memberships.map((m) => ({ ...m.workspace, role: m.role }));
}

export async function getWorkspaceForUser(workspaceId: string, userId: string) {
  await requireWorkspaceMembership(workspaceId, userId);
  return db.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    include: { subscription: { include: { plan: true } }, brands: true },
  });
}

export async function inviteMemberIsAllowed(workspaceId: string) {
  const workspace = await db.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    include: { subscription: { include: { plan: true } }, members: true },
  });
  const limit = workspace.subscription?.plan.teamMembers ?? 1;
  return workspace.members.length < limit;
}
