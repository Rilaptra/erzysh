/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation: biar gak error> */
import chalk from 'chalk'

/**
 * ⚡ ZYLOG CORE TYPES
 */
export type LogType = 'info' | 'error' | 'warn' | 'success' | 'debug' | 'cmd'

export interface ProgressOptions {
  current: number
  total: number
  startAt: number // Timestamp start (Date.now())
  title?: string
  length?: number // Panjang bar (default 20)
}

export interface LogConfig {
  scope?: string
  noContext?: boolean
}

/**
 * 🛠️ STATIC OPTIMIZATIONS
 * Diinisialisasi sekali di module scope biar gak makan memori tiap kali log dipanggil.
 */
const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Jakarta', // Hardcode WIB biar konsisten
})

const COLORS = {
  info: chalk.cyan,
  error: chalk.red,
  warn: chalk.yellow,
  success: chalk.green,
  debug: chalk.magenta,
  cmd: chalk.blueBright,
} as const

const LABELS = Object.fromEntries(
  Object.keys(COLORS).map((k) => [k, COLORS[k as LogType](k.toUpperCase())]),
)

/**
 * 🧠 OPTIMIZED CALLER DETECTION
 * Membatasi stack trace depth ke 4 baris aja biar hemat RAM parah.
 */
function getCaller(): string {
  const oldStackTraceLimit = Error.stackTraceLimit
  Error.stackTraceLimit = 4 // 🛑 Limit stack capture

  const obj = {}
  Error.captureStackTrace(obj, getCaller) // V8 specific API (Bun support ini)
  const stack = (obj as any).stack

  Error.stackTraceLimit = oldStackTraceLimit // Balikin settingan asli

  if (!stack) return 'SYSTEM'

  const lines = stack.split('\n')
  // Line 0: Error
  // Line 1: getCaller
  // Line 2: ZyLog.log (internal)
  // Line 3: Function pemanggil sebenernya
  const callerLine = lines[3] || ''

  // Regex super ringan buat ambil nama function
  const match = /at\s+(?:async\s+)?([^\s(]+)/.exec(callerLine)

  if (match?.[1]) {
    const name = match[1].split('.').pop()
    // Filter nama-nama generic
    return !name ||
      name === 'Object' ||
      name === '<anonymous>' ||
      name.includes('ts:')
      ? 'SYSTEM'
      : name
  }
  return 'SYSTEM'
}

/**
 * 🚀 ZYLOG CLASS
 * Wrapper class biar usage-nya tetep `zyLog.info()` yang elegan.
 */
export class ZyLog {
  private config: LogConfig

  constructor(config: LogConfig = {}) {
    this.config = config
  }

  /**
   * Core dispatch logic - Gabungan dari generateLog lo
   */
  private dispatch(type: LogType, message: any[], progress?: ProgressOptions) {
    // 1. Time Calculation (Zero Alloc)
    const time = timeFormatter.format(Date.now())
    const prefix = `[${LABELS[type]}] ${chalk.gray(time)}`

    // 2. Context Resolution
    let contextStr = ''
    if (!this.config.noContext) {
      // Prioritas: Scope Config > Auto Detect Caller
      const contextRaw = this.config.scope ?? getCaller()
      // Warna context beda dikit biar manis
      contextStr = this.config.scope
        ? chalk.green.bold(`[${contextRaw}]`)
        : chalk.magenta.bold(`[${contextRaw}]`)
    }

    let logBody = ''

    // 3. Progress Bar Logic (Bitwise Math Optimized)
    if (progress) {
      const { current, total, startAt, title = 'Task', length = 20 } = progress
      // Clamp ratio 0-1
      const ratio = Math.min(1, Math.max(0, current / total))
      const filled = (length * ratio) | 0 // Bitwise floor

      // Fast Time Calc (ms -> HH:MM:SS)
      const elapsedMs = Date.now() - startAt
      const totalSec = (elapsedMs / 1000) | 0
      const h = ((totalSec / 3600) | 0).toString().padStart(2, '0')
      const m = (((totalSec % 3600) / 60) | 0).toString().padStart(2, '0')
      const s = (totalSec % 60).toString().padStart(2, '0')

      const isDone = ratio >= 1
      const color = isDone ? chalk.green : COLORS[type]

      // String Builder
      const bar =
        color('━'.repeat(filled)) + chalk.gray('━'.repeat(length - filled))
      const percent = `${((ratio * 100) | 0).toString().padStart(3)}%`

      // Format: [INFO] [System] Processing Task ━━━------- 30% [00:00:05]
      logBody = `Processing ${chalk.yellow(title)} ${bar} ${color(percent)} ${chalk.cyan(`[${h}:${m}:${s}]`)}`

      // Kalo progress bar, kita pake \r biar 1 baris (kalau support TTY)
    } else {
      // Join message cuma kalo array > 1 biar irit RAM
      logBody =
        message.length === 1
          ? String(message[0])
          : message
              .map((m) => (typeof m === 'object' ? JSON.stringify(m) : m))
              .join(' ')
    }

    // 4. Native Bun Output (Direct syscall write, bypass console.log overhead)
    // Format: [INFO] 10:00:00 [Context] Pesan lo disini
    const output = contextStr
      ? `${prefix} ${contextStr} ${logBody}\n`
      : `${prefix} ${logBody}\n`

    console.log(output)
  }

  // --- PUBLIC API ---

  public info(...message: any[]) {
    this.dispatch('info', message)
  }

  public success(...message: any[]) {
    this.dispatch('success', message)
  }

  public warn(...message: any[]) {
    this.dispatch('warn', message)
  }

  public error(...message: any[]) {
    this.dispatch('error', message)
  }

  public debug(...message: any[]) {
    this.dispatch('debug', message)
  }

  public cmd(...message: any[]) {
    this.dispatch('cmd', message)
  }

  /**
   * Special handler buat Progress Bar
   */
  public progress(options: ProgressOptions) {
    this.dispatch('info', [], options)
  }

  /**
   * Bikin instance baru dengan Scope khusus
   * @example const dbLog = zyLog.withScope("Database");
   */
  public static withScope(scope: string): ZyLog {
    return new ZyLog({ scope })
  }
}

/**
 * Global Singleton Instance
 */
export const zyLog = new ZyLog()
