// src/app/api/database/helpers.ts

import { revalidateTag, unstable_cache } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { MESSAGE_LAYOUT, USERS_DATA_CHANNEL_ID } from '@/lib/constants'
import { discord } from '@/lib/discord-api-handler'
import { editMessage, sanitizeMessage, sendMessage } from '@/lib/utils'
import { zyLog } from '@/lib/zylog'
import {
  DiscordCategory,
  DiscordChannel,
  DiscordMessage,
  DiscordPartialMessageResponse,
  RequestData,
  UserData,
} from '@/types'
import {
  ApiDbErrorResponse,
  ApiDbModifyMessageResponse,
} from '@/types/api-db-response'

const ACTIVITY_LOG_CHANNEL_ID = MESSAGE_LAYOUT.channelID
const IS_DEV = process.env.NODE_ENV === 'development'

export enum CHANNEL_TYPE {
  GUILD_TEXT = 0,
  GUILD_CATEGORY = 4,
}

export interface MessageMetadata {
  lastUpdate?: string
  name?: string
  size?: number
  userID?: string
  isPublic?: boolean
  [key: string]: any
}

// --- 🧠 1. CORE FETCHER LOGIC (Reusable) ---
async function fetchUsersFromDiscord(): Promise<[string, UserData][]> {
  zyLog.info('☁️ [DISCORD HIT] Fetching raw user data...')
  const usersMap = new Map<string, UserData>()

  try {
    const res = await discord.get<DiscordMessage[]>(
      `/channels/${USERS_DATA_CHANNEL_ID}/messages`,
    )

    if (!res) return []

    const messages = res.map((msg) => sanitizeMessage(msg, true))
    const parsedContent = messages.map((msg) => msg.content as UserData)

    parsedContent.forEach((user) => {
      if (!user) return
      if (user.userID) usersMap.set(user.userID, user)
      if (user.username && !usersMap.has(user.username))
        usersMap.set(user.username, user)
    })

    return Array.from(usersMap.entries())
  } catch (error: any) {
    zyLog.error('Error fetching user data:', error.message)
    return []
  }
}

// --- 🧠 2. CACHING STRATEGY (GLOBAL OBJECT INJECTION) ---

// Kita define tipe buat global cache biar TypeScript ga marah
const globalForCache = global as unknown as {
  _usersCache: Map<string, UserData> | null
  _usersCacheTime: number
}

// Inisialisasi kalau belum ada (Hanya sekali seumur hidup server)
if (!globalForCache._usersCache) {
  globalForCache._usersCache = null
  globalForCache._usersCacheTime = 0
}

const DEV_CACHE_TTL = 60 * 1000 // 1 menit

// Next.js Cache buat Prod
const getCachedUsersProd = unstable_cache(
  async () => fetchUsersFromDiscord(),
  ['users-data-cache-key'],
  {
    tags: ['users-data'],
    revalidate: 60,
  },
)

// --- 🧠 3. UNIFIED ACCESSOR ---
export const getUsersData = async (): Promise<Map<string, UserData>> => {
  // SKENARIO DEV: Pakai Global Object (Persistent across Hot Reloads)
  if (IS_DEV) {
    const now = Date.now()

    // Cek Cache di Global Object
    if (
      globalForCache._usersCache &&
      now - globalForCache._usersCacheTime < DEV_CACHE_TTL
    ) {
      // Uncomment ini buat ngecek cache jalan
      // zyLog.success("🚀 [DEV CACHE] Hit (Global Object)");
      return globalForCache._usersCache
    }

    // Kalau kosong/expired, fetch baru
    const data = await fetchUsersFromDiscord()

    // Simpan ke Global Object
    globalForCache._usersCache = new Map(data)
    globalForCache._usersCacheTime = now

    return globalForCache._usersCache
  }

  // SKENARIO PROD
  const dataEntries = await getCachedUsersProd()
  return new Map(dataEntries)
}

// --- 🧠 4. INVALIDATOR ---
async function invalidateUsersCache() {
  if (IS_DEV) {
    zyLog.warn('🧹 [DEV] Clearing Global Object Cache...')
    globalForCache._usersCache = null
  } else {
    zyLog.warn('🧹 [PROD] Revalidating Next.js Cache Tag...')
    revalidateTag('users-data', 'max')
  }
}

// --- HELPER LAINNYA (Standard) ---

export function createApiResponse<T>(data: T, status: number): NextResponse<T> {
  return NextResponse.json(data, {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function handleDiscordApiCall<
  T extends
    | DiscordMessage
    | DiscordChannel
    | DiscordCategory
    | DiscordPartialMessageResponse
    | null,
>(
  apiCall: () => Promise<T>,
  successMessage: string,
  successStatus: number = 200,
) {
  try {
    const result = await apiCall()
    const responseBody = result && {
      message: successMessage,
      details: {
        id: result?.id,
        name: 'name' in result ? result.name : undefined,
      },
    }
    return createApiResponse<ApiDbModifyMessageResponse>(
      responseBody,
      successStatus,
    )
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || error.message || 'Discord API Error'
    const errorStatus = error.response?.status || 500
    zyLog.error(
      `Discord API Call Failed (Status: ${errorStatus}):`,
      errorMessage,
      error.response?.data?.errors || error.response?.data || '',
    )
    return createApiResponse<ApiDbErrorResponse | ApiDbModifyMessageResponse>(
      {
        message: 'An error occurred while communicating with Discord.',
        error: errorMessage,
        details: error.response?.data?.errors || error.response?.data,
      },
      errorStatus,
    )
  }
}

export async function loadBodyRequest(
  req: NextRequest,
): Promise<RequestData | null> {
  try {
    const body = await req.json()
    return (body.data as RequestData) || null
  } catch (error) {
    zyLog.warn('Could not parse request body as JSON.', error)
    return null
  }
}

export async function updateActivityLog(
  name: string,
  size: number,
  categoryId: string,
  channelId: string,
  userID?: string,
) {
  if (!ACTIVITY_LOG_CHANNEL_ID) return

  let logEntryContent = `**[${new Date().toISOString()}]** Item \`${name}\` (Size: ${size} bytes) modified/accessed.`
  if (userID) logEntryContent += ` User: \`${userID}\`.`
  logEntryContent += ` Context: Cat:\`${categoryId}\`, Chan:\`${channelId}\`.`

  try {
    await discord.post(`/channels/${ACTIVITY_LOG_CHANNEL_ID}/messages`, {
      content: logEntryContent,
    })
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message
    zyLog.error('Failed to post to activity log channel!', errorMessage)
  }
}

// save user data to Discord channel
export async function addUserData(
  user: UserData,
): Promise<DiscordPartialMessageResponse | void> {
  if (!USERS_DATA_CHANNEL_ID) {
    zyLog.error('USERS_DATA_CHANNEL_ID not set. Cannot save user data.')
    return
  }

  try {
    const content = JSON.stringify(user)
    const message = await sendMessage(USERS_DATA_CHANNEL_ID, { content })
    if (!message || !message.id) {
      throw new Error('Failed to save user data: No message ID returned.')
    }

    await invalidateUsersCache()
    return message
  } catch (error: any) {
    zyLog.error('Error saving user data to Discord:', error.message)
  }
}

// update user data in Discord channel
export async function updateUserData(
  userID: string,
  updates: Partial<UserData>,
  messageId: DiscordMessage['id'],
): Promise<void> {
  if (!USERS_DATA_CHANNEL_ID) {
    zyLog.error('USERS_DATA_CHANNEL_ID not set. Cannot update user data.')
    return
  }

  try {
    const users = await getUsersData()
    const user = users.get(userID)
    if (!user) {
      zyLog.error(`User with ID ${userID} not found.`)
      return
    }

    Object.assign(user, updates)
    const content = JSON.stringify(user)
    await editMessage(USERS_DATA_CHANNEL_ID, messageId, {
      content,
    })

    await invalidateUsersCache()
  } catch (error: any) {
    zyLog.error('Error updating user data:', error.message)
  }
}
