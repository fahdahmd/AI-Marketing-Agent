import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup/load-env.ts"],
  },
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "./tests/setup/server-only-stub.ts"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
