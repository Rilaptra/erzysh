import { execSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { zyLog } from '../src/lib/zylog'

const rootDir = process.cwd()
const isTestMode = process.argv[2] === 'test'

interface EnvVarItem {
  key: string
  desc: string
  required: boolean
  default?: string
  sameAs?: string
}

interface EnvGroup {
  category: string
  items: EnvVarItem[]
}

const envVars: EnvGroup[] = [
  {
    category: '🔐 Authentication',
    items: [
      {
        key: 'JWT_SECRET',
        desc: 'Secret key for JWT (min 32 chars)',
        required: true,
      },
    ],
  },
  {
    category: '🤖 Discord Integration',
    items: [
      {
        key: 'DISCORD_BOT_TOKEN',
        desc: 'Bot Token from Discord Developer Portal',
        required: true,
      },
      {
        key: 'DISCORD_WEBHOOK_URL',
        desc: 'Webhook URL for notifications',
        required: true,
      },
      {
        key: 'CHECKLIST_CHANNEL_ID',
        desc: 'Channel ID for Checklist items',
        required: true,
      },
    ],
  },
  {
    category: '🧠 AI & Intelligence',
    items: [
      { key: 'GEMINI_API_KEY', desc: 'Google Gemini API Key', required: true },
      {
        key: 'NEXT_PUBLIC_GEMINI_API_KEY',
        desc: 'Google Gemini API Key (Public)',
        required: true,
        sameAs: 'GEMINI_API_KEY',
      },
    ],
  },
  {
    category: '🔔 Push Notifications (VAPID)',
    items: [
      {
        key: 'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
        desc: 'VAPID Public Key (web-push generate-vapid-keys)',
        required: true,
      },
      { key: 'VAPID_PRIVATE_KEY', desc: 'VAPID Private Key', required: true },
    ],
  },
  {
    category: '📨 QStash (Upstash)',
    items: [
      { key: 'QSTASH_URL', desc: 'QStash URL', required: true },
      { key: 'QSTASH_TOKEN', desc: 'QStash Token', required: true },
      { key: 'QSTASH_WORKER_URL', desc: 'QStash Worker URL', required: true },
      {
        key: 'QSTASH_CURRENT_SIGNING_KEY',
        desc: 'Current Signing Key',
        required: true,
      },
      {
        key: 'QSTASH_NEXT_SIGNING_KEY',
        desc: 'Next Signing Key',
        required: true,
      },
    ],
  },
  {
    category: '✈️ Telegram Integration',
    items: [
      {
        key: 'TELEGRAM_BOT_TOKEN',
        desc: 'Bot Token from @BotFather',
        required: false,
      },
      {
        key: 'TELEGRAM_SECRET_TOKEN',
        desc: 'Random string for webhook security',
        required: false,
        default: 'eryzsh_secret_tele',
      },
    ],
  },
]

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
})

const ask = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve))
}

async function main() {
  zyLog.info(isTestMode ? '🔧 STARTING SETUP (TEST MODE)' : '🔧 STARTING SETUP')

  // 1. BUN INSTALL
  zyLog.info('📦 Installing dependencies...')
  if (isTestMode) {
    zyLog.cmd('Mock: bun install')
    await new Promise((r) => setTimeout(r, 1000))
    zyLog.success('Dependencies installed (Mock)')
  } else {
    try {
      zyLog.cmd('bun install')
      execSync('bun install', { stdio: 'inherit', cwd: rootDir })
      zyLog.success('Dependencies installed successfully')
    } catch {
      zyLog.error('Failed to install dependencies')
      process.exit(1)
    }
  }

  // 2. ENV SETUP
  zyLog.info('⚙️  Configuring Environment Variables...')

  let targetFile = isTestMode ? '.env.local.testing' : '.env.local'
  let finalContent = ''

  // Safety check for existing .env.local
  if (!isTestMode && existsSync(join(rootDir, '.env.local'))) {
    zyLog.warn('⚠️  .env.local already exists!')
    zyLog.warn('   Switching to .env.local.new to prevent overwriting.')
    targetFile = '.env.local.new'
  }

  const responses: Record<string, string> = {}

  for (const group of envVars) {
    console.log(`\n--- ${group.category} ---`)
    for (const item of group.items) {
      if (item.sameAs && responses[item.sameAs]) {
        responses[item.key] = responses[item.sameAs]
        continue
      }

      let val = ''
      while (!val) {
        val = await ask(
          `   ${item.key} (${item.desc}) ${item.default ? `[${item.default}]` : ''}: `,
        )
        val = val.trim()

        if (!val && item.default) val = item.default

        if (!val && item.required) {
          if (isTestMode) {
            val = 'MOCK_VALUE_' + item.key
            console.log(`   > Auto-filling mock value: ${val}`)
          } else {
            console.log('   ❌ Value is required!')
          }
        }
      }
      responses[item.key] = val
      finalContent += `${item.key}="${val}"\n`
    }
  }

  const filePath = join(rootDir, targetFile)
  writeFileSync(filePath, finalContent)
  zyLog.success(`Environment file created at: ${targetFile}`)

  if (targetFile === '.env.local.new') {
    zyLog.warn(
      '👉 IMPORTANT: Rename .env.local.new to .env.local to activate it!',
    )
  }

  rl.close()

  // 3. RUN DEV & OPEN BROWSER
  zyLog.info('🚀 Launching Development Server...')

  if (isTestMode) {
    zyLog.cmd('Mock: bun dev')
    zyLog.cmd('Mock: Open http://localhost:3000')
    zyLog.success('Setup verification complete.')
  } else {
    try {
      // Open browser first (it might fail if server isn't ready instantly, but usually fine)
      const startCmd = process.platform === 'win32' ? 'start' : 'open'
      execSync(`${startCmd} http://localhost:3000`)

      zyLog.cmd('bun dev')
      execSync('bun dev', { stdio: 'inherit', cwd: rootDir })
    } catch {
      // User likely killed the process
      zyLog.info('Server stopped.')
    }
  }
}

main()
