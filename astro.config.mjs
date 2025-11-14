import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://axmed.dev",
  output: "static",
  build: {
    inlineStylesheets: "auto",
    assets: "_astro",
  },
  devToolbar: { enabled: false },
  compressHTML: true,
  vite: {
    build: {
      cssMinify: true,
      minify: "esbuild",
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
        onwarn(warning, warn) {
          // Suppress unused import warnings from Astro internals
          if (
            warning.code === "UNUSED_EXTERNAL_IMPORT" &&
            warning.exporter?.includes("@astrojs/internal-helpers")
          ) {
            return;
          }
          warn(warning);
        },
      },
    },
    esbuild: {
      drop: ["console", "debugger"],
      legalComments: "none",
    },
  },
});
