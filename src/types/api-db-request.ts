// src/types/api-db-request.ts
export interface ApiBodyDataDbCommonRequest {
  name: string;
}
// --- POST /api/database ---
// Request body for creating a new category
export type ApiDbCreateCategoryRequest = {
  data: ApiBodyDataDbCommonRequest;
};
// --- POST /api/database/[...slug] ---
// Request body for creating a new channel (e.g., /api/database/categoryId)
export type ApiDbCreateChannelRequest = {
  data: ApiBodyDataDbCommonRequest;
};
// Request body for sending a message (e.g., /api/database/categoryId/channelId)
export interface ApiBodySendMessageRequest extends ApiBodyDataDbCommonRequest {
  size?: number;
  isPublic?: boolean;
  content: string | object; // Can be raw string or JSON object
}

export type ApiDbSendMessageRequest = {
  data: ApiBodySendMessageRequest;
};

// --- PATCH /api/database/[...slug] ---
// Request body for updating a category (e.g., /api/database/categoryId)
export type ApiDbUpdateCategoryRequest = {
  data: ApiBodyDataDbCommonRequest;
};
// Request body for updating a channel (e.g., /api/database/categoryId/channelId)
export type ApiDbUpdateChannelRequest = {
  data: ApiBodyDataDbCommonRequest;
};
// Request body for updating a message (e.g., /api/database/categoryId/channelId/messageId)
export interface ApiBodyUpdateMessageRequest
  extends ApiBodyDataDbCommonRequest {
  content?: string | object; // Can be raw string or JSON object
  size?: number; // Optional, used if content is updated and size needs to be explicitly set
}

export type ApiDbUpdateMessageRequest = {
  data: ApiBodyUpdateMessageRequest;
};
