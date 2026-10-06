"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FaBars, FaXmark } from "react-icons/fa6";

const links = [
  { href: "/#services", label: "Services" },
  { href: "/#about", label: "About" },
  { href: "/#work", label: "Work" },
];

const navLink = "text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors";
const contactButton =
  "bg-accent text-black px-6 py-2 font-black uppercase tracking-widest text-xs brutalist-button";

export default function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-bgdark border-b-2 border-border">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black tracking-tighter uppercase font-brutalist" onClick={close}>
          PWM<span className="text-accent">_</span>DEV
        </Link>
        <nav aria-label="Main" className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={navLink}>
              {l.label}
            </Link>
          ))}
          <Link href="/#contact" className={contactButton}>
            Contact
          </Link>
        </nav>
        <button
          type="button"
          className="md:hidden w-12 h-12 -mr-2 flex items-center justify-center text-2xl hover:text-accent"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <FaXmark /> : <FaBars />}
        </button>
      </div>
      <nav
        id="mobile-menu"
        aria-label="Mobile"
        hidden={!open}
        className="md:hidden border-t-2 border-border bg-bgdark px-6 pb-8 pt-4 font-brutalist"
      >
        <ul className="flex flex-col">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={close}
                className="block py-4 text-2xl font-black uppercase tracking-tighter border-b-2 border-border hover:text-accent"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/#contact" onClick={close} className={`${contactButton} mt-8 inline-block px-8 py-4 text-sm`}>
          Contact
        </Link>
      </nav>
    </header>
  );
}
