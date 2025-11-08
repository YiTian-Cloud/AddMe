// app/lib/api.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const headers = {
    ...defaultHeaders,
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  let data = {};
  try {
    data = await res.json();
  } catch (_) {
    // ignore if no JSON body
  }

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export async function getGroups() {
  return apiRequest('/groups', { method: 'GET' });
}

export async function createGroup(token, { name, description }) {
  return apiRequest('/groups', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, description }),
  });
}

export async function joinGroup(token, groupId) {
  return apiRequest(`/groups/${groupId}/join`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
