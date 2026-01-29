import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    root: "./convex",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", "_generated", "test/setup.ts", "test/fixtures.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts", "*.ts"],
      exclude: ["**/*.d.ts", "_generated/**", "test/**"],
    },
  },
});
