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

// Type guard for Node.js errors
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 },
      );
    }

    if (typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { message: "Username and password must be strings" },
        { status: 400 },
      );
    }

    const users = await getUsersData();

    const existingUser = users.has(username);

    const hashedPassword = await bcrypt.hash(password, 10);

    // For other users
    if (existingUser) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 409 },
      );
    }

    const newUser: UserData = {
      userID: uuidv4(),
      username,
      password_hash: hashedPassword,
      is_admin: false,
      databases: {},
      message_id: "not",
    };
    // Add the new user to the users map
    users.set(newUser.userID, newUser);
    users.set(newUser.username, newUser);
    const message = await addUserData(newUser);
    newUser.message_id = message!.id;
    await updateUserData(newUser.userID, newUser, newUser.message_id);
    return NextResponse.json(
      { message: "User registered successfully", userID: newUser.userID },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    // Log the specific error if possible
    if (error instanceof Error) {
      console.error(error.message);
      if (error.stack) console.error(error.stack);
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
