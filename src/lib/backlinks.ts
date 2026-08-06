import { type CollectionEntry } from "astro:content";
import { slugify } from "./remark-obsidian.ts";

const WIKI_LINK_RE = /\[\[([^\]]+)\]\]/g;

interface Backlink {
  title: string;
  href: string;
}

/**
 * Find all posts that link to the given slug via [[wiki links]].
 */
export function getBacklinks(
  posts: CollectionEntry<"blog">[],
  targetSlug: string,
): Backlink[] {
  const result: Backlink[] = [];

  for (const post of posts) {
    if (post.id === targetSlug) continue;
    if (!post.body) continue;

    for (const match of post.body.matchAll(WIKI_LINK_RE)) {
      const name = match[1].split("|")[0].split("#")[0].trim();
      if (slugify(name) === targetSlug) {
        result.push({
          title: post.data.title,
          href: `/blog/${post.id}/`,
        });
        break; // only count each source post once
      }
    }
  }

  return result;
}
