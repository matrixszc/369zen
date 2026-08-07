import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { getVaultPath } from "./lib/vault.ts";

const blog = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: getVaultPath(),
  }),
  // All fields optional — private notes coexist with blog posts.
  // Only entries with title + !draft appear on the published site.
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    pubDate: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    // Handle Obsidian checkbox (boolean true/false), text property (string "true"/"false"/"True"/"False"),
    // and absent field. Missing/unparseable defaults to draft: true so untitled notes never leak.
    draft: z.union([z.boolean(), z.string()])
      .transform((v) =>
        typeof v === "boolean" ? v : v.toLowerCase() === "true",
      )
      .pipe(z.boolean())
      .optional()
      .default(true),
  }),
});

export const collections = {
  blog,
};
