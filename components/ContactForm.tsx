"use client";

import { useState } from "react";
import { HONEYPOT_FIELD, validateContact, type FieldErrors } from "@/lib/contact";
import { contact, projectTypes, type ProjectType } from "@/lib/content";
import { useProjectType } from "./ProjectType";

const label = "block text-xs font-black uppercase tracking-widest mb-4";
const field =
  "w-full bg-bgdark border-2 border-border p-4 font-bold text-accent placeholder:text-muted focus:outline-none focus:border-accent transition-all aria-[invalid=true]:border-red-500";

type Status = "idle" | "sending" | "sent" | "error";

function FieldError({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return (
    <p id={id} className="mt-2 text-xs font-bold uppercase tracking-widest text-red-400">
      {msg}
    </p>
  );
}

export default function ContactForm() {
  const { projectType, setProjectType } = useProjectType();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form));

    const { errors: clientErrors } = validateContact(payload);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setStatus("sending");
    setServerError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.errors) setErrors(json.errors);
        setServerError(json.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      form.reset();
      setStatus("sent");
    } catch {
      setServerError("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="bg-surface border-4 border-white p-10 md:p-16 flex flex-col justify-center" role="status">
        <span className="pulse-dot mb-8" />
        <h3 className="text-4xl font-black tracking-tighter uppercase mb-6">Transmission Received.</h3>
        <p className="text-muted font-bold leading-relaxed mb-10">
          Thanks. I read every inquiry myself and will reply from {contact.email.toLowerCase()}.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="self-start bg-accent text-black px-8 py-4 font-black uppercase tracking-widest text-sm brutalist-button"
        >
          Send Another
        </button>
      </div>
    );
  }

  return (
    <form className="bg-surface border-4 border-white p-10 md:p-16" onSubmit={onSubmit} noValidate>
      {/* Honeypot: hidden from people and screen readers, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={HONEYPOT_FIELD}>Website</label>
        <input id={HONEYPOT_FIELD} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid sm:grid-cols-2 gap-10 mb-10">
        <div>
          <label htmlFor="name" className={label}>Identification</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Full Name"
            maxLength={100}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={field}
          />
          <FieldError id="name-error" msg={errors.name} />
        </div>
        <div>
          <label htmlFor="email" className={label}>Transmission_IP</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Email Address"
            maxLength={254}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={field}
          />
          <FieldError id="email-error" msg={errors.email} />
        </div>
      </div>
      <div className="mb-10">
        <label htmlFor="project-type" className={label}>Project_Protocol</label>
        <select
          id="project-type"
          name="projectType"
          value={projectType}
          onChange={(e) => setProjectType(e.target.value as ProjectType)}
          className={`${field} appearance-none uppercase`}
        >
          {projectTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <FieldError id="project-type-error" msg={errors.projectType} />
      </div>
      <div className="mb-12">
        <label htmlFor="message" className={label}>Brief_Payload</label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Brief technical scope..."
          maxLength={5000}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={`${field} resize-none`}
        />
        <FieldError id="message-error" msg={errors.message} />
      </div>
      {status === "error" && serverError && (
        <p role="alert" className="mb-6 border-2 border-red-500 p-4 text-sm font-bold text-red-400">
          {serverError}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full bg-accent text-black py-6 font-black uppercase tracking-widest text-lg brutalist-button disabled:opacity-60 disabled:cursor-wait"
      >
        {status === "sending" ? "Transmitting..." : "Send Transmission"}
      </button>
    </form>
  );
}
