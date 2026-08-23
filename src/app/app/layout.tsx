import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/app-shell/sidebar";
import { Topbar } from "@/components/app-shell/topbar";
import { resolveActiveWorkspace, resolveActiveBrand } from "@/lib/require-context";
import { getUnreadCount } from "@/server/services/notification.service";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { workspaces, activeWorkspace } = await resolveActiveWorkspace(session.user.id);

  if (!activeWorkspace) {
    // Every signed-up user gets a workspace at signup time; this only
    // triggers for edge cases like a directly-created user with no membership.
    redirect("/signup");
  }

  const { brands, activeBrand } = await resolveActiveBrand(activeWorkspace.id);
  const unreadNotifications = await getUnreadCount(activeWorkspace.id, session.user.id);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          workspaces={workspaces.map((w) => ({ id: w.id, name: w.name, role: w.role }))}
          activeWorkspaceId={activeWorkspace.id}
          brands={brands.map((b) => ({ id: b.id, name: b.name }))}
          activeBrandId={activeBrand?.id}
          unreadNotifications={unreadNotifications}
          user={{ name: session.user.name, email: session.user.email }}
        />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
