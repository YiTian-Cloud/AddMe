'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  getMyGroups,
  getAllGroups,
  createGroup,
  joinGroup,
  getPosts,
  createPost,
} from './lib/api';
import { publicBaseUrl } from './lib/url';
import { QRCodeCanvas } from 'qrcode.react';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');

  const [myGroups, setMyGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);

  // "My Groups" selector drives the Posts panel
  const [selectedGroupId, setSelectedGroupId] = useState('');
  // "All Groups" selector drives the QR preview panel
  const [selectedAllGroupId, setSelectedAllGroupId] = useState('');

  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });

  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  // --- load auth from localStorage ---
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  // --- load groups when we have a token ---
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setError('');
        const [mine, all] = await Promise.all([getMyGroups(token), getAllGroups(token)]);
        setMyGroups(Array.isArray(mine) ? mine : []);
        setAllGroups(Array.isArray(all) ? all : []);
        if (all?.length && !selectedAllGroupId) setSelectedAllGroupId(all[0]._id);
      } catch (e) {
        setError(e.message || 'Failed to load groups');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // --- refresh groups helper ---
  const refreshGroups = async () => {
    if (!token) return;
    try {
      const [mine, all] = await Promise.all([getMyGroups(token), getAllGroups(token)]);
      setMyGroups(Array.isArray(mine) ? mine : []);
      setAllGroups(Array.isArray(all) ? all : []);
    } catch (e) {
      setError(e.message || 'Failed to refresh groups');
    }
  };

  // --- select "My Group" -> load posts ---
  useEffect(() => {
    if (!token || !selectedGroupId) return;
    (async () => {
      try {
        setError('');
        const data = await getPosts(token, selectedGroupId);
        const list = Array.isArray(data) ? data : (Array.isArray(data?.posts) ? data.posts : []);
        setPosts(list);
      } catch (e) {
        setError(e.message || 'Failed to load posts');
      }
    })();
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
      const list = Array.isArray(data) ? data : (Array.isArray(data?.posts) ? data.posts : []);
      setPosts(list);
    } catch (e) {
      setError(e.message || 'Failed to create post');
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
    } catch (e) {
      setError(e.message || 'Failed to create group');
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
    } catch (e) {
      setError(e.message || 'Failed to join group');
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

  // --- QR helpers ---
  const base = publicBaseUrl();
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  const selectedAllGroup = useMemo(
    () => allGroups.find((g) => g._id === selectedAllGroupId),
    [allGroups, selectedAllGroupId]
  );
  const isMemberOfSelectedAllGroup = useMemo(
    () => !!myGroups.find((mg) => mg._id === selectedAllGroupId),
    [myGroups, selectedAllGroupId]
  );
  const qrJoinUrl = useMemo(() => {
    if (!selectedAllGroupId) return '';
    return `${base}/join?groupId=${selectedAllGroupId}`;
  }, [base, selectedAllGroupId]);
  const backendQrPng = useMemo(() => {
    if (!selectedAllGroupId || !apiBase) return '';
    return `${apiBase}/qr/group/${selectedAllGroupId}.png`;
  }, [apiBase, selectedAllGroupId]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
      <div className="max-w-4xl mx-auto py-10 px-4">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-slate-800">QR Groups</h1>
          {user ? (
            <button
              onClick={handleLogout}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Log out
            </button>
          ) : (
            <div className="space-x-3">
              <Link
                href="/login"
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 border border-slate-800 text-slate-800 rounded-lg hover:bg-slate-100"
              >
                Sign up
              </Link>
            </div>
          )}
        </header>

        {/* Hero for logged-out */}
        {!user && (
          <section className="text-center mt-20">
            <h2 className="text-4xl font-bold mb-4 text-slate-700">
              Join or create groups instantly
            </h2>
            <p className="text-slate-500 mb-8">
              Scan a QR or sign up to start connecting.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/login"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-lg hover:bg-blue-500"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-6 py-3 bg-white border border-blue-600 text-blue-600 rounded-xl text-lg hover:bg-blue-50"
              >
                Sign up
              </Link>
            </div>
          </section>
        )}

        {/* Logged-in area */}
        {user && (
          <>
            {/* My Groups selector */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3 text-slate-700">
                Welcome, {user.name}
              </h2>

              <label className="block text-sm text-slate-600 mb-2">
                Choose one of your groups to view posts:
              </label>
              <select
                className="w-full border border-slate-300 rounded-lg p-2 mb-4 focus:ring-2 focus:ring-blue-500"
                value={selectedGroupId}
                onChange={(e) => handleSelectGroup(e.target.value)}
              >
                <option value="">-- Select a group --</option>
                {myGroups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </section>

            {/* Create Group card */}
            <section className="mb-8 bg-white shadow rounded-2xl p-5">
              <h3 className="text-lg font-semibold mb-3">Create a new group</h3>
              <form onSubmit={handleCreateGroup} className="space-y-3">
                <input
                  className="w-full border rounded-lg p-2"
                  placeholder="Group name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
                <input
                  className="w-full border rounded-lg p-2"
                  placeholder="Description (optional)"
                  value={newGroup.description}
                  onChange={(e) =>
                    setNewGroup((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                >
                  Create Group
                </button>
                {status && <p className="text-green-600">{status}</p>}
                {error && <p className="text-red-600">{error}</p>}
              </form>
            </section>

            {/* All Groups dropdown + QR preview */}
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-2">All Groups</h3>

              {allGroups.length === 0 && <p>No groups exist yet.</p>}

              {allGroups.length > 0 && (
                <>
                  <label className="block text-sm mb-2">Browse groups</label>
                  <select
                    className="w-full border rounded-lg p-2"
                    value={selectedAllGroupId}
                    onChange={(e) => setSelectedAllGroupId(e.target.value)}
                  >
                    {allGroups.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name}
                      </option>
                    ))}
                  </select>

                  {/* QR / actions for selected group */}
                  {!!selectedAllGroupId && (
                    <div className="mt-4 border rounded-2xl p-4 bg-white shadow">
                      <div className="text-sm text-slate-600 mb-2">
                        {selectedAllGroup?.description || 'No description'}
                      </div>

                      {!isMemberOfSelectedAllGroup && (
                        <button
                          onClick={() => handleJoinGroupClick(selectedAllGroupId)}
                          className="mb-3 px-3 py-1.5 border rounded-lg"
                        >
                          Join this group
                        </button>
                      )}

                      <details>
                        <summary className="cursor-pointer mb-2">📱 Show QR</summary>
                        <div className="mt-3 flex flex-col items-center gap-2">
                          {/* Frontend QR (scan → Vercel domain) */}
                          {qrJoinUrl && <QRCodeCanvas value={qrJoinUrl} size={160} includeMargin />}
                          <div className="text-xs text-slate-600 break-all">{qrJoinUrl}</div>
                          <div className="flex gap-2">
                            <button
                              className="text-sm border rounded px-2 py-1"
                              onClick={() => navigator.clipboard.writeText(qrJoinUrl)}
                            >
                              Copy link
                            </button>

                            {/* Backend-generated QR PNG (download) */}
                            {backendQrPng && (
                              <a
                                href={backendQrPng}
                                download={`group-${selectedAllGroupId}.png`}
                                className="text-sm border rounded px-2 py-1"
                                title="Download QR PNG from backend"
                              >
                                Download PNG
                              </a>
                            )}
                          </div>
                        </div>
                      </details>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Post composer + list (for a selected "My Group") */}
            {selectedGroupId && (
              <>
                <section className="bg-white shadow-md rounded-2xl p-5 mb-8">
                  <form onSubmit={handleSendPost}>
                    <textarea
                      rows={3}
                      placeholder="Share something with your group..."
                      className="w-full border border-slate-300 rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      onFocus={(e) => e.target.setAttribute('rows', 5)}
                      onBlur={(e) => e.target.setAttribute('rows', 3)}
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-500"
                    >
                      Post
                    </button>
                  </form>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-slate-700">Recent Posts</h3>
                  <div className="space-y-3">
                    {posts.map((p) => (
                      <details key={p._id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                        <summary className="cursor-pointer font-medium text-slate-800">
                          {p.author?.name || 'Anonymous'}
                          {p.createdAt && (
                            <span className="text-sm text-slate-500 ml-2">
                              {new Date(p.createdAt).toLocaleString()}
                            </span>
                          )}
                        </summary>
                        {p.content && <p className="mt-2 text-slate-700">{p.content}</p>}
                      </details>
                    ))}
                    {posts.length === 0 && (
                      <div className="text-sm text-slate-500">No posts yet.</div>
                    )}
                  </div>
                </section>
              </>
            )}

            {/* global errors */}
            {error && !status && (
              <div className="mt-6 p-3 text-sm bg-red-100 text-red-700 rounded-lg">{error}</div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
