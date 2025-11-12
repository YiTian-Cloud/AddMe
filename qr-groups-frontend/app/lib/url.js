// app/lib/url.js
export function publicBaseUrl() {
    const fromEnv =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_VERCEL_URL; // often just the host
  
    if (fromEnv) {
      const base = fromEnv.startsWith('http') ? fromEnv : `https://${fromEnv}`;
      return base.replace(/\/$/, '');
    }
  
    // Client-side fallback (never used at build time)
    if (typeof window !== 'undefined') return window.location.origin;
  
    return 'http://localhost:3000';
  }
  