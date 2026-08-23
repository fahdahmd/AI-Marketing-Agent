import "server-only";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { getOrSyncPlan } from "@/server/services/plan.service";
import { requireWorkspaceMembership, requireWorkspaceOwner } from "@/server/auth/authorize";
import { logAudit } from "@/server/services/audit-log.service";
import { ConflictError, NotFoundError, UsageLimitError, ValidationError } from "@/lib/errors";

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

export async function listMembers(workspaceId: string, userId: string) {
  await requireWorkspaceMembership(workspaceId, userId);
  return db.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateWorkspaceName(workspaceId: string, userId: string, name: string) {
  await requireWorkspaceOwner(workspaceId, userId);
  const updated = await db.workspace.update({ where: { id: workspaceId }, data: { name } });
  await logAudit({ workspaceId, userId, action: "workspace.renamed", entityType: "Workspace", entityId: workspaceId, metadata: { name } });
  return updated;
}

/**
 * Simplified invite flow for the MVP: adds an existing user directly as a
 * MEMBER. There's no email/invite-token system yet — the invited person
 * must already have an account with this email.
 */
export async function addMemberByEmail(workspaceId: string, userId: string, email: string) {
  await requireWorkspaceOwner(workspaceId, userId);

  if (!(await inviteMemberIsAllowed(workspaceId))) {
    const workspace = await db.workspace.findUniqueOrThrow({ where: { id: workspaceId }, include: { subscription: { include: { plan: true } } } });
    throw new UsageLimitError(`You've reached the ${workspace.subscription?.plan.teamMembers ?? 1} team member limit included in your plan.`);
  }

  const invitedUser = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!invitedUser) {
    throw new NotFoundError("No account found with that email — they need to sign up first");
  }

  const existingMembership = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: invitedUser.id, workspaceId } },
  });
  if (existingMembership) {
    throw new ConflictError("This person is already a member of this workspace.");
  }

  const member = await db.workspaceMember.create({
    data: { workspaceId, userId: invitedUser.id, role: "MEMBER" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  await logAudit({ workspaceId, userId, action: "workspace.member_added", entityType: "WorkspaceMember", entityId: member.id, metadata: { email } });

  return member;
}

export async function removeMember(workspaceId: string, userId: string, memberId: string) {
  await requireWorkspaceOwner(workspaceId, userId);

  const member = await db.workspaceMember.findUnique({ where: { id: memberId } });
  if (!member || member.workspaceId !== workspaceId) throw new NotFoundError("Member");
  if (member.role === "OWNER") throw new ValidationError("The workspace owner can't be removed.");

  await db.workspaceMember.delete({ where: { id: memberId } });
  await logAudit({ workspaceId, userId, action: "workspace.member_removed", entityType: "WorkspaceMember", entityId: memberId });
}
