import { defineConfig } from "vite";

export default defineConfig({
  test: {
    include: ["tests/**/*.js"],
    globals: true,
    environment: "node",
  },
});
