import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Astro's Vite env loading has a timing issue: content.config.ts may be
// evaluated before .env is loaded. Load it manually so the vault path is
// available during the content collection type-generation phase.
function loadDotEnv() {
  const envFile = path.resolve(".env");
  try {
    const content = fs.readFileSync(envFile, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // .env doesn't exist — that's fine, use fallback
  }
}
loadDotEnv();

/**
 * Resolves the Obsidian vault directory for the blog content collection.
 *
 * Priority:
 *   1. OBSIDIAN_VAULT_PATH env var (cross-platform, user-configured)
 *   2. Local fallback: src/content/blog/ (works out of the box)
 *
 * Configure via .env:
 *   OBSIDIAN_VAULT_PATH=~/Library/Mobile Documents/iCloud~md~obsidian/Documents/369zen
 */
export function getVaultPath(): string {
  const envPath = process.env.OBSIDIAN_VAULT_PATH;
  if (envPath) {
    const expanded = envPath.startsWith("~") ? envPath.replace("~", os.homedir()) : envPath;
    const resolved = path.resolve(expanded);
    if (isReadable(resolved)) return resolved;
  }

  return path.resolve("src", "content", "blog");
}

function isReadable(dir: string): boolean {
  try {
    fs.readdirSync(dir);
    return true;
  } catch {
    return false;
  }
}
