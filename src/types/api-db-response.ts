// src/types/api-db-response.ts

// Common response for success messages
export interface ApiDbSuccessMessageResponse {
  message: string;
}

// Common response for errors
export interface ApiDbErrorResponse {
  message?: string;
  error?: string;
}
export interface ApiDbModifyMessageResponse
  extends ApiDbSuccessMessageResponse {
  details: {
    id?: string;
    name?: string;
  };
}

// --- GET /api/database ---
// Represents a message after being processed for API response
export interface ApiDbProcessedMessage {
  id: string;
  timestamp: string;
  edited_timestamp?: string | null;
  name: string;
  size?: number;
  userID?: string;
}

// Represents a channel within a category in the structured data response
export interface ApiDbCategoryChannel {
  id: string;
  name: string;
  type: number; // Discord channel type (e.g., 0 for text)
  categoryId: string | null;
  messages: ApiDbProcessedMessage[];
}

// Represents a category in the structured data response
export interface ApiDbCategory {
  id: string;
  name: string;
  isCategory: boolean;
  type: number; // Discord channel type (e.g., 4 for category)
  channels: ApiDbCategoryChannel[];
}

// Full response for GET /api/database
export interface ApiDbGetAllStructuredDataResponse {
  data: {
    [categoryId: string]: ApiDbCategory;
  };
}

export type GetApiDatabaseResponse =
  | ApiDbGetAllStructuredDataResponse
  | ApiDbErrorResponse;

// --- POST /api/database ---
// Response for creating a new category
export type ApiDbCreateCategoryResponse =
  | ApiDbModifyMessageResponse
  | ApiDbErrorResponse;

// --- GET /api/database/[...slug] ---
// Response for fetching a single message by ID (e.g., /api/database/categoryId/channelId/messageId)
export interface ApiDbGetMessageResponse {
  id: string;
  isPublic?: boolean;
  timestamp: string;
  edited_timestamp?: string | null;
  data?: any; // Can be parsed JSON from attachment or raw string
  // These properties come from the 'content' field of the Discord message if it's an object
  lastUpdate?: string;
  name?: string;
  size?: number;
  userID?: string;
}

export type GetApiDatabaseMessageResponse =
  | ApiDbGetMessageResponse
  | ApiDbErrorResponse;

// Response for fetching messages from a specific channel (e.g., /api/database/categoryId/channelId)
export interface ApiDbGetChannelMessagesResponse {
  data: ApiDbProcessedMessage[];
}

export type GetApiDatabaseChannelMessagesResponse =
  | ApiDbGetChannelMessagesResponse
  | ApiDbErrorResponse;

// Response for fetching messages from all channels within a category (e.g., /api/database/categoryId)
export interface ApiDbGetCategoryMessagesResponse {
  data: {
    [channelId: string]: ApiDbProcessedMessage[] | null; // Null if no messages after filtering
  };
}

export type GetApiDatabaseCategoryMessagesResponse =
  | ApiDbGetCategoryMessagesResponse
  | ApiDbErrorResponse;

// --- POST /api/database/[...slug] ---
// Response for creating a new channel (e.g., /api/database/categoryId)
export type ApiDbCreateChannelResponse =
  | ApiDbModifyMessageResponse
  | ApiDbErrorResponse;

// Response for sending a message (e.g., /api/database/categoryId/channelId)
export interface ApiDbSendMessageResponse {
  id: string;
  content: string; // This is the trimmed JSON string of the key object (e.g., `{"lastUpdate": "...", "name": "...", "size": ...}`)
}

// --- PATCH /api/database/[...slug] ---
// Response for updating a message (e.g., /api/database/categoryId/channelId/messageId)
export type ApiDbUpdateMessageResponse =
  | ApiDbModifyMessageResponse
  | ApiDbErrorResponse;

// Response for updating a channel (e.g., /api/database/categoryId/channelId)
export type ApiDbUpdateChannelResponse =
  | ApiDbModifyMessageResponse
  | ApiDbErrorResponse;

// Response for updating a category (e.g., /api/database/categoryId)
export type ApiDbUpdateCategoryResponse =
  | ApiDbModifyMessageResponse
  | ApiDbErrorResponse;

// --- DELETE /api/database/[...slug] ---
// Response for deleting a message (e.g., /api/database/categoryId/channelId/messageId)
export type ApiDbDeleteMessageResponse =
  | ApiDbModifyMessageResponse
  | ApiDbErrorResponse;

// Response for deleting a channel (e.g., /api/database/categoryId/channelId)
export type ApiDbDeleteChannelResponse =
  | ApiDbModifyMessageResponse
  | ApiDbErrorResponse;

// Response for deleting a category and its channels (e.g., /api/database/categoryId)
export type ApiDbDeleteCategoryResponse =
  | ApiDbModifyMessageResponse
  | ApiDbErrorResponse;
