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
      },
    },
    esbuild: {
      drop: ["console", "debugger"],
      legalComments: "none",
    },
  },
});
