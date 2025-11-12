'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  getMyGroups,
  getAllGroups,
  createGroup,
  joinGroup,
  getPosts,
  createPost,
} from '../lib/api';
import { publicBaseUrl } from '../lib/url';
import { QRCodeCanvas } from 'qrcode.react';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [myGroups, setMyGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);

  const [selectedGroupId, setSelectedGroupId] = useState('');       // My Groups dropdown
  const [selectedAllGroupId, setSelectedAllGroupId] = useState(''); // All Groups dropdown

  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  // Load token + user from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Load groups when we have a token
  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        setError('');
        const [mine, all] = await Promise.all([
          getMyGroups(token),
          getAllGroups(token),
        ]);
        setMyGroups(Array.isArray(mine) ? mine : []);
        setAllGroups(Array.isArray(all) ? all : []);
        if (all?.length && !selectedAllGroupId) setSelectedAllGroupId(all[0]._id);
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, [token]); // eslint-disable-line

  const refreshGroups = async () => {
    if (!token) return;
    try {
      const [mine, all] = await Promise.all([
        getMyGroups(token),
        getAllGroups(token),
      ]);
      setMyGroups(Array.isArray(mine) ? mine : []);
      setAllGroups(Array.isArray(all) ? all : []);
    } catch (err) {
      setError(err.message);
    }
  };

  // Load posts when "My Groups" selection changes
  useEffect(() => {
    if (!token || !selectedGroupId) return;
    const loadPosts = async () => {
      try {
        setError('');
        const data = await getPosts(token, selectedGroupId);
        setPosts(Array.isArray(data) ? data : (Array.isArray(data?.posts) ? data.posts : []));
      } catch (err) {
        setError(err.message);
      }
    };
    loadPosts();
  }, [token, selectedGroupId]);

  const handleSelectGroup = (groupId) => {
    setSelectedGroupId(groupId);
    setPosts([]);
  };

  const handleSendPost = async (e) => {
    e.preventDefault();
    if (!newPost.trim() || !selectedGroupId) return;
    try {
      setError('');
      await createPost(token, selectedGroupId, newPost.trim());
      setNewPost('');
      const data = await getPosts(token, selectedGroupId);
      setPosts(Array.isArray(data) ? data : (Array.isArray(data?.posts) ? data.posts : []));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.name.trim()) return;
    try {
      setStatus('Creating group...');
      setError('');
      await createGroup(token, {
        name: newGroup.name.trim(),
        description: newGroup.description.trim(),
      });
      setNewGroup({ name: '', description: '' });
      await refreshGroups();
      setStatus('Group created!');
    } catch (err) {
      setError(err.message);
    } finally {
      setTimeout(() => setStatus(''), 1500);
    }
  };

  const handleJoinGroupClick = async (groupId) => {
    try {
      setStatus('Joining group...');
      setError('');
      await joinGroup(token, groupId);
      await refreshGroups();
      setStatus('Joined group!');
    } catch (err) {
      setError(err.message);
    } finally {
      setTimeout(() => setStatus(''), 1500);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setUser(null);
    setToken('');
    setMyGroups([]);
    setAllGroups([]);
    setSelectedGroupId('');
    setSelectedAllGroupId('');
    setPosts([]);
  };

  // ====== QR (no more localhost) ======
  const base = publicBaseUrl();
  const qrJoinUrl = useMemo(() => {
    if (!selectedAllGroupId) return '';
    return `${base}/join?groupId=${selectedAllGroupId}`;
  }, [base, selectedAllGroupId]);

  const selectedAllGroup = useMemo(
    () => allGroups.find(g => g._id === selectedAllGroupId),
    [allGroups, selectedAllGroupId]
  );

  const isMemberOfSelectedAllGroup = useMemo(
    () => !!myGroups.find(mg => mg._id === selectedAllGroupId),
    [myGroups, selectedAllGroupId]
  );

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>QR Groups Dashboard</h1>

      {!user && (
        <p>
          You are not logged in. <Link href="/login">Log in</Link> or{' '}
          <Link href="/signup">Sign up</Link>.
        </p>
      )}

      {user && (
        <>
          <div style={{ marginBottom: 20 }}>
            <p>
              Welcome, <strong>{user.name}</strong> ({user.email}){' '}
              <button onClick={handleLogout}>Log out</button>
            </p>
          </div>

          {error && <p style={{ color: 'red' }}>Error: {error}</p>}
          {status && <p style={{ color: 'green' }}>{status}</p>}

          {/* My groups dropdown */}
          <section style={{ marginBottom: 30 }}>
            <h2>My Groups</h2>
            {myGroups.length === 0 && <p>You are not in any groups yet.</p>}

            {myGroups.length > 0 && (
              <div>
                <label>
                  Choose a group:{' '}
                  <select
                    value={selectedGroupId}
                    onChange={(e) => handleSelectGroup(e.target.value)}
                  >
                    <option value="">-- Select --</option>
                    {myGroups.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </section>

          {/* Create group */}
          <section style={{ marginBottom: 30 }}>
            <h3>Create a new group</h3>
            <form onSubmit={handleCreateGroup}>
              <div style={{ marginBottom: 8 }}>
                <input
                  placeholder="Group name"
                  value={newGroup.name}
                  onChange={(e) =>
                    setNewGroup((prev) => ({ ...prev, name: e.target.value }))
                  }
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div style={{ marginBottom: 8 }}>
                <input
                  placeholder="Description (optional)"
                  value={newGroup.description}
                  onChange={(e) =>
                    setNewGroup((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  style={{ width: '100%' }}
                />
              </div>
              <button type="submit">Create Group</button>
            </form>
          </section>

          {/* All Groups — dropdown + QR preview (no giant list) */}
          <section style={{ marginBottom: 30 }}>
            <h3>All Groups</h3>
            {allGroups.length === 0 && <p>No groups exist yet.</p>}

            {allGroups.length > 0 && (
              <>
                <label>
                  Browse groups:{' '}
                  <select
                    value={selectedAllGroupId}
                    onChange={(e) => setSelectedAllGroupId(e.target.value)}
                  >
                    {allGroups.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Actions for selected group */}
                {selectedAllGroup && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 14, color: '#555' }}>
                      {selectedAllGroup.description || 'No description'}
                    </div>

                    {!isMemberOfSelectedAllGroup && (
                      <button
                        onClick={() => handleJoinGroupClick(selectedAllGroupId)}
                        style={{ marginTop: 8 }}
                      >
                        Join this group
                      </button>
                    )}

                    {/* QR (uses production base, not localhost) */}
                    <details style={{ marginTop: 10 }}>
                      <summary>📱 Show QR</summary>
                      <div style={{ marginTop: 8 }}>
                        {qrJoinUrl && (
                          <>
                            <QRCodeCanvas value={qrJoinUrl} size={140} includeMargin />
                            <p style={{ fontSize: 12, marginTop: 6 }}>
                              Scan to join → {selectedAllGroup.name}
                              <br />
                              <span style={{ color: '#666' }}>{qrJoinUrl}</span>
                            </p>
                          </>
                        )}
                      </div>
                    </details>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Posts for selected group (from "My Groups") */}
          {selectedGroupId && (
            <section>
              <h3>Posts in selected group</h3>
              {posts.length === 0 && <p>No posts yet.</p>}
              <ul>
                {posts.map((p) => (
                  <li key={p._id} style={{ marginBottom: 8 }}>
                    <strong>{p.author?.name || 'Unknown'}:</strong> {p.content}
                  </li>
                ))}
              </ul>

              <form onSubmit={handleSendPost} style={{ marginTop: 12 }}>
                <input
                  placeholder="Write a message"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  style={{ width: '100%', marginBottom: 8 }}
                />
                <button type="submit">Post</button>
              </form>
            </section>
          )}
        </>
      )}
    </main>
  );
}
