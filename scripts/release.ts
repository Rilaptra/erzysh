import { join } from "node:path";
import { spawnSync } from "bun";
import chalk from "chalk"; // Reuse chalk from zylog dependencies
import { ZyLog, zyLog } from "../src/lib/zylog";

// --- 🛠️ UTILS ---

class Shell {
  // Return object biar bisa dianalisis error-nya
  static exec(cmd: string | string[], opts: { cwd?: string; silent?: boolean } = {}) {
    const cmdArr = Array.isArray(cmd) ? cmd : cmd.split(" ");
    const cmdStr = Array.isArray(cmd) ? cmd.join(" ") : cmd;

    if (!opts.silent) {
      // Gunakan zyLog.cmd untuk log command
      zyLog.cmd(cmdStr);
    }

    const proc = spawnSync(cmdArr, {
      cwd: opts.cwd || process.cwd(),
      stdio: ["ignore", "pipe", "pipe"], // Pipe stderr to read errors
    });

    const output = proc.stdout.toString().trim();
    const error = proc.stderr.toString().trim();

    return {
      success: proc.exitCode === 0,
      code: proc.exitCode,
      output,
      error,
    };
  }

  // Wrapper standar yang throw error
  static run(cmd: string | string[], opts: { cwd?: string; silent?: boolean } = {}) {
    const res = this.exec(cmd, opts);
    if (!res.success) {
      throw new Error(`Command failed: ${Array.isArray(cmd) ? cmd.join(" ") : cmd}\n${chalk.red(res.error)}`);
    }
    return res.output;
  }
}

class Spinner {
  static async run<T>(label: string, task: () => Promise<T>): Promise<T> {
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let i = 0;

    // Tulis manual ke stdout biar animasi jalan (ZyLog nge-log per baris)
    process.stdout.write(`${chalk.cyan("⠋")} ${label}`);

    const timer = setInterval(() => {
      process.stdout.write(`\r${chalk.cyan(frames[i++ % frames.length])} ${label}`);
    }, 80);

    try {
      const result = await task();
      clearInterval(timer);
      // Clear baris spinner manual
      process.stdout.write(`\r\x1B[2K`);
      // Log success pake ZyLog biar formatnya konsisten (ada timestamp dll)
      zyLog.success(label);
      return result;
    } catch (e) {
      clearInterval(timer);
      process.stdout.write(`\r\x1B[2K`);
      zyLog.error(`${label} - Failed`);
      throw e;
    }
  }
}

class Prompt {
  static async confirm(question: string): Promise<boolean> {
    process.stdout.write(`${chalk.yellow("?")} ${question} (y/N) `);
    for await (const line of console) {
      return line.trim().toLowerCase() === "y";
    }
    return false;
  }
}

// --- 🤖 AI MANAGER ---
class AIManager {
  private static API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  private static MODEL = "gemini-1.5-flash";

  static async generateChangelog(version: string, diff: string): Promise<string> {
    const log = ZyLog.withScope("AI"); // Scoped Log

    if (!this.API_KEY) {
      log.warn("No API Key found. Skipping AI generation.");
      return `## [${version}] - ${new Date().toISOString().split("T")[0]}\n- Manual release.\n`;
    }

    const cleanDiff = diff.length > 30000 ? diff.substring(0, 30000) + "\n... (truncated)" : diff;

    const prompt = `
      You are the DevOps Lead for "Eryzsh".
      Analyze these git diffs and write a CHANGELOG entry for v${version}.
      Rules:
      1. Use "Keep a Changelog" format (Added, Changed, Fixed).
      2. No main header.
      3. Use cool emojis (✨, 🚀, 🐛, 🛠️).
      4. Be concise.
      Diffs:
      ${cleanDiff}
    `;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.MODEL}:generateContent?key=${this.API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        },
      );

      const data = (await res.json()) as any;
      if (data.error) throw new Error(data.error.message);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return `## [${version}] - ${new Date().toISOString().split("T")[0]}\n\n${text.trim()}\n\n`;
    } catch (error: any) {
      log.error(`AI Error: ${error.message}`);
      return `## [${version}]\n- Release generated (AI failed).`;
    }
  }
}

// --- 🔄 RELEASE MANAGER ---
class ReleaseManager {
  private root = process.cwd();
  private paths = {
    cargo: join(this.root, "ghost-agent", "Cargo.toml"),
    changelog: join(this.root, "CHANGELOG.md"),
    versionTs: join(this.root, "src", "lib", "version.ts"),
  };

  private backups: Record<string, string> = {};

  // Helper untuk log Step
  private logStep(step: number, total: number, msg: string) {
    ZyLog.withScope(`STEP ${step}/${total}`).info(chalk.bold(msg));
  }

  private printHeader() {
    console.clear();
    console.log(
      chalk.cyan(`  ERZY.SH v${process.env.npm_package_version || "DEV"} :: Automated Pipeline
`),
    );
  }

  async init() {
    this.printHeader();

    const log = zyLog; // Base logger

    // 0. Pre-flight Integrity Check
    await this.ensureGitCleanliness();

    if (!(await Bun.file(this.paths.cargo).exists())) {
      log.error("Cargo.toml not found in ghost-agent/!");
      process.exit(1);
    }

    // 1. Backup
    await this.backup();

    try {
      const skipBuild = await Prompt.confirm("Skip Rust compilation?");
      const totalSteps = skipBuild ? 5 : 6;
      let step = 1;

      // STEP 1: Bump
      this.logStep(step++, totalSteps, "Bumping Version");
      const { oldVer, newVer } = await this.bumpCargo();
      log.info(`Bump: ${chalk.dim(oldVer)} ➜ ${chalk.green.bold(newVer)}`);

      // STEP 2: Changelog
      this.logStep(step++, totalSteps, "Generating Changelog");
      const diff = Shell.run("git diff HEAD", { silent: true });
      const changelog = await Spinner.run("Consulting Gemini...", async () => {
        return await AIManager.generateChangelog(newVer, diff);
      });
      await this.updateChangelog(changelog);

      // STEP 3: Frontend Sync
      this.logStep(step++, totalSteps, "Syncing Typescript");
      await this.updateVersionTs(newVer);

      // STEP 4: Build
      if (!skipBuild) {
        this.logStep(step++, totalSteps, "Compiling Binary");
        await Spinner.run("Cargo Build (Release)...", async () => {
          Shell.run(["cargo", "build", "--release", "--manifest-path", this.paths.cargo]);
        });
      }

      // STEP 5: Git Ops
      this.logStep(step++, totalSteps, "Git Commit & Tag");
      Shell.run("git add .", { silent: true });
      Shell.run(["git", "commit", "-m", `chore(release): bump to v${newVer}`], { silent: true });

      // Handle Local Tag Collision
      const tagExists = Shell.exec(["git", "tag", "-l", `v${newVer}`]).output;
      if (tagExists) {
        log.warn(`Tag v${newVer} already exists locally. Overwriting...`);
        Shell.run(["git", "tag", "-d", `v${newVer}`], { silent: true });
      }
      Shell.run(["git", "tag", `v${newVer}`], { silent: true });
      log.success("Tagged & Committed.");

      // STEP 6: Smart Deploy (Auto-Fixing)
      this.logStep(step++, totalSteps, "Smart Deploy");
      await Spinner.run("Pushing to Origin...", async () => {
        await this.smartPush("main");
        await this.smartPushTag(`v${newVer}`);
      });

      this.summary(newVer, skipBuild);
    } catch (error: any) {
      log.error(`Pipeline Failed: ${error.message}`);
      await this.rollback();
      process.exit(1);
    }
  }

  // --- SMART GIT OPERATIONS ---

  private async ensureGitCleanliness() {
    zyLog.info("Checking git status...");
    // Update remote refs first
    Shell.run("git fetch origin", { silent: true });

    // Check if behind
    const status = Shell.exec("git status -uno");
    if (status.output.includes("Your branch is behind")) {
      zyLog.warn("Local branch is behind remote. Auto-pulling...");
      Shell.run("git pull --rebase origin main");
    }
  }

  /**
   * Pushes commits with Auto-Rebase fallback.
   */
  private async smartPush(branch: string) {
    const push = Shell.exec(["git", "push", "origin", branch]);

    if (push.success) return;

    // Error Handling Logic
    const err = push.error;

    // Case 1: Remote changes need to be pulled (fetch first / non-fast-forward)
    if (err.includes("fetch first") || err.includes("non-fast-forward") || err.includes("rejected")) {
      zyLog.warn("Remote is ahead. Attempting Auto-Rebase...");

      const pull = Shell.exec(["git", "pull", "--rebase", "origin", branch]);

      if (!pull.success) {
        // Rebase failed (Conflict)
        Shell.run("git rebase --abort", { silent: true }); // Cleanup mess
        throw new Error(`Auto-Rebase failed due to conflicts. Please resolve manually.`);
      }

      zyLog.success("Rebase successful. Retrying push...");
      Shell.run(["git", "push", "origin", branch]); // Retry push
      return;
    }

    // Unknown error
    throw new Error(`Push failed: ${err}`);
  }

  /**
   * Pushes tags with "Force Update" option.
   */
  private async smartPushTag(tagName: string) {
    const push = Shell.exec(["git", "push", "origin", tagName]);

    if (push.success) return;

    const err = push.error;

    // Case 1: Tag exists on remote
    if (err.includes("already exists")) {
      zyLog.warn(`Tag ${tagName} exists on remote!`);
      zyLog.warn("Force updating remote tag to match new commit...");
      Shell.run(["git", "push", "--force", "origin", tagName]);
      return;
    }

    throw new Error(`Tag push failed: ${err}`);
  }

  // --- STANDARD HELPERS ---

  private async backup() {
    this.backups["cargo"] = await Bun.file(this.paths.cargo).text();
    this.backups["changelog"] = (await Bun.file(this.paths.changelog).exists())
      ? await Bun.file(this.paths.changelog).text()
      : "";
    this.backups["versionTs"] = (await Bun.file(this.paths.versionTs).exists())
      ? await Bun.file(this.paths.versionTs).text()
      : "";
  }

  private async rollback() {
    zyLog.warn("♻ Rolling back changes...");
    await Bun.write(this.paths.cargo, this.backups["cargo"]);
    await Bun.write(this.paths.changelog, this.backups["changelog"]);
    await Bun.write(this.paths.versionTs, this.backups["versionTs"]);
    Shell.run("git reset --hard HEAD", { silent: true });

    try {
      const currentTag = Shell.exec("git tag --points-at HEAD").output.trim();
      if (currentTag) Shell.run(["git", "tag", "-d", currentTag], { silent: true });
    } catch {}

    zyLog.success("System restored.");
  }

  private async bumpCargo() {
    const content = this.backups["cargo"];
    const match = content.match(/version\s*=\s*"([^"]+)"/);
    if (!match) throw new Error("Could not parse version");
    const oldVer = match[1];
    const parts = oldVer.split(".").map(Number);
    parts[2]++;
    const newVer = parts.join(".");
    const newContent = content.replace(`version = "${oldVer}"`, `version = "${newVer}"`);
    await Bun.write(this.paths.cargo, newContent);
    return { oldVer, newVer };
  }

  private async updateChangelog(entry: string) {
    let current = this.backups["changelog"] || "# Changelog\n\n";
    const headerPattern = /# Changelog\n+/;
    if (headerPattern.test(current)) {
      current = current.replace(headerPattern, `# Changelog\n\n${entry}`);
    } else {
      current = `# Changelog\n\n${entry}${current}`;
    }
    await Bun.write(this.paths.changelog, current);
  }

  private async updateVersionTs(ver: string) {
    const ts = `// Auto-generated by scripts/release.ts\nexport const GHOST_VERSION = "${ver}";\nexport const BUILD_DATE = "${new Date().toISOString()}";\n`;
    await Bun.write(this.paths.versionTs, ts);
  }

  private summary(ver: string, skipped: boolean) {
    console.log(`\n${chalk.gray("────────────────────────────────────────")}`);
    console.log(`  ${chalk.green("🚀 ERYZSH v" + ver + " DEPLOYED!")}`);
    console.log(`${chalk.gray("────────────────────────────────────────")}`);
    console.log(`  📦 Version : ${chalk.bold(ver)}`);
    console.log(`  🏗️  Build   : ${skipped ? chalk.yellow("Skipped") : chalk.green("Completed")}`);
    console.log(`  📝 Changelog: Updated`);
    console.log(`\n${chalk.dim("System ready.")}\n`);
  }
}

// 🔥 IGNITION
new ReleaseManager().init();
