import fs from "node:fs";
import path from "node:path";

/**
 * Resolves the Obsidian vault directory for the blog content collection.
 *
 * Priority:
 *   1. OBSIDIAN_VAULT_PATH env var (cross-platform, user-configured)
 *   2. Local fallback: src/content/blog/ (works out of the box)
 *
 * On macOS with iCloud, set:
 *   OBSIDIAN_VAULT_PATH=~/Library/Mobile\ Documents/iCloud~md~obsidian/Documents/369zen
 * On Windows with iCloud, set it to your iCloudDrive path.
 */
export function getVaultPath(): string {
  const envPath = process.env.OBSIDIAN_VAULT_PATH;
  if (envPath) {
    const resolved = path.resolve(envPath);
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
