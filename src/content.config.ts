import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const iCloudVault = path.join(
  os.homedir(),
  "Library",
  "Mobile Documents",
  "iCloud~md~obsidian",
  "Documents",
  "369zen",
);

const localFallback = path.join("src", "content", "blog");

function isReadable(dir: string): boolean {
  try {
    fs.readdirSync(dir);
    return true;
  } catch {
    return false;
  }
}

const blogBase = isReadable(iCloudVault) ? iCloudVault : localFallback;

const blog = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: blogBase,
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
