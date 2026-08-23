// Vitest runs outside the Next.js webpack pipeline, which is what normally
// aliases the `server-only` package to a no-op for server bundles. Without
// this alias, any module importing "server-only" would throw immediately
// under Vitest/Node. See vitest.config.ts.
export {};
