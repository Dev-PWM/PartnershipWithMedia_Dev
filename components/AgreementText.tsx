import type { Agreement } from "@/lib/agreement";

// The agreement as written, shared by /agreement and the buyer's order page. Clauses still waiting on a business
// decision carry a visible marker until the agreement is approved.
export default function AgreementText({ agreement }: { agreement: Agreement }) {
  return (
    <article aria-label={agreement.title} className="space-y-6 [&_h3]:text-textlight">
      <p className="text-xs text-muted font-black uppercase tracking-widest">
        {agreement.title} · Version {agreement.version}
      </p>
      {agreement.keyTerms.length > 0 && (
        <section aria-label="Key terms" className="border border-border p-5">
          <h3 className="font-black uppercase tracking-wide">Key terms at a glance</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted font-bold leading-relaxed">
            {agreement.keyTerms.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">The full terms below apply. This summary is for convenience only.</p>
        </section>
      )}
      {agreement.sections.map((s) => (
        <section key={s.heading}>
          <h3 className="font-black uppercase tracking-wide">
            {s.heading}
            {s.draft && !agreement.approved && (
              <span className="ml-3 align-middle border border-accent px-2 py-0.5 text-[10px] text-accent tracking-widest">To be confirmed</span>
            )}
          </h3>
          {s.body.map((p) => (
            <p key={p} className="mt-2 text-muted font-bold leading-relaxed">{p}</p>
          ))}
        </section>
      ))}
    </article>
  );
}
