/**
 * Copies non-markdown assets from the Obsidian iCloud vault into dist/blog/
 * so images stored alongside articles are served at the correct URL.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { AstroIntegration } from "astro";

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

const VAULT_DIR = isReadable(iCloudVault) ? iCloudVault : localFallback;

const IMAGE_EXTS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif", ".mp4",
]);

function copyAssets(srcDir: string, outDir: string) {
  if (!fs.existsSync(srcDir)) return;
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(outDir, entry.name);
    if (entry.isDirectory()) {
      copyAssets(src, dest);
    } else if (IMAGE_EXTS.has(path.extname(entry.name).toLowerCase())) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
  }
}

export function contentImages(): AstroIntegration {
  return {
    name: "content-images",
    hooks: {
      "astro:build:done": ({ dir }) => {
        const dest = path.join(dir.pathname, "blog");
        copyAssets(VAULT_DIR, dest);
      },
      "astro:server:setup": ({ server }) => {
        server.middlewares.use((req, _res, next) => {
          const url = new URL(req.url ?? "", "http://localhost");
          if (url.pathname.startsWith("/blog/")) {
            const ext = path.extname(url.pathname).toLowerCase();
            if (IMAGE_EXTS.has(ext)) {
              const relativePath = url.pathname.slice("/blog/".length);
              const filePath = path.join(VAULT_DIR, relativePath);
              if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath);
                const mime: Record<string, string> = {
                  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                  ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
                  ".avif": "image/avif", ".mp4": "video/mp4",
                };
                _res.writeHead(200, { "Content-Type": mime[ext] ?? "application/octet-stream" });
                _res.end(content);
                return;
              }
            }
          }
          next();
        });
      },
    },
  };
}
