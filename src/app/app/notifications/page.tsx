import { Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUserId } from "@/lib/session";
import { requireActiveBrand } from "@/lib/require-brand";
import { listNotifications } from "@/server/services/notification.service";
import { formatDate } from "@/lib/utils";
import { NotificationRow } from "./notification-row";
import { markAllReadAction } from "./actions";

export default async function NotificationsPage() {
  const userId = await requireUserId();
  const { workspace } = await requireActiveBrand(userId);
  const notifications = await listNotifications(workspace.id, userId, 50);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <form action={markAllReadAction}>
          <Button type="submit" variant="outline" size="sm">
            Mark all as read
          </Button>
        </form>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Bell className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationRow
              key={n.id}
              id={n.id}
              title={n.title}
              message={n.message}
              href={n.href}
              createdAt={formatDate(n.createdAt)}
              isRead={Boolean(n.readAt)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
