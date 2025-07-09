"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  userID: string;
  username: string;
  isAdmin: boolean;
}

interface MessageData {
  id: string;
  channel_id: string;
  name: string;
  size: number;
  userID?: string;
  lastUpdate: string;
  // data?: any; // Sebaiknya tidak mengambil 'data' blob besar di list view umum
}

interface ChannelData {
  id: string;
  name: string;
  messages: MessageData[];
}

interface CategoryData {
  id: string;
  name: string;
  channels: ChannelData[];
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [databaseData, setDatabaseData] = useState<CategoryData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndData = async () => {
      setIsLoading(true);
      setError(null);

      // 1. Fetch user data (check authentication)
      try {
        const userResponse = await fetch('/api/auth/me');
        if (!userResponse.ok) {
          if (userResponse.status === 401) {
            router.push('/login'); // Redirect to login if not authenticated
            return;
          }
          throw new Error(`Failed to fetch user: ${userResponse.statusText}`);
        }
        const userData = await userResponse.json();
        setUser(userData.user);

        // 2. If authenticated, fetch database data
        if (userData.user) {
          const dbResponse = await fetch('/api/database');
          if (!dbResponse.ok) {
            const dbErrorData = await dbResponse.json();
            throw new Error(dbErrorData.message || `Failed to fetch database data: ${dbResponse.statusText}`);
          }
          const dbData = await dbResponse.json();
          setDatabaseData(dbData.data); // Assuming data is under a 'data' key
        }
      } catch (err: any) {
        console.error('Dashboard error:', err);
        setError(err.message || 'An error occurred.');
        if (err.message.toLowerCase().includes('authentication required')) {
            router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndData();
  }, [router]);

  const handleLogout = async () => {
    try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (response.ok) {
            router.push('/login');
        } else {
            const data = await response.json();
            setError(data.message || 'Logout failed.');
        }
    } catch (err) {
        setError('Logout request failed.');
    }
  };


  if (isLoading) {
    return <div style={{ padding: '20px' }}>Loading dashboard...</div>;
  }

  if (error && !user) { // If error and no user info (likely auth error), don't show dashboard structure
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <p>Error: {error}</p>
        <p><a href="/login" style={{ color: '#0070f3' }}>Try logging in again</a></p>
      </div>
    );
  }

  if (!user) { // Should be caught by redirect, but as a fallback
      return <div style={{ padding: '20px' }}>Redirecting to login...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Dashboard</h1>
        <div>
          <span>Welcome, {user.username}! {user.isAdmin && <b>(Admin)</b>}</span>
          <button onClick={handleLogout} style={{ marginLeft: '15px', padding: '8px 12px' }}>Logout</button>
        </div>
      </header>

      {error && <p style={{ color: 'red', marginBottom: '20px' }}>Error fetching data: {error}</p>}

      <h2>Your Data:</h2>
      {databaseData && databaseData.length > 0 ? (
        databaseData.map((category) => (
          <div key={category.id} style={{ marginBottom: '30px', padding: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
            <h3 style={{ marginTop: '0' }}>Category: {category.name} ({category.id})</h3>
            {category.channels && category.channels.length > 0 ? (
              category.channels.map((channel) => (
                <div key={channel.id} style={{ marginLeft: '20px', marginBottom: '15px' }}>
                  <h4>Channel: {channel.name} ({channel.id})</h4>
                  {channel.messages && channel.messages.length > 0 ? (
                    <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                      {channel.messages.map((message) => (
                        <li key={message.id} style={{ marginBottom: '8px', padding: '8px', background: '#f9f9f9', borderRadius: '4px' }}>
                          <strong>{message.name}</strong> (ID: {message.id})
                          <br />
                          Size: {message.size} bytes, Last Update: {new Date(message.lastUpdate).toLocaleString()}
                          {user.isAdmin && message.userID && <><br/>Owner UserID: {message.userID}</>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No messages in this channel.</p>
                  )}
                </div>
              ))
            ) : (
              <p>No channels in this category.</p>
            )}
          </div>
        ))
      ) : (
        <p>{!error ? 'No data found for your user.' : 'Could not load data.'}</p>
      )}

      {user.isAdmin && (
        <div style={{ marginTop: '40px', padding: '20px', border: '2px dashed blue', borderRadius: '8px' }}>
          <h2>Admin Panel</h2>
          <p>As an admin, you can see all data. Additional admin functionalities can be added here.</p>
          {/* Examples:
              - Button to view all users
              - Interface to create new categories/channels directly
              - Interface to delete any data entry
          */}
        </div>
      )}
    </div>
  );
}
