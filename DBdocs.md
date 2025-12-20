# 📂 Database API Documentation

Welcome to the API documentation for **Eryzsh DBaaS** (Discord-based Database as a Service). This API enables **CRUD** operations using Discord text channels as data stores.

> **Note:** The internal code often refers to:
>
> - **Category** as _Container_
> - **Channel** as _Box_
> - **Message** as _Collection_ or _Item_

---

## 🏛️ Core Data Structures

### `ApiDbMessage` (Collection)

Represents a single data item stored as a Discord message.

```typescript
interface ApiDbMessage {
  id: string; // Discord Message ID
  timestamp: string; // Creation time (ISO)
  edited_timestamp: string | null; // Last edit time (ISO)
  userID: string; // Owner User ID
  name: string; // File/Data name
  size?: number; // Size in bytes
  isPublic?: boolean; // Public access flag
  content?: any; // JSON content (if loaded)
  data?: string; // Raw content (if loaded)
}
```

### `ApiDbChannel` (Box)

Represents a Discord Text Channel containing messages.

```typescript
interface ApiDbChannel {
  id: string;
  name: string;
  type: 0;
  categoryId: string | null;
  messages?: ApiDbMessage[]; // List of messages (if loaded)
}
```

### `ApiDbCategory` (Container)

Represents a Discord Category containing channels.

```typescript
interface ApiDbCategory {
  id: string;
  name: string;
  type: 4;
  channels: ApiDbChannel[]; // List of channels
}
```

---

## 🚀 API Endpoints

### 📖 **READ** Operations

#### `GET /api/database`

Retrieves the entire structure (Categories -> Channels -> Messages Metadata).

- **Returns:** A nested object of Categories.

#### `GET /api/database/{categoryId}`

Retrieves all messages within a category.

- **Response:** `{ data: { [channelId]: ApiDbMessage[] } }`

#### `GET /api/database/{categoryId}/{channelId}`

Retrieves all messages in a specific channel.

- **Query Params:**
  - `?full=true`: Fetch full content of all messages (slower).
- **Response:** `{ data: ApiDbMessage[] }`

#### `GET /api/database/{categoryId}/{channelId}/{messageId}`

Retrieves a specific message.

- **Query Params:**
  - `?raw=true`: Serve the file content directly (useful for images/downloads).
  - `?userID={id}`: Required if accessing a public file via `raw` mode without session cookie.
- **Response:** `ApiDbMessage` object.

---

### ✍️ **CREATE** Operations

#### `POST /api/database`

Creates a new **Category** (Container).

- **Body:** `{ "name": "My Container" }`

#### `POST /api/database/{categoryId}`

Creates a new **Channel** (Box) inside a category.

- **Body:** `{ "name": "my-box" }`

#### `POST /api/database/{categoryId}/{channelId}`

Creates (Uploads) a new **Message** (Collection/File).

- **Body:**
  ```json
  {
    "name": "data.json",
    "content": { "foo": "bar" },
    "isPublic": false
  }
  ```

---

### 🔄 **UPDATE** Operations

#### `PATCH /api/database/{categoryId}`

Renames a Category.

#### `PATCH /api/database/{categoryId}/{channelId}`

Renames a Channel.

#### `PATCH /api/database/{categoryId}/{channelId}/{messageId}`

Updates a Message or its Metadata.

- **Body (Update Content):**
  ```json
  {
    "name": "new-name.json",
    "content": { ...new data... }
  }
  ```
- **Body (Toggle Public):**
  ```json
  {
    "isPublic": true
  }
  ```

---

### 🗑️ **DELETE** Operations

#### `DELETE /api/database/{categoryId}`

Deletes a Category and ALL contents. **Irreversible.**

#### `DELETE /api/database/{categoryId}/{channelId}`

Deletes a Channel and all messages.

#### `DELETE /api/database/{categoryId}/{channelId}/{messageId}`

Deletes a specific Message.
