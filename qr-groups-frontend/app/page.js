'use client';

import { useState, useEffect } from 'react';
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

export default function LandingPage() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [myGroups, setMyGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const mine = await getMyGroups(token);
        setMyGroups(Array.isArray(mine) ? mine : []);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [token]);

  const loadPosts = async (groupId) => {
    try {
      const data = await getPosts(token, groupId);
      setPosts(Array.isArray(data) ? data : data.posts || []);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSelectGroup = (e) => {
    const id = e.target.value;
    setSelectedGroupId(id);
    if (id) loadPosts(id);
  };

  const handleSendPost = async (e) => {
    e.preventDefault();
    if (!newPost.trim() || !selectedGroupId) return;
    try {
      await createPost(token, selectedGroupId, newPost.trim());
      setNewPost('');
      loadPosts(selectedGroupId);
    } catch (e2) {
      setError(e2.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setToken('');
    setMyGroups([]);
    setPosts([]);
  };

  const base = publicBaseUrl();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans">
      <div className="max-w-3xl mx-auto py-10 px-4">
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

        {!user && (
          <section className="text-center mt-24">
            <h2 className="text-4xl font-bold mb-6 text-slate-700">
              Join or create groups instantly
            </h2>
            <p className="text-slate-500 mb-10">
              Scan a QR or sign up to start connecting.
            </p>
            <div className="flex justify-center gap-6">
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

        {user && (
          <>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3 text-slate-700">
                Welcome, {user.name}
              </h2>

              <label className="block text-sm text-slate-600 mb-2">
                Choose a group:
              </label>
              <select
                className="w-full border border-slate-300 rounded-lg p-2 mb-4 focus:ring-2 focus:ring-blue-500"
                value={selectedGroupId}
                onChange={handleSelectGroup}
              >
                <option value="">-- Select a group --</option>
                {myGroups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </section>

            {/* POST BOX */}
            {selectedGroupId && (
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
            )}

            {/* POSTS */}
            {selectedGroupId && (
              <section>
                <h3 className="text-lg font-semibold mb-3 text-slate-700">
                  Recent Posts
                </h3>
                <div className="space-y-3">
                  {posts.map((p) => (
                    <details
                      key={p._id}
                      className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm"
                    >
                      <summary className="cursor-pointer font-medium text-slate-800">
                        {p.author?.name || 'Anonymous'}
                        <span className="text-sm text-slate-500 ml-2">
                          {new Date(p.createdAt).toLocaleString()}
                        </span>
                      </summary>
                      <p className="mt-2 text-slate-700">{p.content}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {error && (
              <div className="mt-6 p-3 text-sm bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
