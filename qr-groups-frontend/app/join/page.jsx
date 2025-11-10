// app/join/page.js
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { joinGroup } from '../lib/api';

export default function JoinPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('Processing...');
  const [error, setError] = useState('');

  const groupId = params.get('groupId');

  useEffect(() => {
    // try auto join if logged in
    const token = localStorage.getItem('token');
    if (!token || !groupId) {
      setMessage('Please sign up or log in first.');
      return;
    }

    const joinNow = async () => {
      try {
        await joinGroup(token, groupId);
        setMessage('Joined successfully! Redirecting...');
        setTimeout(() => router.push('/'), 1500);
      } catch (err) {
        setError(err.message);
      }
    };

    joinNow();
  }, [groupId]);

  return (
    <main style={{ maxWidth: 400, margin: '60px auto', fontFamily: 'sans-serif' }}>
      <h1>Join Group</h1>

      {groupId ? (
        <>
          <p>Group ID: <strong>{groupId}</strong></p>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <p>{message}</p>

          {!localStorage.getItem('token') && (
            <p>
              <a href="/signup">Sign up</a> or <a href="/login">Log in</a> to join this group.
            </p>
          )}
        </>
      ) : (
        <p>No groupId provided in link.</p>
      )}
    </main>
  );
}
