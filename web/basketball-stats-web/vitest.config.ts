import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      exclude: ["node_modules", "dist"],
      coverage: {
        provider: "v8",
        include: ["src/hooks/**/*.{ts,tsx}", "src/contexts/**/*.{ts,tsx}"],
        exclude: ["src/**/*.d.ts", "src/**/index.ts", "src/**/*.test.{ts,tsx}"],
      },
    },
  })
);
