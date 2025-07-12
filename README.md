# 📂 Database API Documentation

Welcome to the API documentation for the Discord-based DBaaS. This API enables **CRUD** (Create, Read, Update, Delete) operations on a data structure comprising categories, channels, and messages.

This document will guide you through the available endpoints. Let's roll!

---

## 🏛️ Core Data Structures

Before diving into the endpoints, it's essential to understand the core data objects frequently appearing in API responses.

- `ApiDbProcessedMessage`: Represents a processed message.
  - `id`: `string` - Unique message ID.
  - `timestamp`: `string` - ISO-formatted timestamp when the message was created.
  - `edited_timestamp`: `string | null` - ISO-formatted timestamp when the message was last edited.
  - `name`: `string` - Name of the data/file.
  - `size`: `number` (optional) - Size of the data/file.
  - `userID`: `string` (optional) - ID of the user who sent the message.

- `ApiDbCategoryChannel`: Represents a channel within a category.
  - `id`: `string` - Unique channel ID.
  - `name`: `string` - Channel name.
  - `type`: `number` - Discord channel type (e.g., `0` for text).
  - `categoryId`: `string | null` - ID of the parent category.
  - `messages`: `ApiDbProcessedMessage[]` - List of messages within the channel.

- `ApiDbCategory`: Represents a category.
  - `id`: `string` - Unique category ID.
  - `name`: `string` - Category name.
  - `isCategory`: `boolean` - Always `true`.
  - `type`: `number` - Discord channel type (e.g., `4` for category).
  - `channels`: `ApiDbCategoryChannel[]` - List of channels within the category.

- `ApiDbErrorResponse`: Standard response for errors.
  - `message`: `string` (optional) - A more descriptive error message.
  - `error`: `string` (optional) - A short error code or detail.

- `ApiDbSuccessMessageResponse`: Standard response for successful operations.
  - `message`: `string` - Confirmation message for success.

---

## API Endpoints

Below is a comprehensive list of available API endpoints.

### 📖 **READ** Operations

#### `GET /api/database`

Retrieves the entire data structure of all categories and channels.

- **✅ Success Response (200 OK)**
  ```json
  {
    "data": {
      "categoryId_1": {
        "id": "categoryId_1",
        "name": "Project Files",
        "isCategory": true,
        "type": 4,
        "channels": [
          {
            "id": "channelId_1",
            "name": "blueprints",
            "type": 0,
            "categoryId": "categoryId_1",
            "messages": [
              {
                "id": "messageId_1",
                "timestamp": "2025-07-10T12:00:00.000Z",
                "edited_timestamp": null,
                "name": "gedung-a.dwg",
                "size": 512000,
                "userID": "user_123"
              }
            ]
          }
        ]
      }
    }
  }
  ```
- **❌ Error Response (Example: 500 Internal Server Error)**
  ```json
  {
    "error": "Failed to fetch structured data"
  }
  ```

#### `GET /api/database/{categoryId}`

Retrieves all messages from all channels within a specific category.

- **Path Parameters:**
  - `categoryId`: `string` - The ID of the category.
- **✅ Success Response (200 OK)**
  ```json
  {
    "data": {
      "channelId_1": [
        {
          "id": "messageId_1",
          "timestamp": "2025-07-10T12:00:00.000Z",
          "edited_timestamp": null,
          "name": "gedung-a.dwg"
        }
      ],
      "channelId_2": null // If no messages are found after filtering
    }
  }
  ```
- **❌ Error Response (Example: 404 Not Found)**
  ```json
  {
    "error": "Category not found"
  }
  ```

#### `GET /api/database/{categoryId}/{channelId}`

Retrieves all messages from a specific channel.

- **Path Parameters:**
  - `categoryId`: `string` - The ID of the parent category.
  - `channelId`: `string` - The ID of the channel.
- **✅ Success Response (200 OK)**
  ```json
  {
    "data": [
      {
        "id": "messageId_1",
        "timestamp": "2025-07-10T12:00:00.000Z",
        "edited_timestamp": null,
        "name": "gedung-a.dwg",
        "size": 512000,
        "userID": "user_123"
      }
    ]
  }
  ```
- **❌ Error Response (Example: 404 Not Found)**
  ```json
  {
    "error": "Channel not found"
  }
  ```

#### `GET /api/database/{categoryId}/{channelId}/{messageId}`

Retrieves the details of a specific message.

- **Path Parameters:**
  - `categoryId`: `string` - The ID of the parent category.
  - `channelId`: `string` - The ID of the parent channel.
  - `messageId`: `string` - The ID of the message.
- **✅ Success Response (200 OK)**
  ```json
  {
    "id": "messageId_1",
    "timestamp": "2025-07-10T12:00:00.000Z",
    "edited_timestamp": null,
    "data": {
      "notes": "Revisi pertama"
    },
    "lastUpdate": "2025-07-10T12:00:00.000Z",
    "name": "gedung-a.dwg",
    "size": 512000,
    "userID": "user_123"
  }
  ```
- **❌ Error Response (Example: 404 Not Found)**
  ```json
  {
    "error": "Message not found"
  }
  ```

---

### ✍️ **CREATE** Operations

#### `POST /api/database`

Creates a new category.

- **Request Body**
  ```json
  {
    "name": "New Category Name"
  }
  ```
- **✅ Success Response (201 Created)**
  ```json
  {
    "message": "Category 'New Category Name' created successfully"
  }
  ```
- **❌ Error Response (Example: 400 Bad Request)**
  ```json
  {
    "error": "Category name is required"
  }
  ```

#### `POST /api/database/{categoryId}`

Creates a new channel within an existing category.

- **Path Parameters:**
  - `categoryId`: `string` - The ID of the parent category.
- **Request Body**
  ```json
  {
    "name": "new-channel-name"
  }
  ```
- **✅ Success Response (201 Created)**
  ```json
  {
    "message": "Channel 'new-channel-name' created successfully"
  }
  ```
- **❌ Error Response (Example: 404 Not Found)**
  ```json
  {
    "error": "Category not found"
  }
  ```

#### `POST /api/database/{categoryId}/{channelId}`

Sends a new message to a specific channel.

- **Path Parameters:**
  - `categoryId`: `string` - The ID of the parent category.
  - `channelId`: `string` - The ID of the channel.
- **Request Body**
  ```json
  {
    "name": "data-structure.json",
    "size": 1024,
    "userID": "user_456",
    "content": { "key": "value", "isValid": true }
  }
  ```

  - `name`: `string` - The name of the data/file.
  - `size`: `number` (optional) - The size of the data/file.
  - `userID`: `string` (optional) - The ID of the user sending the message.
  - `content`: `object` (optional) - Arbitrary JSON data to be stored with the message.
- **✅ Success Response (201 Created)**
  ```json
  {
    "id": "newMessageId_123",
    "content": "{\"lastUpdate\":\"...\",\"name\":\"data-structure.json\",\"size\":1024,\"userID\":\"user_456\"}"
  }
  ```

  - Note: The `content` field in the response is a JSON string representation of the message's metadata and content.
- **❌ Error Response (Example: 400 Bad Request)**
  ```json
  {
    "error": "Invalid request body"
  }
  ```

---

### 🔄 **UPDATE** Operations

#### `PATCH /api/database/{categoryId}`

Updates the name of a category.

- **Path Parameters:**
  - `categoryId`: `string` - The ID of the category to update.
- **Request Body**
  ```json
  {
    "name": "Updated Category Name"
  }
  ```
- **✅ Success Response (200 OK)**
  ```json
  {
    "message": "Category updated successfully"
  }
  ```
- **❌ Error Response (Example: 404 Not Found)**
  ```json
  {
    "error": "Category not found"
  }
  ```

#### `PATCH /api/database/{categoryId}/{channelId}`

Updates the name of a channel.

- **Path Parameters:**
  - `categoryId`: `string` - The ID of the parent category.
  - `channelId`: `string` - The ID of the channel to update.
- **Request Body**
  ```json
  {
    "name": "updated-channel-name"
  }
  ```
- **✅ Success Response (200 OK)**
  ```json
  {
    "message": "Channel updated successfully"
  }
  ```
- **❌ Error Response (Example: 404 Not Found)**
  ```json
  {
    "error": "Channel not found"
  }
  ```

#### `PATCH /api/database/{categoryId}/{channelId}/{messageId}`

Updates the content or metadata of a specific message.

- **Path Parameters:**
  - `categoryId`: `string` - The ID of the parent category.
  - `channelId`: `string` - The ID of the parent channel.
  - `messageId`: `string` - The ID of the message to update.
- **Request Body**
  ```json
  {
    "name": "data-structure-rev1.json",
    "content": { "key": "newValue", "isValid": false }
  }
  ```

  - Fields sent in the body (e.g., `name`, `size`, `userID`, `content`) will be updated. `content` will be merged if it's an object.
- **✅ Success Response (200 OK)**
  ```json
  {
    "message": "Message updated successfully"
  }
  ```
- **❌ Error Response (Example: 404 Not Found)**
  ```json
  {
    "error": "Message not found"
  }
  ```

---

### 🗑️ **DELETE** Operations

#### `DELETE /api/database/{categoryId}`

Deletes a category along with all its channels and messages.

- **Path Parameters:**
  - `categoryId`: `string` - The ID of the category to delete.
- **✅ Success Response (200 OK)**
  ```json
  {
    "message": "Category and all its contents deleted successfully"
  }
  ```
- **❌ Error Response (Example: 404 Not Found)**
  ```json
  {
    "error": "Category not found"
  }
  ```

#### `DELETE /api/database/{categoryId}/{channelId}`

Deletes a channel along with all its messages.

- **Path Parameters:**
  - `categoryId`: `string` - The ID of the parent category.
  - `channelId`: `string` - The ID of the channel to delete.
- **✅ Success Response (200 OK)**
  ```json
  {
    "message": "Channel deleted successfully"
  }
  ```
- **❌ Error Response (Example: 404 Not Found)**
  ```json
  {
    "error": "Channel not found"
  }
  ```

#### `DELETE /api/database/{categoryId}/{channelId}/{messageId}`

Deletes a specific message.

- **Path Parameters:**
  - `categoryId`: `string` - The ID of the parent category.
  - `channelId`: `string` - The ID of the parent channel.
  - `messageId`: `string` - The ID of the message to delete.
- **✅ Success Response (200 OK)**
  ```json
  {
    "message": "Message deleted successfully"
  }
  ```
- **❌ Error Response (Example: 404 Not Found)**
  ```json
  {
    "error": "Message not found"
  }
  ```
