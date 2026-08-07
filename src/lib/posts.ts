import { getCollection, type CollectionEntry } from "astro:content";

/**
 * Get published blog posts: must have a title, must not be a draft (in production).
 * Private notes without frontmatter are automatically excluded.
 */
export async function getPublishedPosts() {
  const posts = await getCollection("blog", ({ data }) => {
    const hasTitle = !!data.title;
    const notDraft = !data.draft || import.meta.env.DEV;
    return hasTitle && notDraft;
  });
  return posts.sort((a, b) => {
    const aDate = a.data.pubDate?.getTime() ?? 0;
    const bDate = b.data.pubDate?.getTime() ?? 0;
    return bDate - aDate;
  });
}
