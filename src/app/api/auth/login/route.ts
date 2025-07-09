// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';

const usersFilePath = path.join(process.cwd(), 'data', 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-super-secret-key'; // Harusnya ada di .env

interface User {
  userID: string;
  username: string;
  password_hash: string;
  is_admin: boolean;
}

async function getUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(usersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist (e.g., first run after git clone), return empty array
    // It should have been created by the register endpoint if that was hit first.
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
    }

    const users = await getUsers();
    const user = users.find(u => u.username === username);

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials - user not found' }, { status: 401 });
    }

    if (user.password_hash === 'plain_password_erzysh_will_be_hashed_later') {
        // This state means 'erzysh' user exists from initial setup but password hasn't been set via /register
        return NextResponse.json({ message: 'Password not set. Please use the registration endpoint to set your password for the first time.' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials - password mismatch' }, { status: 401 });
    }

    const token = jwt.sign(
      { userID: user.userID, username: user.username, isAdmin: user.is_admin },
      JWT_SECRET,
      { expiresIn: '1h' } // Token berlaku selama 1 jam
    );

    const response = NextResponse.json({ message: 'Login successful', userID: user.userID, isAdmin: user.is_admin }, { status: 200 });
    response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60, // 1 jam
        sameSite: 'lax',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
