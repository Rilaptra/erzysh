import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const cargoPath = join(process.cwd(), "ghost-agent", "Cargo.toml");

try {
  const cargoContent = readFileSync(cargoPath, "utf-8");
  const versionMatch = cargoContent.match(/version\s*=\s*"([^"]+)"/);

  if (versionMatch && versionMatch[1]) {
    const currentVersion = versionMatch[1];
    const parts = currentVersion.split(".").map(Number);

    // Increment patch version: 1.2.3 -> 1.2.4
    parts[2]++;
    const newVersion = parts.join(".");

    const newContent = cargoContent.replace(
      /version\s*=\s*"[^"]+"/,
      `version = "${newVersion}"`,
    );

    writeFileSync(cargoPath, newContent);
    console.log(`🚀 Version bumped: ${currentVersion} -> ${newVersion}`);

    // Trigger sync after bump
    import("./sync-version");
  } else {
    console.error("❌ Could not find version in Cargo.toml");
  }
} catch (error) {
  console.error("❌ Error bumping version:", error);
}
