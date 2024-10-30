// @ts-check
import { defineConfig } from "astro/config";
import { nodePolyfills } from "vite-plugin-node-polyfills";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [/** @type {any} */ (nodePolyfills())],
  },
});
