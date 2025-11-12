// app/join/layout.js
import { Suspense } from "react";

export default function JoinLayout({ children }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
