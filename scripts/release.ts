import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { zyLog } from "../src/lib/zylog";

// Paths
const rootDir = process.cwd();
const cargoPath = join(rootDir, "ghost-agent", "Cargo.toml");
const changelogPath = join(rootDir, "ghost-agent", "CHANGELOG.md");
const versionTsPath = join(rootDir, "src", "lib", "version.ts");

function run(command: string) {
  try {
    zyLog.cmd(command);
    execSync(command, { stdio: "inherit", cwd: rootDir });
  } catch (e) {
    zyLog.error(`Failed to execute: ${command}`);
    process.exit(1);
  }
}

function getFormattedDate() {
  const date = new Date();
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

// --- GEMINI INTEGRATION ---
async function generateChangelog(
  version: string,
  date: string,
): Promise<string> {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    zyLog.warn("GEMINI_API_KEY not found. Skipping AI changelog generation.");
    return `## [${version}] - ${date}\n\n### Added\n- Auto-generated release.\n\n`;
  }

  try {
    zyLog.info("🤖 Asking Gemini to write release notes...");

    // Get git log since last tag
    let gitLog = "";
    try {
      const lastTag = execSync("git describe --tags --abbrev=0", {
        encoding: "utf-8",
      }).trim();
      gitLog = execSync(
        `git log ${lastTag}..HEAD --pretty=format:"- %s (%h)"`,
        { encoding: "utf-8" },
      );
    } catch (e) {
      zyLog.warn("Could not get git log, using default.");
      gitLog = "No git log available.";
    }

    const prompt = `
      You are an expert software release manager and technical writer.
      Generate a concise but professional CHANGELOG.md entry for version ${version} released on ${date}.
      
      Here are the commit messages since the last release:
      ${gitLog}
      
      Rules:
      1. Follow "Keep a Changelog" format.
      2. Group changes into "Added", "Changed", "Fixed", "Removed".
      3. Do NOT include the "## [Version] - Date" header, just the content.
      4. Use a cool, tech-savvy tone suitable for a hacker/developer tool.
      5. Add a short "Release Summary" at the top (1-2 sentences).
      6. Use emojis where appropriate but keep it clean.
      7. Return ONLY the markdown content.
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Gemini API Error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) throw new Error("No content returned from Gemini");

    zyLog.success("🤖 Gemini generated release notes!");
    return `## [${version}] - ${date}\n\n${content.trim()}\n\n`;
  } catch (error: any) {
    zyLog.error("Failed to generate AI changelog:", error.message);
    return `## [${version}] - ${date}\n\n### Added\n- Auto-generated release (AI Failed).\n\n`;
  }
}

async function bumpVersion() {
  try {
    // 1. Read Cargo.toml
    zyLog.info("Reading Cargo.toml...");
    let cargoContent = readFileSync(cargoPath, "utf-8");
    const versionMatch = cargoContent.match(/version\s*=\s*"([^"]+)"/);

    if (!versionMatch || !versionMatch[1]) {
      throw new Error("Could not find version in Cargo.toml");
    }

    const currentVersion = versionMatch[1];
    const parts = currentVersion.split(".").map(Number);
    parts[2]++; // Increment patch
    const newVersion = parts.join(".");

    zyLog.info(`Bumping version: ${currentVersion} -> ${newVersion}`);

    // 2. Update Cargo.toml
    cargoContent = cargoContent.replace(
      /version\s*=\s*"[^"]+"/,
      `version = "${newVersion}"`,
    );
    writeFileSync(cargoPath, cargoContent);

    // 3. Update CHANGELOG.md
    zyLog.info("Updating CHANGELOG.md...");
    let changelogContent = readFileSync(changelogPath, "utf-8");
    const date = getFormattedDate();

    // Check if the current version is already in changelog (idempotency)
    if (!changelogContent.includes(`[${newVersion}]`)) {
      // GENERATE CONTENT WITH GEMINI
      const newEntry = await generateChangelog(newVersion, date);

      // Insert after the first header or specific marker
      const firstSectionIndex = changelogContent.indexOf("## [");
      const headerEndIndex = changelogContent.indexOf("\n\n") + 2;

      let newChangelog = "";
      if (firstSectionIndex !== -1) {
        newChangelog =
          changelogContent.substring(0, firstSectionIndex) +
          newEntry +
          changelogContent.substring(firstSectionIndex);
      } else {
        // Try to respect existing header if present
        if (changelogContent.startsWith("# Changelog")) {
          newChangelog =
            changelogContent.substring(0, headerEndIndex) +
            newEntry +
            changelogContent.substring(headerEndIndex);
        } else {
          newChangelog = changelogContent + "\n" + newEntry;
        }
      }

      writeFileSync(changelogPath, newChangelog);
    }

    // 4. Update src/lib/version.ts
    zyLog.info("Syncing version.ts...");
    const tsContent = `// This file is auto-generated by scripts/release.ts
export const GHOST_VERSION = "${newVersion}";
export const BUILD_DATE = "${new Date().toISOString()}";
`;
    writeFileSync(versionTsPath, tsContent);

    // 5. Build Ghost Agent (Release Mode)
    zyLog.info("Building Ghost Agent (Release)...");
    run("cargo build --release --manifest-path ghost-agent/Cargo.toml");

    // 6. Git Commit & Tag
    zyLog.info("Committing to Git...");
    run("git add .");
    run(`git commit -m "chore(release): bump to v${newVersion}"`);
    run(`git tag v${newVersion}`);

    zyLog.info("Pushing to GitHub...");
    run("git push origin main"); // Assuming main branch
    run(`git push origin v${newVersion}`);

    zyLog.success(`Successfully released v${newVersion}!`);
    zyLog.info(
      "GitHub Actions should now pick up the tag and create a Release.",
    );
  } catch (error) {
    zyLog.error("Error during release:", error);
    process.exit(1);
  }
}

bumpVersion();
