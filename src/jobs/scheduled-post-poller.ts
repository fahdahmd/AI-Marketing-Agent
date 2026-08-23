import "server-only";
import { db } from "@/lib/db";
import { processScheduledPost } from "@/server/services/publishing.service";

const POLL_INTERVAL_MS = 30_000;
const MAX_ATTEMPTS = 3;

let started = false;

/**
 * DB-backed fallback for scheduled publishing. Runs regardless of whether
 * Redis/BullMQ is configured, so scheduled posts are never silently
 * dropped if a delayed BullMQ job is missed (e.g. after a restart) —
 * this is the actual source of truth; BullMQ (when configured) is just a
 * faster trigger on top of it. processScheduledPost is idempotent, so
 * overlap between the two is safe.
 */
export function startScheduledPostPoller() {
  if (started) return;
  started = true;

  const tick = async () => {
    try {
      const due = await db.scheduledPost.findMany({
        where: {
          status: { in: ["PENDING", "FAILED"] },
          scheduledFor: { lte: new Date() },
          attempts: { lt: MAX_ATTEMPTS },
        },
        select: { id: true },
        take: 20,
      });

      for (const { id } of due) {
        await processScheduledPost(id);
      }
    } catch (error) {
      console.error("Scheduled post poller tick failed", error);
    }
  };

  setInterval(tick, POLL_INTERVAL_MS);
  void tick();
}
