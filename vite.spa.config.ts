import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "path";

// Determine the base path dynamically based on deployment environment
const getBasePath = () => {
  if (process.env.NETLIFY) {
    return "/";
  }
  if (process.env.GITHUB_ACTIONS) {
    const repo = process.env.GITHUB_REPOSITORY;
    return repo ? `/${repo.split("/")[1]}/` : "/";
  }
  return process.env.VITE_BASE_PATH || "/";
};

export default defineConfig({
  base: getBasePath(),
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    tailwindcss(),
    react(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
