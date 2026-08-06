// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

import { contentImages } from "./src/integrations/content-images.ts";
import { SITE_URL } from "./src/lib/site.ts";

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,

  integrations: [sitemap(), contentImages()],

  vite: {
    plugins: [tailwindcss()],
  },

  markdown: {
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: "light",
      wrap: true,
    },
  },
});
