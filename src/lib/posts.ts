import { getCollection, type CollectionEntry } from "astro:content";

/** Filter out draft posts in production; show all in dev. */
export function visiblePosts(
  posts: CollectionEntry<"blog">[],
): CollectionEntry<"blog">[] {
  return posts.filter((p) => !p.data.draft || import.meta.env.DEV);
}

/** Get all visible blog posts sorted by date descending. */
export async function getPublishedPosts() {
  const posts = await getCollection("blog", ({ data }) => {
    return !data.draft || import.meta.env.DEV;
  });
  return posts.sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
  );
}
