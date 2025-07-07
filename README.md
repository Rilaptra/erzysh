# **API Documentation**

This document provides a detailed specification for the API endpoints that interact with a Discord server as a backend database.

---

## `Route: /api/database`

This base route handles operations related to the entire database, such as fetching all data or creating top-level categories.

### **GET /**

Fetches all categories, along with their associated channels and messages. This provides a complete snapshot of the database.

- **Method:** `GET`

- **Endpoint:** `/api/database`

- **URL Parameters:** None

- **Request Body:** None

- **Success Response (200 OK):**
  Returns a `data` object where each key is a category ID.

  ```json
  {
    "data": {
      "119491...": {
        "name": "my-first-category",
        "id": "119491...",
        "channels": [
          {
            "name": "general-data",
            "id": "119492...",
            "messages": [
              {
                "id": "125584...",
                "content": "Message content snippet...",
                "attachments": [
                  {
                    "id": "125584...",
                    "filename": "data.json",
                    "size": 1234,
                    "url": "https://cdn.discordapp.com/..."
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  }
  ```

- **Error Response (500 Internal Server Error):**
  Returned if there's an issue fetching data from the Discord API.

  ```json
  {
    "error": "Internal server error while fetching Discord channels."
  }
  ```

\<br\>

### **POST /**

Creates a new category in the database.

- **Method:** `POST`
- **Endpoint:** `/api/database`
- **URL Parameters:** None
- **Request Body:**
  Requires a `data` object containing the name for the new category. Spaces in the name will be replaced with hyphens.
  ```json
  {
    "data": {
      "name": "new project category"
    }
  }
  ```
- **Success Response (200 OK):**
  Returns a success message and the data of the newly created category.
  ```json
  {
    "message": "New Category created!",
    "data": {
      "name": "new-project-category",
      "id": "125585..."
    }
  }
  ```
- **Error Responses:**
  - **405 Method Not Allowed:** If `data.name` is missing or the name exceeds 100 characters.
    ```json
    { "message": "Invalid Request Body" }
    ```
  - **500 Internal Server Error:** If the Discord API fails to create the category.
    ```json
    { "error": "Discord API error message" }
    ```

---

## `Route: /api/database/[...slug]`

This dynamic route handles operations on specific entities like categories, channels, and messages, identified by their Discord IDs in the URL slug. The slug can have one, two, or three parts: `/{categoryId}`, `/{categoryId}/{channelId}`, or `/{categoryId}/{channelId}/{messageId}`.

### **GET /[...slug]**

Fetches data for a specific category or a specific channel.

- **Method:** `GET`
- **Endpoints:**
  1.  `/api/database/{categoryId}`: Fetches all messages from all channels within the specified category.
  2.  `/api/database/{categoryId}/{channelId}`: Fetches all messages from the specified channel.
- **URL Parameters:**
  - `categoryId` (string, required): The Discord ID of the category.
  - `channelId` (string, optional): The Discord ID of the channel.
- **Request Body:** None
- **Success Response (200 OK):**
  Returns a `data` object containing the fetched messages. The structure depends on the endpoint used.
  - For `/api/database/{categoryId}`:
    ```json
    {
      "data": {
        "119492...": [
          /* messages from channel 1 */
        ],
        "119493...": [
          /* messages from channel 2 */
        ]
      }
    }
    ```
  - For `/api/database/{categoryId}/{channelId}`:
    ```json
    {
      "data": [
        /* messages from the specific channel */
      ]
    }
    ```
- **Error Response (404 Not Found):**
  Returned if the specified channel does not exist or has no messages.
  ```json
  { "message": "Channel not found" }
  ```

\<br\>

### **POST /[...slug]**

Creates a new channel within a category or sends a new message to a channel.

- **Method:** `POST`
- **Endpoints & Body:**
  1.  **To create a new channel:**
      - **Endpoint:** `/api/database/{categoryId}`
      - **Body:**
        ```json
        {
          "data": {
            "name": "new-data-channel"
          }
        }
        ```
  2.  **To send a new message:**
      - **Endpoint:** `/api/database/{categoryId}/{channelId}`
      - **Body:** The `content` is sent as a file attachment.
        ```json
        {
          "data": {
            "name": "unique-data-key.json",
            "content": { "key": "value", "nested": [1, 2] },
            "size": 50
          }
        }
        ```
- **Success Responses (200 OK):**
  - For channel creation:
    ```json
    {
      "message": "Channel created successfully",
      "data": {
        "name": "new-data-channel",
        "id": "125586..."
      }
    }
    ```
  - For sending a message:
    ````json
    {
      "message": "Message sent successfully",
      "data": {
        "id": "125587...",
        "content": "```\n{\n  \"lastUpdate\": \"...\",\n  \"name\": \"unique-data-key.json\",\n  \"size\": 50\n}\n```"
      }
    }
    ````
- **Error Responses:**
  - **404 Not Found:** If the request body is invalid.
  - **405 Method Not Allowed:** If the channel name is too long (\> 100 characters) or the body is invalid for channel creation.
  - **500 Internal Server Error:** If the message fails to send or the Discord API returns an error.

\<br\>

### **PATCH /[...slug]**

Updates the name of a category/channel or the content of a message.

- **Method:** `PATCH`
- **Endpoints & Body:**
  1.  **To update a category name:**
      - **Endpoint:** `/api/database/{categoryId}`
      - **Body:**
        ```json
        { "data": { "name": "updated-category-name" } }
        ```
  2.  **To update a channel name:**
      - **Endpoint:** `/api/database/{categoryId}/{channelId}`
      - **Body:**
        ```json
        { "data": { "name": "updated-channel-name" } }
        ```
  3.  **To update a message's content:**
      - **Endpoint:** `/api/database/{categoryId}/{channelId}/{messageId}`
      - **Body:**
        ```json
        {
          "data": {
            "name": "data-key.json",
            "content": { "updated_key": "new_value" }
          }
        }
        ```
- **Success Response (200 OK):**
  A confirmation message is returned for the specific update operation.
  ```json
  { "message": "Category/Channel/Message updated successfully" }
  ```
- **Error Responses:**
  - **400 Bad Request:** If the `content` type for a message update is invalid.
  - **404 Not Found:** If the specified category, channel, or message doesn't exist.

\<br\>

### **DELETE /[...slug]**

Deletes a category, channel, or a specific message.

- **Method:** `DELETE`
- **Endpoints:**
  1.  `/api/database/{categoryId}`: Deletes the entire category.
  2.  `/api/database/{categoryId}/{channelId}`: Deletes the channel.
  3.  `/api/database/{categoryId}/{channelId}/{messageId}`: Deletes the message.
- **URL Parameters:**
  - `categoryId` (string, required): The ID of the target category.
  - `channelId` (string, optional): The ID of the target channel.
  - `messageId` (string, optional): The ID of the target message.
- **Request Body:** None
- **Success Response (200 OK):**
  A confirmation message is returned.
  ```json
  { "message": "Category/Channel/Message deleted successfully" }
  ```
- **Error Responses:**
  - **404 Not Found:** If the specified category, channel, or message doesn't exist.
  - **500 Internal Server Error:** For any other exception during the deletion process.
