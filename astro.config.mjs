import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://axmed.dev",
  output: "static",
  build: {
    inlineStylesheets: "auto",
  },
  devToolbar: { enabled: false },
  vite: {
    build: {
      cssMinify: true,
      minify: true,
    },
  },
});
