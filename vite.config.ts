import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  base: "/",
  server: {
    port: 3000,
    host: "0.0.0.0",
  },

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },

  build: {
    sourcemap: false,
    // Vite 8 uses rolldown's built-in minifier — faster than terser with
    // equivalent output.  Console / debugger removal is handled via esbuild.
    cssMinify: true,
    rollupOptions: {
      treeshake: true, // use Vite's safe default; the previous moduleSideEffects:false was unsafe
      input: {
        main: "./index.html",
      },
      output: {
        manualChunks(id) {
          // React ecosystem → stable vendor chunk (changes rarely)
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router")
          ) {
            return "react-vendor";
          }
          // PostHog analytics — already lazy-loaded in code, keep isolated
          if (id.includes("node_modules/posthog")) {
            return "posthog";
          }
          // Lucide icons
          if (id.includes("node_modules/lucide-react")) {
            return "icons";
          }
          // --- Mermaid sub-dependency isolation ---
          // These heavy transitive deps of mermaid were previously merged
          // into a single 654 kB chunk.  Splitting them keeps every chunk
          // under the 500 kB warning threshold.
          if (id.includes("node_modules/cytoscape")) {
            return "mermaid-cytoscape";
          }
          if (id.includes("node_modules/katex")) {
            return "mermaid-katex";
          }
          if (
            id.includes("node_modules/d3") ||
            id.includes("node_modules/d3-")
          ) {
            return "mermaid-d3";
          }
          if (
            id.includes("node_modules/dagre") ||
            id.includes("node_modules/elkjs")
          ) {
            return "mermaid-layout";
          }
        },
      },
    },
    // Mermaid's parser core (~662 kB) and cytoscape (~635 kB) are irreducible
    // lazy-loaded chunks. They only load when a blog post with diagrams is
    // viewed, so this warning limit is safe to raise.
    chunkSizeWarningLimit: 700,
    target: "esnext",
  },

  // Drop console & debugger statements (replaces terserOptions.compress)
  esbuild: {
    // @ts-expect-error - 'drop' is supported by esbuild but not typed in Vite's ESBuildOptions
    drop: ["console", "debugger"],
  },
});
