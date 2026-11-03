"use client";

import { useState } from "react";

// `site` is a client's own hostname when they arrive from a buy link; it tags the purchase.
export default function CheckoutButton({ offer, site, children }: { offer: string; site?: string; children: React.ReactNode }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onClick() {
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer, site }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error);
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Couldn't start checkout. Please try again.");
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="w-full whitespace-nowrap bg-accent text-black px-4 py-4 text-sm sm:text-base font-black uppercase tracking-widest brutalist-button disabled:opacity-60"
      >
        {pending ? "Redirecting…" : children}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-xs font-bold uppercase tracking-widest text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
