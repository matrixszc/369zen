/**
 * Remark/rehype plugins for Obsidian-flavored markdown.
 *
 * Converts three Obsidian-specific syntaxes at build time:
 * 1. Wiki links:   [[target]] or [[target|alias]]  →  [alias](/blog/target/)
 * 2. Image embeds: ![[image.png]]                   →  ![image.png](./image.png)
 * 3. Callouts:     > [!note] Title\n> body          →  <div class="callout callout-note">
 *
 * Strategy for (1) and (2): rewrite text to standard markdown inside the
 * existing Text node. No AST manipulation. The markdown parser then does
 * the rest natively — zero risk of malformed nodes.
 */

import { visit } from "unist-util-visit";
import type { Root, Text } from "mdast";
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

// ---------------------------------------------------------------------------
// 1. Wiki links  [[page]]  /  [[page|text]]
//
// Rewrite text in-place:
//   "See [[my note]] for details"  →  "See [my note](/blog/my-note/) for details"
//   "See [[my note|here]]"         →  "See [here](/blog/my-note/)"
// ---------------------------------------------------------------------------

const WIKI_LINK_RE = /\[\[([^\]]+)\]\]/g;

export function remarkObsidianLinks(): Plugin<[], Root> {
  return () => (tree) => {
    visit(tree, "text", (node: Text) => {
      node.value = node.value.replace(
        WIKI_LINK_RE,
        (_full: string, inner: string) => {
          const parts = inner.split("|");
          const target = parts[0].split("#")[0].trim(); // strip heading anchor
          const alias = (parts[1] ?? parts[0]).trim();
          const targetSlug = slugify(target);

          return `[${alias}](/blog/${targetSlug}/)`;
        },
      );
    });
  };
}

// ---------------------------------------------------------------------------
// 2. Image embeds  ![[image.png]]
//
// Rewrite text in-place:
//   "![[screenshot.png]]"  →  "![screenshot.png](./screenshot.png)"
// ---------------------------------------------------------------------------

const IMAGE_EMBED_RE = /!\[\[([^\]]+)\]\]/g;

export function remarkObsidianImages(): Plugin<[], Root> {
  return () => (tree, file) => {
    const slug = slugFromPath(file.path);

    visit(tree, "text", (node: Text) => {
      node.value = node.value.replace(
        IMAGE_EMBED_RE,
        (_full: string, filename: string) => {
          const f = filename.trim();
          const src = slug ? `./${f}` : f;
          return `![${f}](${src})`;
        },
      );
    });
  };
}

// ---------------------------------------------------------------------------
// 3. Callouts  > [!note] Title  →  <div class="callout callout-note">…
//
// This is a rehype plugin (runs on the HTML AST, not markdown AST).
// It transforms blockquote elements whose first paragraph starts with [!type]
// into styled div.callout containers.
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

      // Add title paragraph
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
      (parent as Element).children.splice(idx, 1, calloutDiv);
    });
  };
}
