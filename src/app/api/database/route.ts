import { BOT_TOKEN, DISCORD_API_BASE, GUILD_ID } from "@/lib/constants";
import { getChannels, getMessagesFromChannel } from "@/lib/utils";
import { DiscordPartialMessageResponse } from "@/types";
import { NextRequest, NextResponse } from "next/server";

interface CategoryData {
  name: string;
  id: string;
  channels: {
    name: string;
    id: string;
    messages: DiscordPartialMessageResponse[] | void[];
  }[];
}

export async function GET(): Promise<NextResponse> {
  try {
    const channels = await getChannels();
    const categories = new Map<string, CategoryData>();
    for (const channel of channels) {
      if (channel.isCategory)
        categories.set(channel.id, {
          name: channel.name,
          id: channel.id,
          channels: [],
        });
      else {
        const category = categories.get(channel.categoryId!);
        if (category)
          category.channels.push({
            name: channel.name,
            id: channel.id,
            messages: (await getMessagesFromChannel(channel.id)) || [],
          });
        else if (channel.name !== "lapyout")
          categories.set(channel.categoryId!, {
            name: channel.name,
            id: channel.categoryId!,
            channels: [
              {
                name: channel.name,
                id: channel.id,
                messages: (await getMessagesFromChannel(channel.id)) || [],
              },
            ],
          });
      }
    }
    const data = Object.fromEntries(categories);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error fetching Discord channels:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching Discord channels." },
      { status: 500 }
    );
  }
}

// Create new category
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { data } = (await req.json()) as {
      data: {
        name: string;
      };
    };

    if (!data || !data.name) {
      return NextResponse.json(
        { message: "Invalid Request Body" },
        { status: 405 }
      );
    }

    if (typeof data.name === "string" && data.name.length > 100) {
      return NextResponse.json(
        { message: "Category name too long" },
        { status: 405 }
      );
    }

    const res = await fetch(`${DISCORD_API_BASE}/guilds/${GUILD_ID}/channels`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.name.replace(/ /g, "-"),
        type: 4,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error(`Discord API Error: ${res.status} - ${errorData.message}`);
      return NextResponse.json({ error: errorData.message }, { status: 500 });
    }
    const resData = await res.json();

    return NextResponse.json(
      {
        message: "New Category created!",
        data: { name: resData.name, id: resData.id },
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
