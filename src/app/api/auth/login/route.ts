// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getUsersData } from "../../database/helpers";

const JWT_SECRET = process.env.JWT_SECRET || "your-default-super-secret-key"; // Harusnya ada di .env

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 },
      );
    }

    const users = await getUsersData();
    const user = users.get(username);

    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials - user not found" },
        { status: 401 },
      );
    }
    if (typeof user.password_hash !== "string") {
      return NextResponse.json(
        { message: "Invalid user data" },
        { status: 500 },
      );
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid credentials - password mismatch" },
        { status: 401 },
      );
    }
    //                       1m   1h   1d   1w
    const expiresInSeconds = 60 * 60 * 24 * 7;

    const token = jwt.sign(
      {
        userID: user.userID,
        username: user.username,
        isAdmin: user.is_admin,
        databases: user.databases,
        messageId: user.message_id,
      },
      JWT_SECRET,
      { expiresIn: `${expiresInSeconds}s` },
    );

    const response = NextResponse.json(
      {
        message: "Login successful",
        userID: user.userID,
        isAdmin: user.is_admin,
      },
      { status: 200 },
    );
    response.cookies
      .set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: expiresInSeconds, // 1 jam
        sameSite: "lax",
      })
      .set("x-user-id", user.userID, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: expiresInSeconds, // 1 jam
        sameSite: "lax",
      });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
