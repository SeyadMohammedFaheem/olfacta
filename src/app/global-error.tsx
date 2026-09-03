"use client";

export const dynamic = "force-dynamic";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
          <h2>Application Error</h2>
          <p style={{ color: "#666" }}>An unexpected error occurred.</p>
          <button
            onClick={() => reset()}
            style={{ padding: "0.5rem 1rem", marginTop: "1rem", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
