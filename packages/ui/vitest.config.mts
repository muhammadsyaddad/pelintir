import { defineConfig } from "vitest/config";

// Tests cover pure tree logic only — no rendering — but happy-dom is cheap and
// keeps the door open for component tests later.
export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["__tests__/**/*.test.ts"],
  },
});
