import chalk from "chalk";

/**
 * Available log levels for ZyLog.
 */
export type LogLevel =
  | "info"
  | "success"
  | "warn"
  | "error"
  | "critical"
  | "debug"
  | "cmd";

/**
 * Configuration options for a ZyLog instance.
 */
export interface LogConfig {
  /**
   * Optional scope string to be displayed in the log, e.g., "[API]".
   */
  scope?: string;
  /**
   * Whether to display a timestamp. Defaults to true.
   */
  timestamp?: boolean;
}

/**
 * ZyLog: A flexible, ASCII-only, styled logging utility for Node.js and Browser environments.
 * Uses `chalk` for terminal coloring.
 *
 * @example
 * ```typescript
 * import { zyLog } from "@/lib/zylog";
 *
 * zyLog.info("Server started");
 * zyLog.success("Database connected");
 * zyLog.error("Connection failed", new Error("Timeout"));
 *
 * // Scoped logger
 * const apiLog = ZyLog.withScope("API");
 * apiLog.warn("Rate limit exceeded");
 * ```
 */
export class ZyLog {
  private config: LogConfig;

  /**
   * Creates a new instance of ZyLog.
   * @param config - Configuration object
   */
  constructor(config: LogConfig = { timestamp: true }) {
    this.config = config;
  }

  /**
   * Generates the timestamp string if enabled.
   */
  private getTimestamp(): string {
    if (!this.config.timestamp) return "";
    const now = new Date();
    // Compact timestamp: HH:MM:ss
    return chalk.gray(
      `[${now.toLocaleTimeString("en-GB", { hour12: false })}] `,
    );
  }

  /**
   * Generates the scope string if defined.
   */
  private formatScope(): string {
    return this.config.scope ? chalk.magenta(`[${this.config.scope}] `) : "";
  }

  /**
   * The main logging method.
   * @param level - The log level (info, success, warn, etc.)
   * @param message - The main message string
   * @param args - Additional arguments to be logged
   */
  public log(level: LogLevel, message: string, ...args: any[]) {
    const timestamp = this.getTimestamp();
    const scope = this.formatScope();

    let prefix = "";
    let styledMessage = message;

    switch (level) {
      case "info":
        prefix = chalk.blue("[*] INFO    :");
        styledMessage = chalk.blueBright(message);
        break;
      case "success":
        prefix = chalk.green("[+] SUCCESS :");
        styledMessage = chalk.greenBright(message);
        break;
      case "warn":
        prefix = chalk.yellow("[!] WARNING :");
        styledMessage = chalk.yellowBright(message);
        break;
      case "error":
        prefix = chalk.red("[-] ERROR   :");
        styledMessage = chalk.redBright(message);
        break;
      case "critical":
        prefix = chalk.bgRed.white.bold("[X] CRITICAL:");
        styledMessage = chalk.red.bold(message);
        break;
      case "debug":
        prefix = chalk.gray("[?] DEBUG   :");
        styledMessage = chalk.gray(message);
        break;
      case "cmd":
        prefix = chalk.cyan("[$] EXEC    :");
        styledMessage = chalk.cyanBright(message);
        break;
    }

    // Console log wrapper to ensure correct output stream
    if (level === "error" || level === "critical") {
      console.error(`${timestamp}${scope}${prefix} ${styledMessage}`, ...args);
    } else {
      console.log(`${timestamp}${scope}${prefix} ${styledMessage}`, ...args);
    }
  }

  /**
   * Logs an informational message.
   * @param message Message to log
   * @param args Additional data
   */
  public info(message: string, ...args: any[]) {
    this.log("info", message, ...args);
  }

  /**
   * Logs a success message.
   * @param message Message to log
   * @param args Additional data
   */
  public success(message: string, ...args: any[]) {
    this.log("success", message, ...args);
  }

  /**
   * Logs a warning message.
   * @param message Message to log
   * @param args Additional data
   */
  public warn(message: string, ...args: any[]) {
    this.log("warn", message, ...args);
  }

  /**
   * Logs an error message.
   * @param message Message to log
   * @param args Additional data (e.g. Error object)
   */
  public error(message: string, ...args: any[]) {
    this.log("error", message, ...args);
  }

  /**
   * Logs a critical error message.
   * @param message Message to log
   * @param args Additional data
   */
  public critical(message: string, ...args: any[]) {
    this.log("critical", message, ...args);
  }

  /**
   * Logs a debug message.
   * @param message Message to log
   * @param args Additional data
   */
  public debug(message: string, ...args: any[]) {
    this.log("debug", message, ...args);
  }

  /**
   * Logs a command execution message.
   * @param message Command string being executed
   * @param args Additional data
   */
  public cmd(message: string, ...args: any[]) {
    this.log("cmd", message, ...args);
  }

  /**
   * Creates a new ZyLog instance with a specific scope.
   * @param scope - The scope name (e.g. "Database", "Auth")
   * @returns A new ZyLog instance
   */
  public static withScope(scope: string): ZyLog {
    return new ZyLog({ scope, timestamp: true });
  }
}

/**
 * The default global singleton instance of ZyLog.
 */
export const zyLog = new ZyLog();
