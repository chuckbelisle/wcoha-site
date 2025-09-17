// Usage: node scripts/fetch-sponsors.mjs public/sponsors data/sponsors.json
import fs from "node:fs/promises";
import path from "node:path";

const outDir = process.argv[2] || "public/sponsors";
const jsonPath = process.argv[3] || "data/sponsors.json";
await fs.mkdir(outDir, { recursive: true });

const sponsors = JSON.parse(await fs.readFile(jsonPath, "utf8"));

async function download(url, dest) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Referer: "https://www.wcoha.ca/",
      Accept: "*/*",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
}

for (const s of sponsors) {
  const file = path.basename(s.localSrc);
  const dest = path.join(outDir, file);

  if (!s.remoteUrl) {
    console.log(`Skipping ${s.name}: no remoteUrl`);
    continue;
  }

  console.log(`Downloading ${s.name} -> ${dest}`);
  try {
    await download(s.remoteUrl, dest);
  } catch (e) {
    console.warn(`  ⚠️  Failed: ${e.message}. Keeping placeholder for ${file}`);
  }
}
