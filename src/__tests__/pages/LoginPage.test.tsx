// src/__tests__/pages/LoginPage.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/login/page';

// Mock fetch
global.fetch = jest.fn();

// Mock useRouter dari next/navigation - sudah di jest.setup.js, tapi bisa di-override jika perlu per tes
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'), // import and retain default behavior
  useRouter: () => ({
    push: mockRouterPush,
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    // Reset mocks sebelum setiap tes
    (fetch as jest.Mock).mockClear();
    mockRouterPush.mockClear();
  });

  it('renders login form correctly', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows error message if username or password are not provided', async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    // findByText waits for the element to appear
    expect(await screen.findByText(/username and password are required./i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('calls login API and redirects on successful login', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Login successful' }), // Data JSON yang di-resolve
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Tunggu hingga fetch dipanggil
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', password: 'password123' }),
      });
    });

    // Tunggu hingga router.push dipanggil
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error message on failed login from API', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false, // API call was made, but login failed (e.g. wrong credentials)
      json: async () => ({ message: 'Invalid credentials. Please check your credentials.' }),
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'wronguser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/invalid credentials. please check your credentials./i)).toBeInTheDocument();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('shows generic error message on network or unexpected API error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error')); // Simulates network failure

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/an unexpected error occurred. please try again./i)).toBeInTheDocument();
  });
});
