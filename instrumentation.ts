export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduledPostPoller } = await import("@/jobs/scheduled-post-poller");
    startScheduledPostPoller();
  }
}
