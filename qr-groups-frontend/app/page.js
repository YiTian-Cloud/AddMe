'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  getMyGroups,
  getAllGroups,
  getPosts,
  createPost,
  joinGroup,
  createGroup,
} from './lib/api';
import { publicBaseUrl } from './lib/url';
import { QRCodeCanvas } from 'qrcode.react';

export default function LandingPage() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');

  const [myGroups, setMyGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);

  // Composer + previous posts are driven by "my groups" selection
  const [selectedGroupId, setSelectedGroupId] = useState('');

  // Join flow is driven by a separate "browse all" selection
  const [selectedJoinGroupId, setSelectedJoinGroupId] = useState('');

  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');

  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [showSignupQR, setShowSignupQR] = useState(false);

  // ---------- URLs ----------
  const base = publicBaseUrl();
  const signupUrl = `${base}/signup`;

  // ---------- Auth from localStorage ----------
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t && u) {
      setToken(t);
      try { setUser(JSON.parse(u)); } catch { setUser(null); }
    }
  }, []);

  // ---------- Load groups after sign-in ----------
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setError('');
        const [mine, all] = await Promise.all([getMyGroups(token), getAllGroups(token)]);
        const mineArr = Array.isArray(mine) ? mine : [];
        const allArr = Array.isArray(all) ? all : [];
        setMyGroups(mineArr);
        setAllGroups(allArr);

        // Auto-select a my-group for composer if none selected
        if (!selectedGroupId && mineArr.length) setSelectedGroupId(mineArr[0]._id);
        // Default join dropdown to the first all-group
        if (!selectedJoinGroupId && allArr.length) setSelectedJoinGroupId(allArr[0]._id);
      } catch (e) {
        setError(e.message || 'Failed to load groups');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ---------- Load posts when my-group selection changes ----------
  useEffect(() => {
    if (!token || !selectedGroupId) { setPosts([]); return; }
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

  // ---------- Helpers ----------
  const refreshMyAndAll = async () => {
    const [mine, all] = await Promise.all([getMyGroups(token), getAllGroups(token)]);
    const mineArr = Array.isArray(mine) ? mine : [];
    const allArr = Array.isArray(all) ? all : [];
    setMyGroups(mineArr);
    setAllGroups(allArr);
    return { mineArr, allArr };
  };

  // ---------- Handlers ----------
  const handleSelectMyGroup = (id) => {
    setSelectedGroupId(id);
    setPosts([]);
  };

  const handleSendPost = async (e) => {
    e.preventDefault();
    if (!newPost.trim() || !selectedGroupId) return;
    try {
      setStatus('Posting…');
      setError('');
      await createPost(token, selectedGroupId, newPost.trim());
      setNewPost('');
      const data = await getPosts(token, selectedGroupId);
      const list = Array.isArray(data) ? data : (Array.isArray(data?.posts) ? data.posts : []);
      setPosts(list);
      setStatus('Posted!');
    } catch (e2) {
      setError(e2.message || 'Failed to create post');
    } finally {
      setTimeout(() => setStatus(''), 1200);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const name = e.target.elements.groupName?.value?.trim();
    const description = e.target.elements.groupDesc?.value?.trim() || '';
    if (!name) return;

    try {
      setStatus('Creating group…');
      setError('');
      await createGroup(token, { name, description });

      // Refresh lists and auto-select the newly created group if we can detect it
      const { mineArr, allArr } = await refreshMyAndAll();
      // Best effort: pick the last in myGroups as newly created (or keep previous)
      const newestMine = mineArr[mineArr.length - 1];
      if (newestMine?._id) {
        setSelectedGroupId(newestMine._id);
        // Also set join dropdown to that group for convenience
        setSelectedJoinGroupId(newestMine._id);
      } else if (allArr.length && !selectedJoinGroupId) {
        setSelectedJoinGroupId(allArr[0]._id);
      }

      e.target.reset();
      setStatus('Group created!');
    } catch (e2) {
      setError(e2.message || 'Failed to create group');
    } finally {
      setTimeout(() => setStatus(''), 1500);
    }
  };

  const handleJoinSelected = async () => {
    if (!selectedJoinGroupId) return;
    try {
      setStatus('Joining group…');
      setError('');
      await joinGroup(token, selectedJoinGroupId);

      // Refresh and make the newly joined group the active one for posting
      const { mineArr } = await refreshMyAndAll();
      const justJoined = mineArr.find(g => g._id === selectedJoinGroupId);
      if (justJoined) {
        setSelectedGroupId(justJoined._id);
      }
      setStatus('Joined!');
    } catch (e) {
      setError(e.message || 'Failed to join group');
    } finally {
      setTimeout(() => setStatus(''), 1200);
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
    setSelectedJoinGroupId('');
    setPosts([]);
    setShowSignupQR(false);
  };

  // ---------- Derived ----------
  const myGroupsOptions = myGroups.map(g => ({ value: g._id, label: g.name }));
  const allGroupsOptions = allGroups.map(g => ({
    value: g._id,
    label: `${g.name}${myGroups.find(mg => mg._id === g._id) ? ' (Joined)' : ''}`,
  }));

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
      <div className="max-w-4xl mx-auto py-10 px-4">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-slate-800">QR Groups</h1>
          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSignupQR(v => !v)}
                className="px-3 py-2 border border-slate-800 text-slate-800 rounded-lg hover:bg-slate-100"
              >
                {showSignupQR ? 'Hide' : 'Share'} Signup QR
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Log out
              </button>
            </div>
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

        {/* Logged out: single big signup QR */}
        {!user && (
          <section className="text-center mt-14">
            <h2 className="text-4xl font-bold mb-4 text-slate-700">
              Share this QR so friends can sign up instantly
            </h2>
            <p className="text-slate-500 mb-6">
              New friends can scan to create an account in seconds.
            </p>
            <div className="bg-white inline-block p-6 rounded-2xl shadow">
              <QRCodeCanvas value={signupUrl} size={220} includeMargin />
              <div className="mt-2 text-xs text-slate-600 break-all">{signupUrl}</div>
              <div className="mt-3">
                <button
                  className="text-sm border rounded px-3 py-1.5"
                  onClick={() => navigator.clipboard.writeText(signupUrl)}
                >
                  Copy link
                </button>
              </div>
            </div>
            <div className="mt-10 flex justify-center gap-4">
              <Link href="/login" className="px-6 py-3 bg-blue-600 text-white rounded-xl text-lg hover:bg-blue-500">
                Log in
              </Link>
              <Link href="/signup" className="px-6 py-3 bg-white border border-blue-600 text-blue-600 rounded-xl text-lg hover:bg-blue-50">
                Sign up
              </Link>
            </div>
          </section>
        )}

        {/* Logged in content */}
        {user && (
          <>
            {/* Toggleable Signup QR */}
            {showSignupQR && (
              <section className="mb-8">
                <div className="border rounded-2xl p-5 bg-white shadow flex flex-col items-center">
                  <div className="text-sm text-slate-700 mb-2">
                    Share this QR with new friends — it opens the signup page.
                  </div>
                  <QRCodeCanvas value={signupUrl} size={200} includeMargin />
                  <div className="mt-2 text-xs text-slate-600 break-all">{signupUrl}</div>
                  <div className="mt-3">
                    <button
                      className="text-sm border rounded px-3 py-1.5"
                      onClick={() => navigator.clipboard.writeText(signupUrl)}
                    >
                      Copy link
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Create Group */}
            <section className="mb-8 bg-white shadow rounded-2xl p-5">
              <h3 className="text-lg font-semibold mb-3">Create a new group</h3>
              <form onSubmit={handleCreateGroup} className="space-y-3">
                <input
                  name="groupName"
                  className="w-full border rounded-lg p-2"
                  placeholder="Group name"
                  required
                />
                <input
                  name="groupDesc"
                  className="w-full border rounded-lg p-2"
                  placeholder="Description (optional)"
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

            {/* Browse & Join Groups */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3 text-slate-700">Browse & Join Groups</h2>
              {allGroups.length === 0 && (
                <p className="text-slate-600">No groups exist yet.</p>
              )}
              {allGroups.length > 0 && (
                <div className="flex gap-3">
                  <select
                    className="flex-1 border rounded-lg p-2"
                    value={selectedJoinGroupId}
                    onChange={(e) => setSelectedJoinGroupId(e.target.value)}
                  >
                    {allGroupsOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                    onClick={handleJoinSelected}
                    disabled={!selectedJoinGroupId || !!myGroups.find(mg => mg._id === selectedJoinGroupId)}
                    title={myGroups.find(mg => mg._id === selectedJoinGroupId) ? 'Already joined' : 'Join this group'}
                  >
                    {myGroups.find(mg => mg._id === selectedJoinGroupId) ? 'Joined' : 'Join'}
                  </button>
                </div>
              )}
            </section>

            {/* My Groups -> Select one to write, previous posts collapsed */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3 text-slate-700">My Groups</h2>
              {myGroups.length === 0 && <p className="text-slate-600">You haven't joined any groups yet.</p>}
              {myGroups.length > 0 && (
                <select
                  className="w-full border rounded-lg p-2"
                  value={selectedGroupId}
                  onChange={(e) => handleSelectMyGroup(e.target.value)}
                >
                  <option value="">-- Select a group --</option>
                  {myGroupsOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
            </section>

            {/* Composer */}
            {selectedGroupId && (
              <section className="bg-white shadow-md rounded-2xl p-5 mb-6">
                <form onSubmit={handleSendPost}>
                  <textarea
                    rows={4}
                    placeholder="Share something with your group…"
                    className="w-full border border-slate-300 rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    onFocus={(e) => e.target.setAttribute('rows', 6)}
                    onBlur={(e) => e.target.setAttribute('rows', 4)}
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-500"
                    >
                      Post
                    </button>
                    {status && <span className="text-sm text-green-600">{status}</span>}
                    {error && <span className="text-sm text-red-600">{error}</span>}
                  </div>
                </form>
              </section>
            )}

            {/* Collapsed previous posts */}
            {selectedGroupId && (
              <section className="mb-8">
                <details className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                  <summary className="cursor-pointer font-medium text-slate-800">
                    View previous posts ({posts.length})
                  </summary>
                  <div className="mt-3 space-y-3">
                    {posts.length === 0 && (
                      <div className="text-sm text-slate-500">No posts yet.</div>
                    )}
                    {posts.map((p) => (
                      <div key={p._id} className="border rounded-lg p-3">
                        <div className="text-sm text-slate-500">
                          {p.author?.name || 'Anonymous'} • {p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}
                        </div>
                        {p.content && <div className="mt-1 text-slate-800">{p.content}</div>}
                      </div>
                    ))}
                  </div>
                </details>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
