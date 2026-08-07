import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONVEX_URL = "https://shocking-woodpecker-506.convex.cloud";

async function callMutation(fnPath, args) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: fnPath, args }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Convex ${fnPath} failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  if (json.status === "error") {
    throw new Error(`Convex ${fnPath} error: ${json.errorMessage}`);
  }
  return json.value;
}

function removeDirectoryCompletely(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`  ✓ Completely deleted folder: ${path.basename(dirPath)}`);
  }
}

async function main() {
  console.log("=== COMPLETE CLEAN SLATE RESET ===");

  const statsDir = path.join(__dirname, "..", "data", "stats");
  const transfersDir = path.join(__dirname, "..", "data", "transfers");
  const legacyDir = path.join(__dirname, "..", "data", "stats_and_transfers");

  console.log("Deleting folders: stats, transfers, stats_and_transfers...");
  removeDirectoryCompletely(statsDir);
  removeDirectoryCompletely(transfersDir);
  removeDirectoryCompletely(legacyDir);

  console.log("\nClearing careerStats table in Convex...");
  let clearedStats = 0;
  while (true) {
    const res = await callMutation("careerStats/mutations:clearAll", {});
    clearedStats += res.deleted;
    if (!res.remaining || res.deleted === 0) break;
  }
  console.log(`  ✓ Cleared ${clearedStats} careerStats items from Convex.`);

  console.log("Clearing playerTransfers table in Convex...");
  let clearedTransfers = 0;
  while (true) {
    const res = await callMutation("transfers/mutations:clearAll", {});
    clearedTransfers += res.deleted;
    if (!res.remaining || res.deleted === 0) break;
  }
  console.log(`  ✓ Cleared ${clearedTransfers} playerTransfers items from Convex.`);

  console.log("\n✓ Clean slate reset complete!");
}

main().catch((err) => {
  console.error("Clean slate failed:", err);
  process.exit(1);
});
