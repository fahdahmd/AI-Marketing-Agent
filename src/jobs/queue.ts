import "server-only";
import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";

type JobHandler<T> = (data: T) => Promise<void>;

let connection: IORedis | null | undefined;

function getConnection(): IORedis | null {
  if (connection !== undefined) return connection;
  connection = process.env.REDIS_URL ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null }) : null;
  return connection;
}

// BullMQ's Queue<Data, Result, Name> generics don't play nicely with a
// dynamically-typed job registry — this map intentionally erases to `any`
// internally; callers stay type-safe via JobHandler<T> at the public API.
const queues = new Map<string, Queue<any, any, string>>();
const workersStarted = new Set<string>();

function getQueue<T>(name: string): Queue<any, any, string> | null {
  const conn = getConnection();
  if (!conn) return null;
  if (!queues.has(name)) queues.set(name, new Queue(name, { connection: conn }));
  return queues.get(name)!;
}

/** Registers a worker to process a named queue. No-op when Redis isn't configured (inline mode). */
export function registerWorker<T>(name: string, handler: JobHandler<T>) {
  const conn = getConnection();
  if (!conn || workersStarted.has(name)) return;
  workersStarted.add(name);
  new Worker<T>(name, async (job: Job<T>) => handler(job.data), { connection: conn });
}

/**
 * Enqueues a job onto BullMQ when Redis is configured; otherwise runs it
 * inline immediately. Time-deferred jobs (delay > 0) are a no-op in
 * inline mode — callers that need deferred execution without Redis (e.g.
 * scheduled publishing) should rely on a DB-backed poller instead of this
 * function for the delayed case. See src/jobs/scheduled-post-poller.ts.
 */
export async function enqueueOrRun<T>(name: string, data: T, handler: JobHandler<T>, opts?: { delay?: number }) {
  const queue = getQueue<T>(name);
  if (queue) {
    await queue.add(name, data, opts?.delay ? { delay: opts.delay } : undefined);
    return;
  }
  if (!opts?.delay) {
    await handler(data);
  }
}

export function isQueueBacked(): boolean {
  return Boolean(getConnection());
}
