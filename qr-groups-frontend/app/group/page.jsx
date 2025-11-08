'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'react-qr-code';

export default function GroupPage() {
  const router = useRouter();
  const [groupId, setGroupId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [joinUrl, setJoinUrl] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cgId = localStorage.getItem('currentGroupId');
    const cgName = localStorage.getItem('currentGroupName');

    if (!cgId || !cgName) {
      router.push('/');
      return;
    }

    setGroupId(cgId);
    setGroupName(cgName);

    const url = `${window.location.origin}/join?groupId=${cgId}`;
    setJoinUrl(url);
  }, [router]);

  if (!groupId) {
    return <p style={{ fontFamily: 'sans-serif' }}>Loading group...</p>;
  }

  return (
    <main style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Group: {groupName}</h1>

      <p>
        Share this QR code with friends so they can join <strong>{groupName}</strong>.
      </p>

      {joinUrl && (
        <div
          style={{
            background: 'white',
            padding: '16px',
            display: 'inline-block',
            marginTop: '16px',
          }}
        >
          <QRCode value={joinUrl} size={180} />
        </div>
      )}

      <p style={{ marginTop: 16 }}>
        Or share this link directly: <br />
        <a href={joinUrl}>{joinUrl}</a>
      </p>

      <button
        style={{ marginTop: 24 }}
        onClick={() => router.push('/')}
      >
        Back to home
      </button>
    </main>
  );
}
