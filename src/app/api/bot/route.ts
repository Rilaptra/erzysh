// src/app/api/bot/route.ts
import { webhookCallback } from 'grammy'
import { type NextRequest, NextResponse } from 'next/server'
import { TELEGRAM_SECRET_TOKEN } from '@/lib/constants'
import { bot } from '@/lib/telegram'
import { zyLog } from '@/lib/zylog'

export const dynamic = 'force-dynamic'

// Handler utama grammY untuk adapter standard web (fetch)
const handleUpdate = webhookCallback(bot, 'std/http')

export async function POST(req: NextRequest) {
  try {
    // 1. Security Check: Validasi Secret Token dari Header Telegram
    // Ini penting biar API route lo gak di-spam orang iseng
    const secretToken = req.headers.get('x-telegram-bot-api-secret-token')

    if (TELEGRAM_SECRET_TOKEN && secretToken !== TELEGRAM_SECRET_TOKEN) {
      zyLog.warn('[TG] Unauthorized webhook attempt.')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Pass request ke grammY
    return await handleUpdate(req)
  } catch (e) {
    zyLog.error('[TG] Webhook Error:', (e as Error).message)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    )
  }
}

// GET handler buat ngecek doang kalau route-nya hidup
export async function GET() {
  return NextResponse.json({
    status: 'alive',
    service: 'Eryzsh Telegram Uplink',
  })
}
