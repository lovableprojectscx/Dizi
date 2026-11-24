import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests/e2e/**"],
    env: {
      VITE_SUPABASE_URL: "https://zkqzdwxjthjdjchimmds.supabase.co",
      VITE_SUPABASE_ANON_KEY: "dummy-key-for-unit-tests",
    },
  },
});
