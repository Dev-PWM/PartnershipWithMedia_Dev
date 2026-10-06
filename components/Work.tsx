"use client";

import { useEffect, useRef, useState } from "react";
import { FaXmark } from "react-icons/fa6";
import { caseStudies, type CaseStudy } from "@/lib/content";
import { PresetLink } from "./ProjectType";

export default function Work() {
  const [openId, setOpenId] = useState<string | null>(null);
  // Keep the last study rendered while the modal fades out.
  const [shown, setShown] = useState<CaseStudy>(caseStudies[0]);
  const closeRef = useRef<HTMLButtonElement>(null);

  const open = (study: CaseStudy) => {
    setShown(study);
    setOpenId(study.id);
  };
  const close = () => setOpenId(null);

  useEffect(() => {
    if (!openId) return;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [openId]);

  return (
    <>
      <section id="work" className="py-32 bg-white text-black font-brutalist">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-10">
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
              Project
              <br />
              Log_001
            </h2>
            <p className="text-lg font-bold max-w-sm border-l-4 border-black pl-8">
              A look at the technical architecture behind recent successful shipments.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {caseStudies.map((study) => (
              <article key={study.id}>
                <button
                  type="button"
                  onClick={() => open(study)}
                  className="group block w-full cursor-pointer text-left"
                >
                  <div className="border-4 border-black mb-8 overflow-hidden bg-white shadow-[12px_12px_0px_#CCFF00] group-hover:shadow-none group-hover:translate-x-3 group-hover:translate-y-3 transition-all duration-300">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="w-full h-72 object-cover grayscale"
                      src={study.image}
                      alt={study.cardTitle}
                    />
                  </div>
                  <h3 className="text-3xl font-black mb-2 uppercase tracking-tighter">
                    {study.cardTitle}
                  </h3>
                  <span className="inline-block bg-black text-accent px-3 py-1 text-xs font-black uppercase tracking-widest">
                    Tech Case Study
                  </span>
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div
        className={`modal fixed inset-0 z-[60] flex items-center justify-center p-4 font-brutalist${openId ? " active" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-study-title"
        aria-hidden={!openId}
      >
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={close} />
        <div className="modal-content relative bg-bgdark border-4 border-accent max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close case study"
            className="absolute top-6 right-6 text-muted hover:text-accent transition-colors"
          >
            <FaXmark className="text-3xl" />
          </button>
          <div className="p-10 md:p-20">
            <div className="mb-16">
              <span className="text-accent font-black uppercase tracking-widest text-xs mb-4 block">
                Case_Shipment_Log
              </span>
              <h2
                id="case-study-title"
                className="text-5xl font-black tracking-tighter uppercase mb-10"
              >
                {shown.title}
              </h2>
              <div className="flex flex-wrap gap-4">
                {shown.tech.map((t) => (
                  <span
                    key={t}
                    className="px-4 py-2 border-2 border-accent text-accent text-xs font-black uppercase"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-20">
              <div>
                <h4 className="text-accent font-black uppercase tracking-widest text-xs mb-6">
                  Technical_Hurdle:
                </h4>
                <p className="text-muted leading-relaxed font-bold">{shown.challenge}</p>
              </div>
              <div>
                <h4 className="text-accent font-black uppercase tracking-widest text-xs mb-6">
                  Execution_Resolution:
                </h4>
                <p className="text-muted leading-relaxed font-bold">{shown.solution}</p>
              </div>
            </div>
            <div className="mt-20 pt-16 border-t-4 border-border">
              <PresetLink
                onClick={close}
                className="inline-block bg-accent text-black px-10 py-5 font-black uppercase tracking-widest text-sm brutalist-button"
              >
                INIT_CONSULTATION
              </PresetLink>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
