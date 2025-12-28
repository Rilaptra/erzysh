#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { execSync, spawnSync } from "child_process";
import * as readline from "readline";

/**
 * 🎨 UI & UX UTILITIES
 * Keep it lightweight, no external dependencies needed.
 */
const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
};

const UI = {
  log: (msg: string) => console.log(msg),
  info: (msg: string) => console.log(`${COLORS.cyan}ℹ  ${msg}${COLORS.reset}`),
  success: (msg: string) => console.log(`${COLORS.green}✔  ${msg}${COLORS.reset}`),
  warn: (msg: string) => console.log(`${COLORS.yellow}⚠  ${msg}${COLORS.reset}`),
  error: (msg: string) => console.log(`${COLORS.red}✖  ${msg}${COLORS.reset}`),
  step: (step: number, total: number, msg: string) => 
    console.log(`\n${COLORS.magenta}[${step}/${total}]${COLORS.reset} ${COLORS.bright}${msg}${COLORS.reset}`),
  
  header: () => {
    console.clear();
    console.log(`${COLORS.cyan}${COLORS.bright}
   ____  __ __  ____  _____ ______
  /    ||  |  ||    |/ ___/|      |
 |   __||  |  ||  ||   \\_ |      |
 |  |  ||  _  ||  | \\__  ||_|  |_|
 |  |_ ||  |  ||  | /  \\ |  |  |  
 |     ||  |  ||  | \\    |  |  |  
 |___,_||__|__||____|\\___|  |__|  
 ${COLORS.reset}${COLORS.dim}   :: AUTOMATED RELEASE SYSTEM ::   ${COLORS.reset}\n`);
  },

  ask: (question: string): Promise<boolean> => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(`${COLORS.yellow}? ${question} (y/N) ${COLORS.reset}`, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
      });
    });
  },
};

// --- CONFIGURATION ---
const rootDir = process.cwd();
const cargoPath = join(rootDir, "ghost-agent", "Cargo.toml");
const changelogPath = join(rootDir, "ghost-agent", "CHANGELOG.md");
const versionTsPath = join(rootDir, "src", "lib", "version.ts");

// --- HELPER FUNCTIONS ---

function runCmd(command: string, opts: { silent?: boolean; cwd?: string } = {}) {
  try {
    const options: any = { 
      cwd: opts.cwd || rootDir, 
      stdio: opts.silent ? "pipe" : "inherit",
      encoding: "utf-8"
    };
    
    // For blocking commands where we want output (like cargo build), use execSync or spawnSync with inherit
    if (!opts.silent) {
        console.log(`${COLORS.gray}$ ${command}${COLORS.reset}`);
        execSync(command, options);
    } else {
        // Silent execution (good for git commands)
        execSync(command, options);
    }
  } catch (e: any) {
    UI.error(`Command failed: ${command}`);
    if (opts.silent && e.stdout) console.log(e.stdout.toString());
    if (opts.silent && e.stderr) console.error(e.stderr.toString());
    process.exit(1);
  }
}

async function loadingSpinner<T>(label: string, task: () => Promise<T>): Promise<T> {
  process.stdout.write(`${COLORS.cyan}⠋ ${label}${COLORS.reset}`);
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  
  const interval = setInterval(() => {
    process.stdout.write(`\r${COLORS.cyan}${frames[i]} ${label}${COLORS.reset}`);
    i = (i + 1) % frames.length;
  }, 80);

  try {
    const result = await task();
    clearInterval(interval);
    process.stdout.write(`\r${COLORS.green}✔ ${label}${COLORS.reset}\n`);
    return result;
  } catch (error) {
    clearInterval(interval);
    process.stdout.write(`\r${COLORS.red}✖ ${label}${COLORS.reset}\n`);
    throw error;
  }
}

// --- CORE LOGIC ---

async function generateAIChangelog(version: string, date: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    UI.warn("GEMINI_API_KEY missing. Skipping AI magic.");
    return `## [${version}] - ${date}\n\n### Added\n- Manual release update.\n\n`;
  }

  // Get Git Log
  let gitLog = "";
  try {
    const lastTag = execSync("git describe --tags --abbrev=0", { encoding: "utf-8" }).trim();
    gitLog = execSync(`git log ${lastTag}..HEAD --pretty=format:"- %s (%h)"`, { encoding: "utf-8" });
  } catch {
    gitLog = "Initial release or no tags found.";
  }

  const prompt = `
    Role: Senior Tech Lead.
    Task: Write a CHANGELOG.md entry for v${version} (${date}).
    
    Commits:
    ${gitLog}
    
    Style Guide:
    - Format: "Keep a Changelog" (Added, Changed, Fixed).
    - Tone: Cool, concise, cyberpunk/hacker vibe.
    - No header "## [Version]". Just the body.
    - Use relevant emojis.
  `;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  if (!response.ok) throw new Error(`Gemini status: ${response.status}`);
  
  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  return `## [${version}] - ${date}\n\n${content ? content.trim() : "AI returned empty."}\n\n`;
}

async function main() {
  UI.header();

  // 0. Configuration Check
  const skipBuild = await UI.ask("Skip Rust compilation (Cargo Build)?");
  
  const totalSteps = skipBuild ? 5 : 6;
  let currentStep = 1;

  try {
    // 1. Read & Bump Version
    UI.step(currentStep++, totalSteps, "Bumping Version in Cargo.toml");
    let cargoContent = readFileSync(cargoPath, "utf-8");
    const versionMatch = cargoContent.match(/version\s*=\s*"([^"]+)"/);
    if (!versionMatch) throw new Error("Invalid Cargo.toml");

    const oldVersion = versionMatch[1];
    const vParts = oldVersion.split(".").map(Number);
    vParts[2]++; // Patch bump
    const newVersion = vParts.join(".");
    
    cargoContent = cargoContent.replace(`version = "${oldVersion}"`, `version = "${newVersion}"`);
    writeFileSync(cargoPath, cargoContent);
    UI.success(`Version bumped: ${COLORS.dim}${oldVersion}${COLORS.reset} -> ${COLORS.bright}${newVersion}${COLORS.reset}`);

    // 2. Generate Changelog
    UI.step(currentStep++, totalSteps, "Summoning Gemini for Changelog");
    const changelogEntry = await loadingSpinner("Analyzing commit history...", async () => {
      return await generateAIChangelog(newVersion, new Date().toISOString().split("T")[0]);
    });

    let changelogContent = readFileSync(changelogPath, "utf-8");
    // Insert after header
    if (changelogContent.includes("## [") || changelogContent.includes("# Changelog")) {
      const splitIdx = changelogContent.indexOf("\n\n") + 2;
      changelogContent = changelogContent.slice(0, splitIdx) + changelogEntry + changelogContent.slice(splitIdx);
    } else {
      changelogContent += "\n" + changelogEntry;
    }
    writeFileSync(changelogPath, changelogContent);

    // 3. Sync TS Version
    UI.step(currentStep++, totalSteps, "Syncing src/lib/version.ts");
    const tsContent = `// Auto-generated by scripts/release.ts\nexport const GHOST_VERSION = "${newVersion}";\nexport const BUILD_DATE = "${new Date().toISOString()}";\n`;
    writeFileSync(versionTsPath, tsContent);
    UI.success("Frontend version synced.");

    // 4. Build Rust (Conditional)
    if (!skipBuild) {
      UI.step(currentStep++, totalSteps, "Compiling Ghost Agent Core");
      UI.info("This might take a while. Grab a coffee. ☕");
      // Use standard stdio inherit to show cargo progress bar
      runCmd("cargo build --release --manifest-path ghost-agent/Cargo.toml");
      UI.success("Compilation complete.");
    } else {
      UI.warn("Skipping compilation as requested.");
    }

    // 5. Git Commit & Push
    UI.step(currentStep++, totalSteps, "Git Commit & Tag");
    runCmd("git add .", { silent: true });
    runCmd(`git commit -m "chore(release): bump to v${newVersion}"`, { silent: true });
    UI.success("Committed changes.");
    
    runCmd(`git tag v${newVersion}`, { silent: true });
    UI.success(`Tagged v${newVersion}`);

    // 6. Push
    UI.step(currentStep++, totalSteps, "Pushing to Remote");
    await loadingSpinner("Pushing code & tags...", async () => {
      runCmd("git push origin main", { silent: true }); // Change branch if needed
      runCmd(`git push origin v${newVersion}`, { silent: true });
    });

    // --- SUMMARY ---
    console.log(`\n${COLORS.gray}────────────────────────────────────────${COLORS.reset}`);
    console.log(`${COLORS.green}${COLORS.bright}  🚀 RELEASE v${newVersion} SUCCESSFUL! ${COLORS.reset}`);
    console.log(`${COLORS.gray}────────────────────────────────────────${COLORS.reset}`);
    console.log(`  ${COLORS.cyan}📦 Version:${COLORS.reset}   ${newVersion}`);
    console.log(`  ${COLORS.cyan}📅 Date:${COLORS.reset}      ${new Date().toLocaleDateString()}`);
    console.log(`  ${COLORS.cyan}🔗 Tag:${COLORS.reset}       v${newVersion}`);
    console.log(`  ${COLORS.cyan}🤖 AI Notes:${COLORS.reset}  Generated`);
    console.log(`${COLORS.gray}────────────────────────────────────────${COLORS.reset}\n`);

  } catch (error: any) {
    UI.error(`Critical Failure: ${error.message}`);
    process.exit(1);
  }
}

main();