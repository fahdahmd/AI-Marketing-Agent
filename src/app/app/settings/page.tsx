import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { listMembers } from "@/server/services/workspace.service";
import { listAuditLog } from "@/server/services/audit-log.service";
import { requireWorkspaceMembership } from "@/server/auth/authorize";
import { formatDate } from "@/lib/utils";
import { WorkspaceNameForm } from "./workspace-name-form";
import { MembersSection } from "./members-section";

export default async function SettingsPage() {
  const userId = await requireUserId();
  const { workspace } = await requireActiveBrand(userId);
  const membership = await requireWorkspaceMembership(workspace.id, userId);
  const isOwner = membership.role === "OWNER";

  const [members, auditLog] = await Promise.all([
    listMembers(workspace.id, userId),
    listAuditLog(workspace.id, 30),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage {workspace.name}&apos;s workspace, team, and activity.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          {!isOwner && <CardDescription>Only the workspace owner can rename it.</CardDescription>}
        </CardHeader>
        <CardContent>
          {isOwner ? (
            <WorkspaceNameForm initialName={workspace.name} />
          ) : (
            <p className="text-sm">{workspace.name}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team members</CardTitle>
          <CardDescription>{members.length} member{members.length === 1 ? "" : "s"}</CardDescription>
        </CardHeader>
        <CardContent>
          <MembersSection
            members={members.map((m) => ({ id: m.id, role: m.role, name: m.user.name, email: m.user.email }))}
            isOwner={isOwner}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity log</CardTitle>
          <CardDescription>Recent actions taken in this workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {auditLog.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
          {auditLog.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
              <span>
                <span className="font-medium">{entry.user?.name || entry.user?.email || "System"}</span>{" "}
                <span className="text-muted-foreground">{entry.action.replace(/[._]/g, " ")}</span>
              </span>
              <span className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
