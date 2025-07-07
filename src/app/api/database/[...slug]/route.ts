import {
  DISCORD_API_BASE,
  GUILD_ID,
  BOT_TOKEN,
  SUPPORTED_TYPES,
} from "@/lib/constants";
import {
  editMessage,
  fileAttachmentsBuilder,
  getChannels,
  getMessagesFromChannel,
  sendMessage,
} from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<NextResponse> {
  const { slug } = await params;
  const [categoryId, channelId] = slug;
  // const query = req.nextUrl.searchParams;
  if (!channelId) {
    const channels = await getChannels();
    const filteredChannelsID = channels
      .filter((channel) => channel.categoryId === categoryId)
      .map((channel) => channel.id);
    const filteredChannels = new Map();

    for (const channelID of filteredChannelsID) {
      const messages = await getMessagesFromChannel(channelID);
      if (!messages) continue;
      filteredChannels.set(channelID, messages);
    }

    const data = Object.fromEntries(filteredChannels);
    return NextResponse.json({ data }, { status: 200 });
  }

  const messages = await getMessagesFromChannel(channelId);
  if (!messages) {
    return NextResponse.json({ message: "Channel not found" }, { status: 404 });
  }

  return NextResponse.json({ data: messages }, { status: 200 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    const [categoryId, channelId] = slug;
    const { data } = (await req.json()) as {
      data: {
        name: string;
        content: string | number | [] | Object;
        size?: number;
      };
    };

    // Create new Channel
    if (categoryId && !data.content) {
      if (!data || !data.name) {
        return NextResponse.json(
          { message: "Invalid Request Body" },
          { status: 405 }
        );
      }

      if (typeof data.name === "string" && data.name.length > 100) {
        return NextResponse.json(
          { message: "Channel name too long" },
          { status: 405 }
        );
      }

      const res = await fetch(
        `${DISCORD_API_BASE}/guilds/${GUILD_ID}/channels`,
        {
          method: "POST",
          headers: {
            Authorization: `Bot ${BOT_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.name,
            parent_id: categoryId,
            type: 0,
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        console.error(
          `Discord API Error: ${res.status} - ${errorData.message}`
        );
        return NextResponse.json(
          { message: errorData.message },
          { status: res.status }
        );
      }

      const channel = await res.json();

      return NextResponse.json(
        {
          message: "Channel created successfully",
          data: { name: channel.name, id: channel.id },
        },
        { status: 200 }
      );
    }

    if (!data || !data.content || !data.name) {
      return NextResponse.json(
        { message: "Invalid Request Body" },
        { status: 404 }
      );
    }

    if (!SUPPORTED_TYPES.includes(typeof data.content)) {
      return NextResponse.json(
        { message: "Invalid Request Body" },
        { status: 404 }
      );
    }

    const dataContent =
      typeof data.content === "string"
        ? data.content
        : JSON.stringify(data.content);

    const generatedFiles = fileAttachmentsBuilder({
      fileName: data.name,
      data: dataContent,
      size: data.size ?? dataContent.length,
    });

    const message = {
      lastUpdate: new Date().toISOString(),
      name: data.name,
      size: data.size ?? dataContent.length,
    };
    const res = await sendMessage(channelId, {
      content: `\`\`\`
${JSON.stringify(message, null, 2)}
\`\`\``,
      files: generatedFiles,
    });
    if (!res) {
      console.error("Failed to send message");
      return NextResponse.json(
        { message: "Failed to send message" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        message: "Message sent successfully",
        data: { id: res.id, content: res.content },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Error sending message" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: any }) {
  try {
    const { slug } = await params;
    const [categoryId, channelId, messageId] = slug;

    if (!channelId) {
      const res = await fetch(`${DISCORD_API_BASE}/channels/${categoryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!res) {
        return NextResponse.json(
          { message: "Category not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { message: "Category deleted successfully" },
        { status: 200 }
      );
    }

    if (!messageId) {
      const res = await fetch(`${DISCORD_API_BASE}/channels/${channelId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      if (!res) {
        return NextResponse.json(
          { message: "Channel not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { message: "Channel deleted successfully" },
        { status: 200 }
      );
    }

    const res = await fetch(
      `${DISCORD_API_BASE}/channels/${channelId}/messages/${messageId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res) {
      return NextResponse.json(
        { message: "Message not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Message deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting channel:", error);
    return NextResponse.json(
      { error: "Error deleting channel" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: any }) {
  try {
    const { slug } = await params;
    const [categoryId, channelId, messageId] = slug;
    const { data } = (await req.json()) as {
      data: {
        name: string;
        content: string | number | [] | Object;
        size?: number;
      };
    };

    if (!channelId) {
      // update category name
      const res = await fetch(`${DISCORD_API_BASE}/channels/${categoryId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: data.name, type: 4 }),
      });

      if (!res) {
        return NextResponse.json(
          { message: "Category not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { message: "Category updated successfully" },
        { status: 200 }
      );
    }

    if (!messageId) {
      // update channel name
      if (data.content) {
        return NextResponse.json(
          { message: "Message ID not found" },
          { status: 404 }
        );
      }
      const res = await fetch(`${DISCORD_API_BASE}/channels/${channelId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: data.name }),
      });

      if (!res) {
        return NextResponse.json(
          { message: "Channel not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { message: "Channel updated successfully" },
        { status: 200 }
      );
    }

    if (!SUPPORTED_TYPES.includes(typeof data.content)) {
      return NextResponse.json(
        { message: "Invalid content type" },
        { status: 400 }
      );
    }

    const dataContent =
      typeof data.content === "string"
        ? data.content
        : JSON.stringify(data.content);
    const res = await editMessage(channelId, messageId, {
      files: fileAttachmentsBuilder({
        fileName: data.name,
        data: dataContent,
        size: data.size ?? dataContent.length,
      }),
    });

    if (!res) {
      return NextResponse.json(
        { message: "Message not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Message updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { error: "Error updating message" },
      { status: 500 }
    );
  }
}
