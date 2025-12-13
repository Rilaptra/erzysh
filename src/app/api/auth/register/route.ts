// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import {
  getUsersData,
  addUserData,
  updateUserData,
} from "../../database/helpers";
import { UserData } from "@/types";
import { registerSchema } from "@/lib/validators"; // Import Zod Schema

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 🔥 ZOD VALIDATION START
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid input",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { username, password } = validation.data;
    // 🔥 ZOD VALIDATION END

    const users = await getUsersData();
    if (users.has(username)) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: UserData = {
      userID: uuidv4(),
      username,
      password_hash: hashedPassword,
      is_admin: false,
      databases: {},
      message_id: "not",
    };

    users.set(newUser.userID, newUser);
    users.set(newUser.username, newUser);

    const message = await addUserData(newUser);
    if (!message) throw new Error("Failed to save to Discord");

    newUser.message_id = message.id;
    await updateUserData(newUser.userID, newUser, newUser.message_id);

    return NextResponse.json(
      { message: "User registered successfully", userID: newUser.userID },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
