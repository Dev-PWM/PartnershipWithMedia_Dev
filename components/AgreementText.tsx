import type { Agreement } from "@/lib/agreement";

// The agreement as written, shared by /agreement and the buyer's order page. Clauses still waiting on a business
// decision carry a visible marker until the agreement is approved.
export default function AgreementText({ agreement }: { agreement: Agreement }) {
  return (
    <article aria-label={agreement.title} className="space-y-6 [&_h3]:text-textlight">
      <p className="text-xs text-muted font-black uppercase tracking-widest">
        {agreement.title} · Version {agreement.version}
      </p>
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
