import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/beta/",
  plugins: [react()],
  server: { host: "127.0.0.1" },
  build: { target: "es2020", outDir: "../dist/beta", emptyOutDir: true },
});
