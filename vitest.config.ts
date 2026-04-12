import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.spec.ts"],
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  }
});
