// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import fs from "node:fs";
import path from "node:path";

import remarkGfm from "remark-gfm";
import {
  remarkObsidianLinks,
  remarkObsidianImages,
  rehypeObsidianCallouts,
  slugify,
} from "./src/lib/remark-obsidian.ts";
import { contentImages } from "./src/integrations/content-images.ts";
import { SITE_URL } from "./src/lib/site.ts";

// Scan existing blog posts for known wiki-link targets
function getKnownSlugs() {
  const blogDir = path.join("src", "content", "blog");
  if (!fs.existsSync(blogDir)) return new Set();
  const slugs = new Set();
  for (const entry of fs.readdirSync(blogDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      slugs.add(entry.name);
    }
  }
  return slugs;
}

const knownSlugs = getKnownSlugs();

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,

  integrations: [sitemap(), contentImages()],

  vite: {
    plugins: [tailwindcss()],
  },

  markdown: {
    remarkPlugins: [
      remarkGfm,
      remarkObsidianLinks({ knownSlugs }),
      remarkObsidianImages,
    ],
    rehypePlugins: [rehypeObsidianCallouts],
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
