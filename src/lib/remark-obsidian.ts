/**
 * Remark/rehype plugins for Obsidian-flavored markdown.
 *
 * Converts three Obsidian-specific syntaxes to standard HTML at build time:
 * 1. Wiki links:   [[target]] or [[target|alias]]  → <a href="/blog/target/">
 * 2. Image embeds: ![[image.png]]                   → <img src="./image.png">
 * 3. Callouts:     > [!note] Title\n> body          → <div class="callout callout-note">
 *
 * Unknown wiki-link targets get class "wiki-link-future" so CSS can dash-underline them.
 */

import { visit } from "unist-util-visit";
import type { Root, Text, Link, Image } from "mdast";
import type { Element, Text as HastText } from "hast";
import type { Plugin } from "unified";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive the blog post slug from the source file path.
 *  /.../content/blog/hello-369zen/index.md  →  hello-369zen
 */
function slugFromPath(filePath: string): string {
  const m = filePath.match(/\/content\/blog\/(.+)\/index\.md$/);
  return m ? m[1] : "";
}

/** Normalise a wiki-link target into a kebab-style slug. */
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w一-龥-]/g, "")
    .replace(/-+/g, "-");
}

const WIKI_LINK_RE = /\[\[([^\]]+)\]\]/g;

function parseWikiLink(raw: string): { target: string; alias: string } | null {
  WIKI_LINK_RE.lastIndex = 0;
  const m = WIKI_LINK_RE.exec(raw);
  if (!m) return null;
  const inner = m[1];
  const parts = inner.split("|");
  const target = parts[0].split("#")[0].trim(); // strip heading anchor
  const alias = (parts[1] ?? parts[0]).trim();
  return { target, alias };
}

// ---------------------------------------------------------------------------
// 1. Wiki links  [[page]]  /  [[page|text]]
// ---------------------------------------------------------------------------

interface WikiLinkOpts {
  knownSlugs: Set<string>;
}

export function remarkObsidianLinks(
  opts: WikiLinkOpts,
): Plugin<[], Root> {
  return () => (tree, file) => {
    visit(tree, "text", (node: Text, idx, parent) => {
      if (!parent || typeof idx !== "number") return;

      const matches = [...node.value.matchAll(WIKI_LINK_RE)];
      if (matches.length === 0) return;

      const replacements: (Link | Text)[] = [];
      let cursor = 0;

      for (const match of matches) {
        // Text before this match
        if (match.index! > cursor) {
          replacements.push({
            type: "text",
            value: node.value.slice(cursor, match.index),
          } as Text);
        }

        const { target, alias } = parseWikiLink(match[0])!;
        const targetSlug = slugify(target);
        const known = opts.knownSlugs.has(targetSlug);

        replacements.push({
          type: "link",
          url: `/blog/${targetSlug}/`,
          title: null,
          children: [{ type: "text", value: alias }],
          data: {
            hProperties: known
              ? { class: "wiki-link" }
              : { class: "wiki-link wiki-link-future" },
          },
        } as unknown as Link);

        cursor = match.index! + match[0].length;
      }

      // Trailing text
      if (cursor < node.value.length) {
        replacements.push({
          type: "text",
          value: node.value.slice(cursor),
        } as Text);
      }

      parent.children.splice(idx, 1, ...replacements);
    });
  };
}

// ---------------------------------------------------------------------------
// 2. Image embeds  ![[image.png]]
// ---------------------------------------------------------------------------

export function remarkObsidianImages(): Plugin<[], Root> {
  return () => (tree, file) => {
    const slug = slugFromPath(file.path);

    visit(tree, "text", (node: Text, idx, parent) => {
      if (!parent || typeof idx !== "number") return;

      const imageRe = /!\[\[([^\]]+)\]\]/g;
      const matches = [...node.value.matchAll(imageRe)];
      if (matches.length === 0) return;

      const replacements: (Image | Text)[] = [];
      let cursor = 0;

      for (const match of matches) {
        if (match.index! > cursor) {
          replacements.push({
            type: "text",
            value: node.value.slice(cursor, match.index),
          } as Text);
        }

        const filename = match[1].trim();
        const src = slug ? `./${filename}` : filename;

        replacements.push({
          type: "image",
          url: src,
          title: filename,
          alt: filename,
        } as Image);

        cursor = match.index! + match[0].length;
      }

      if (cursor < node.value.length) {
        replacements.push({
          type: "text",
          value: node.value.slice(cursor),
        } as Text);
      }

      parent.children.splice(idx, 1, ...replacements);
    });
  };
}

// ---------------------------------------------------------------------------
// 3. Callouts  > [!note] Title  →  <div class="callout callout-note">…
// ---------------------------------------------------------------------------

const CALLOUT_TYPES = new Set([
  "note", "tip", "warning", "danger", "info",
  "success", "fail", "abstract", "example", "question", "quote",
]);

const CALLOUT_RE = /^\[!(\w+)\]\s*(.*)$/;

export function rehypeObsidianCallouts(): Plugin<[], Root> {
  return () => (tree) => {
    visit(tree, "element", (node: Element, idx, parent) => {
      if (!parent || typeof idx !== "number") return;
      if (node.tagName !== "blockquote") return;

      const firstChild = node.children[0] as Element | undefined;
      if (!firstChild || firstChild.tagName !== "p") return;

      const firstText = firstChild.children[0] as HastText | undefined;
      if (!firstText || firstText.type !== "text") return;

      const m = CALLOUT_RE.exec(firstText.value);
      if (!m) return;

      const type = m[1].toLowerCase();
      if (!CALLOUT_TYPES.has(type)) return;

      const title = m[2] || type.charAt(0).toUpperCase() + type.slice(1);

      // Remove the [!type] prefix from the first paragraph
      const remaining = firstText.value.slice(m[0].length).trimStart();
      if (remaining) {
        firstText.value = remaining;
      } else {
        // Remove the leading text node if it was only the callout marker
        firstChild.children.shift();
        // If paragraph is now empty, remove it
        if (firstChild.children.length === 0) {
          node.children.shift();
        }
      }

      // Rebuild as styled div
      const calloutDiv: Element = {
        type: "element",
        tagName: "div",
        properties: { class: `callout callout-${type}` },
        children: [],
      };

      // Add title paragraph if there's a title
      if (title) {
        calloutDiv.children.push({
          type: "element",
          tagName: "p",
          properties: { class: "callout-title" },
          children: [{ type: "text", value: title }],
        });
      }

      // Move remaining blockquote children into the callout div
      calloutDiv.children.push(...node.children);

      // Replace the blockquote with our callout div
      parent.children.splice(idx, 1, calloutDiv);
    });
  };
}
