import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), tailwindcss(), viteSingleFile()],
  build: {
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
  },
  resolve: {
    alias: {
      $lib: path.resolve("./src/lib"),
      $assets: path.resolve("./src/assets"),
      $features: path.resolve("./src/features"),
    },
  },
});
