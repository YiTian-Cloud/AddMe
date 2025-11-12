'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  getMyGroups,
  getAllGroups,
  getPosts,
  createPost,
  joinGroup,
  createGroup, // optional: still available via API
} from './lib/api';
import { publicBaseUrl } from './lib/url';
import { QRCodeCanvas } from 'qrcode.react';

export default function LandingPage() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');

  const [myGroups, setMyGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);

  // My Groups selection drives composer + previous posts
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');

  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [showSignupQR, setShowSignupQR] = useState(false);

  const base = publicBaseUrl();
  const signupUrl = `${base}/signup`;

  // ---- Auth from localStorage ----
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t && u) {
      setToken(t);
      try { setUser(JSON.parse(u)); } catch { setUser(null); }
    }
  }, []);

  // ---- Load groups when logged in ----
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setError('');
        const [mine, all] = await Promise.all([getMyGroups(token), getAllGroups(token)]);
        setMyGroups(Array.isArray(mine) ? mine : []);
        setAllGroups(Array.isArray(all) ? all : []);
        // auto-select first of "My Groups" for posting
        if (!selectedGroupId && mine?.length) setSelectedGroupId(mine[0]._id);
      } catch (e) {
        setError(e.message || 'Failed to load groups');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ---- Load posts when "My Group" changes ----
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

  // ---- Actions ----
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

  const handleJoinSelected = async (groupId) => {
    try {
      setStatus('Joining group…');
      setError('');
      await joinGroup(token, groupId);
      // refresh my groups
      const mine = await getMyGroups(token);
      setMyGroups(Array.isArray(mine) ? mine : []);
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
    setPosts([]);
    setShowSignupQR(false);
  };

  // ---- Derived ----
  const nonMemberGroups = useMemo(
    () => allGroups.filter(g => !myGroups.find(mg => mg._id === g._id)),
    [allGroups, myGroups]
  );

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

        {/* Logged out: Big Signup QR */}
        {!user && (
          <section className="text-center mt-14">
            <h2 className="text-4xl font-bold mb-4 text-slate-700">
              Share this QR to sign up instantly
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
            {/* Toggleable Signup QR (single, not per-group) */}
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

            {/* Join Groups (no QR here) */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3 text-slate-700">Browse & Join Groups</h2>
              {allGroups.length === 0 && (
                <p className="text-slate-600">No groups exist yet.</p>
              )}
              {allGroups.length > 0 && (
                <div className="flex gap-3">
                  <select
                    className="flex-1 border rounded-lg p-2"
                    value={nonMemberGroups[0]?._id || ''}
                    onChange={() => {}}
                  >
                    {allGroups.map(g => (
                      <option key={g._id} value={g._id}>
                        {g.name}
                        {myGroups.find(mg => mg._id === g._id) ? ' (Joined)' : ''}
                      </option>
                    ))}
                  </select>
                  {/* Explicit join control: choose from the list above */}
                  <button
                    className="px-4 py-2 border rounded-lg"
                    onClick={() => {
                      const selectEl = document.querySelector('select');
                      const val = selectEl?.value;
                      if (val) handleJoinSelected(val);
                    }}
                  >
                    Join Selected
                  </button>
                </div>
              )}
            </section>

            {/* My Groups -> select one to write, and collapse previous posts */}
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
                  {myGroups.map(g => (
                    <option key={g._id} value={g._id}>{g.name}</option>
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

            {/* Collapsed "View previous posts" */}
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
