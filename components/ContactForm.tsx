"use client";

import { projectTypes, type ProjectType } from "@/lib/content";
import { useProjectType } from "./ProjectType";

const label = "block text-xs font-black uppercase tracking-widest mb-4";
const field =
  "w-full bg-bgdark border-2 border-border p-4 font-bold text-accent placeholder:text-muted focus:outline-none focus:border-accent transition-all";

export default function ContactForm() {
  const { projectType, setProjectType } = useProjectType();

  return (
    <form
      className="bg-surface border-4 border-white p-10 md:p-16"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="grid sm:grid-cols-2 gap-10 mb-10">
        <div>
          <label htmlFor="name" className={label}>Identification</label>
          <input id="name" name="name" type="text" placeholder="Full Name" className={field} />
        </div>
        <div>
          <label htmlFor="email" className={label}>Transmission_IP</label>
          <input id="email" name="email" type="email" placeholder="Email Address" className={field} />
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
      </div>
      <div className="mb-12">
        <label htmlFor="message" className={label}>Brief_Payload</label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Brief technical scope..."
          className={`${field} resize-none`}
        />
      </div>
      <button
        type="submit"
        className="w-full bg-accent text-black py-6 font-black uppercase tracking-widest text-lg brutalist-button"
      >
        Send Transmission
      </button>
    </form>
  );
}
