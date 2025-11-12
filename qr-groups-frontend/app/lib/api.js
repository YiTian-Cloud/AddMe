// app/lib/api.js
//const API_BASE_URL = 'http://localhost:4000';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL; 

export async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const res = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data.error || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data;
}

export function getMyGroups(token) {
  return apiRequest('/groups/mine', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getAllGroups(token) {
  return apiRequest('/groups', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createGroup(token, { name, description }) {
  return apiRequest('/groups', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, description }),
  });
}

export function joinGroup(token, groupId) {
  return apiRequest(`/groups/${groupId}/join`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getPosts(token, groupId) {
  return apiRequest(`/groups/${groupId}/posts`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createPost(token, groupId, content) {
  return apiRequest(`/groups/${groupId}/posts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content }),
  });
}
