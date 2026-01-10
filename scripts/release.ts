#!/usr/bin/env bun
import Bun from 'bun'
import { join } from 'path'
import * as readline from 'readline'

const COLORS = {
  reset: '\x1B[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
}

const UI = {
  log: (msg: string) => console.log(msg),
  info: (msg: string) => console.log(`${COLORS.cyan}ℹ  ${msg}${COLORS.reset}`),
  success: (msg: string) =>
    console.log(`${COLORS.green}✔  ${msg}${COLORS.reset}`),
  warn: (msg: string) =>
    console.log(`${COLORS.yellow}⚠  ${msg}${COLORS.reset}`),
  error: (msg: string) =>
    console.error(`${COLORS.red}✖  ${msg}${COLORS.reset}`),
  step: (step: number, total: number, msg: string) =>
    console.log(
      `\n${COLORS.magenta}[${step}/${total}]${COLORS.reset} ${COLORS.bright}${msg}${COLORS.reset}`,
    ),
  header: () => {
    console.clear()
    console.log(`\n${COLORS.cyan}${COLORS.bright}
 ____  ____  ____  _  _   ____  _  _     ___  __   _  _  _  _  __  ____ 
(  __)(  _ \\(__  )( \\/ ) / ___)/ )( \\   / __)/  \\ ( \\/ )( \\/ )(  )(_  _)
 ) _)  )   / / _/  )  /_ \\___ \\) __ (  ( (__(  O )/ \\/ \\/ \\/ \\ )(   )(  
(____)(__\\_)(____)(__/(_)(____/\\_)(_/   \\___)\\__/ \\_)(_/\\_)(_/(__) (__) 
${COLORS.reset}${COLORS.dim}   :: AUTOMATED BUILD & RELEASE ::   ${COLORS.reset}\n`)
  },
  ask: (question: string): Promise<boolean> => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    return new Promise((resolve) => {
      rl.question(
        `${COLORS.yellow}? ${question} (y/N) ${COLORS.reset}`,
        (answer) => {
          rl.close()
          resolve(
            answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes',
          )
        },
      )
    })
  },
}

const rootDir = process.cwd()
const cargoPath = join(rootDir, 'ghost-agent', 'Cargo.toml')

function runCmd(command: string[], cwd: string = rootDir) {
  const proc = Bun.spawnSync(command, {
    cwd,
    stdio: ['inherit', 'inherit', 'inherit'],
  })
  if (proc.exitCode !== 0) {
    throw new Error(`Command failed: ${command.join(' ')}`)
  }
}

async function main() {
  UI.header()

  const skipBuild = await UI.ask('Skip Ghost Agent build (Rust)?')
  const totalSteps = skipBuild ? 1 : 2
  let currentStep = 1

  try {
    if (!skipBuild) {
      UI.step(currentStep++, totalSteps, 'Compiling Ghost Agent Core')
      UI.info('Building release binary...')
      runCmd(['cargo', 'build', '--release', '--manifest-path', cargoPath])
      UI.success('Rust binary compiled.')
    } else {
      UI.warn('Skipping Rust compilation.')
    }
    const versionFile = await Bun.file(
      join(rootDir, 'src/lib/version.ts'),
    ).text()
    const NEW_BUILD_DATE = new Date().toISOString()
    const newVersionFile = versionFile.replace(
      /BUILD_DATE = .+/,
      `BUILD_DATE = '${NEW_BUILD_DATE}'`,
    )
    await Bun.write(join(rootDir, 'src/lib/version.ts'), newVersionFile)

    UI.step(currentStep++, totalSteps, 'Delegating to Digest CLI')
    UI.info(
      "Launching 'digest commit this' for versioning and git operations...",
    )

    // Hand over to digest
    runCmd(['digest', 'commit', 'this'])
  } catch (error: any) {
    UI.error(`Critical Failure: ${error.message}`)
    process.exit(1)
  }
}

main()
