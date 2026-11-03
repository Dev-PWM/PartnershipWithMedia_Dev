"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// The buyer types their legal name and confirms; the server records the signature against the exact agreement
// version shown on the page. The button stays disabled while a submission is in flight, so a double click signs once.
export default function SignAgreement({ token, version, defaultName }: { token: string; version: string; defaultName: string }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/orders/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, version, name, consent }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Couldn't record your signature. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" aria-describedby={error ? "sign-error" : undefined}>
      <div>
        <label htmlFor="signer-name" className="block text-xs font-black uppercase tracking-widest mb-2">Your full legal name</label>
        <input
          id="signer-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
          className="w-full bg-surface border-2 border-border focus:border-accent outline-none px-4 py-3 font-bold"
        />
      </div>
      <label className="flex gap-3 items-start font-bold text-sm leading-relaxed">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required className="mt-1 h-5 w-5 accent-[#ccff00]" />
        <span>I have read this agreement, I agree to it, and I agree to sign it electronically. Typing my name above is my signature.</span>
      </label>
      <button
        type="submit"
        disabled={pending || !consent || name.trim().length < 2}
        className="w-full sm:w-auto bg-accent text-black px-8 py-4 font-black uppercase tracking-widest brutalist-button disabled:opacity-60"
      >
        {pending ? "Signing…" : "Sign agreement"}
      </button>
      {error && (
        <p id="sign-error" role="alert" className="text-sm font-bold text-red-400">{error}</p>
      )}
    </form>
  );
}
