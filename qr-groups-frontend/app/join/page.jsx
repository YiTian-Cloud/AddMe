'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiRequest, joinGroup } from '../lib/api';

export default function JoinPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [groupId, setGroupId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [mode, setMode] = useState('checking'); // 'checking' | 'signup' | 'joining' | 'done' | 'error'
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [form, setForm] = useState({ email: '', name: '', password: '' });

  useEffect(() => {
    const gid = searchParams.get('groupId');
    if (!gid) {
      setError('No group specified in this invite link.');
      setMode('error');
      return;
    }
    setGroupId(gid);
  }, [searchParams]);

  // Try to auto-join if already logged in
  useEffect(() => {
    if (!groupId) return;

    if (typeof window === 'undefined') return;

    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (!storedUser || !storedToken) {
      setMode('signup');
      return;
    }

    async function autoJoin() {
      try {
        setMode('joining');
        setInfo('Joining group...');

        const data = await joinGroup(storedToken, groupId);

        localStorage.setItem('currentGroupId', data.group._id);
        localStorage.setItem('currentGroupName', data.group.name);
        setGroupName(data.group.name);

        setInfo(`You joined group "${data.group.name}".`);
        setMode('done');
      } catch (err) {
        console.error(err);
        setError(err.message);
        setMode('error');
      }
    }

    autoJoin();
  }, [groupId]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignupAndJoin = async (e) => {
    e.preventDefault();
    if (!groupId) return;

    try {
      setError('');
      setInfo('Creating account...');
      setMode('joining');

      const signupData = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', signupData.token);
        localStorage.setItem('user', JSON.stringify(signupData.user));
      }

      const token = signupData.token;

      const joinData = await joinGroup(token, groupId);

      if (typeof window !== 'undefined') {
        localStorage.setItem('currentGroupId', joinData.group._id);
        localStorage.setItem('currentGroupName', joinData.group.name);
      }
      setGroupName(joinData.group.name);

      setInfo(`Account created and joined group "${joinData.group.name}".`);
      setMode('done');
    } catch (err) {
      console.error(err);
      setError(err.message);
      setMode('error');
    }
  };

  if (mode === 'checking') {
    return <p style={{ fontFamily: 'sans-serif' }}>Checking invite...</p>;
  }

  if (mode === 'error') {
    return (
      <main style={{ maxWidth: 500, margin: '40px auto', fontFamily: 'sans-serif' }}>
        <h1>Join Group</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button onClick={() => router.push('/')}>Go to home</button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 500, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Join Group</h1>

      {groupName && (
        <p>
          You are joining <strong>{groupName}</strong>.
        </p>
      )}

      {mode === 'signup' && (
        <>
          <p>You need an account to join this group. Create one below:</p>
          <form onSubmit={handleSignupAndJoin}>
            <div style={{ marginBottom: 8 }}>
              <label>Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                style={{ width: '100%' }}
              />
            </div>
            <button type="submit">Sign up & join group</button>
          </form>
        </>
      )}

      {mode === 'joining' && (
        <p>{info || 'Joining group...'}</p>
      )}

      {mode === 'done' && (
        <>
          <p>{info}</p>
          <button onClick={() => router.push('/group')} style={{ marginTop: 16 }}>
            Go to group page
          </button>
        </>
      )}

      {error && mode !== 'error' && (
        <p style={{ color: 'red', marginTop: 16 }}>{error}</p>
      )}
    </main>
  );
}
