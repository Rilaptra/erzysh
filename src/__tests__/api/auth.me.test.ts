// src/__tests__/api/auth.me.test.ts
import { GET } from '@/app/api/auth/me/route';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Pastikan JWT_SECRET konsisten dengan yang digunakan di authUtils.ts dan middleware.ts
// Di jest.setup.js atau jest.config.js, Anda bisa mengatur process.env.JWT_SECRET
// Untuk tes ini, kita akan menggunakan nilai yang sama, asumsikan sudah diatur global atau gunakan default.
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-super-secret-key';

describe('API Route: /api/auth/me GET', () => {
  it('should return 401 and "Not authenticated" message if no token cookie is provided', async () => {
    // Membuat NextRequest tanpa cookie 'token'
    const request = new NextRequest('http://localhost/api/auth/me');

    const response = await GET(request);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.message).toBe('Not authenticated');
  });

  it('should return 401 and "Not authenticated" message if the token is invalid or malformed', async () => {
    const request = new NextRequest('http://localhost/api/auth/me', {
      headers: {
        cookie: 'token=this.is.an.invalid.token', // Token yang tidak valid
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.message).toBe('Not authenticated'); // verifyAuth akan mengembalikan null untuk token yang buruk
  });

  it('should return 401 if token is expired (requires manual token creation with expiry for exact test)', async () => {
    // Membuat token yang sudah kadaluwarsa
    const expiredUserData = { userID: 'expiredUser', username: 'expired', isAdmin: false };
    const expiredToken = jwt.sign(expiredUserData, JWT_SECRET, { expiresIn: '0s' }); // Kadaluwarsa segera

    // Mungkin perlu sedikit delay agar token benar-benar dianggap kadaluwarsa oleh sistem
    await new Promise(resolve => setTimeout(resolve, 50));

    const request = new NextRequest('http://localhost/api/auth/me', {
      headers: {
        cookie: `token=${expiredToken}`,
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.message).toBe('Not authenticated');
  });


  it('should return 200 and user data if a valid non-admin token is provided', async () => {
    const userData = { userID: 'testUser001', username: 'testUser', isAdmin: false };
    const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '1h' });

    const request = new NextRequest('http://localhost/api/auth/me', {
      headers: {
        cookie: `token=${token}`,
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.message).toBe('Authenticated');
    expect(body.user).toEqual(userData);
  });

  it('should return 200 and admin user data if a valid admin token is provided', async () => {
    const adminUserData = { userID: 'adminUser007', username: 'adminTest', isAdmin: true };
    const token = jwt.sign(adminUserData, JWT_SECRET, { expiresIn: '1h' });

    const request = new NextRequest('http://localhost/api/auth/me', {
      headers: {
        cookie: `token=${token}`,
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.message).toBe('Authenticated');
    expect(body.user).toEqual(adminUserData);
  });
});
