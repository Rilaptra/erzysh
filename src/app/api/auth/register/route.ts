// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const usersFilePath = path.join(process.cwd(), 'data', 'users.json');

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
    // If file doesn't exist or is empty, return empty array
    // Check if it's a 'file not found' error specifically
    if (isNodeError(error) && error.code === 'ENOENT') {
        await fs.mkdir(path.dirname(usersFilePath), { recursive: true }); // Ensure 'data' directory exists
        await fs.writeFile(usersFilePath, '[]', 'utf-8'); // Create empty users.json
        return [];
    }
    console.error("Error reading users file, returning empty array:", error);
    return [];
  }
}

// Type guard for Node.js errors
function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}


async function saveUsers(users: User[]): Promise<void> {
  await fs.mkdir(path.dirname(usersFilePath), { recursive: true }); // Ensure 'data' directory exists
  await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
    }

    if (typeof username !== 'string' || typeof password !== 'string') {
        return NextResponse.json({ message: 'Username and password must be strings' }, { status: 400 });
    }

    const users = await getUsers();

    const existingUser = users.find(user => user.username === username);

    const hashedPassword = await bcrypt.hash(password, 10);

    if (username === 'erzysh') {
        if (existingUser) { // erzysh exists, update password and ensure admin
            existingUser.password_hash = hashedPassword;
            existingUser.is_admin = true;
        } else { // erzysh does not exist, create as admin
            const newErzyshAdmin: User = {
                userID: uuidv4(),
                username: 'erzysh',
                password_hash: hashedPassword,
                is_admin: true,
            };
            users.push(newErzyshAdmin);
            await saveUsers(users);
            return NextResponse.json({ message: 'Admin user erzysh registered successfully', userID: newErzyshAdmin.userID }, { status: 201 });
        }
    } else { // For other users
        if (existingUser) {
            return NextResponse.json({ message: 'Username already exists' }, { status: 409 });
        }
        const newUser: User = {
            userID: uuidv4(),
            username,
            password_hash: hashedPassword,
            is_admin: false,
        };
        users.push(newUser);
        await saveUsers(users);
        return NextResponse.json({ message: 'User registered successfully', userID: newUser.userID }, { status: 201 });
    }

    await saveUsers(users); // Save changes for erzysh if they existed

    // This part is mainly for updating the placeholder password for 'erzysh' if it was pre-existing
    // and this registration call is effectively setting its password for the first time.
    const finalUsers = await getUsers(); // Re-read to be sure
    const erzyshUser = finalUsers.find(u => u.username === 'erzysh');
    if (erzyshUser && erzyshUser.password_hash === 'plain_password_erzysh_will_be_hashed_later' && username === 'erzysh') {
        erzyshUser.password_hash = hashedPassword; // ensure it's the newly hashed one
        await saveUsers(finalUsers);
    }
     // Find the user that was just processed to return their userID
    const registeredUser = users.find(u => u.username === username);


    return NextResponse.json({ message: `User ${username} processed.`, userID: registeredUser?.userID }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    // Log the specific error if possible
    if (error instanceof Error) {
        console.error(error.message);
        if (error.stack) console.error(error.stack);
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
