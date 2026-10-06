const navLink = "text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-bgdark border-b-2 border-border">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <a href="#" className="text-2xl font-black tracking-tighter uppercase font-brutalist">
          PWM<span className="text-accent">_</span>DEV
        </a>
        <nav className="hidden md:flex items-center gap-10">
          <a href="#services" className={navLink}>Services</a>
          <a href="#about" className={navLink}>About</a>
          <a href="#work" className={navLink}>Work</a>
          <a
            href="#contact"
            className="bg-accent text-black px-6 py-2 font-black uppercase tracking-widest text-xs brutalist-button"
          >
            Contact
          </a>
        </nav>
        <a
          href="#contact"
          className="md:hidden bg-accent text-black px-4 py-2 font-black uppercase tracking-widest text-xs brutalist-button"
        >
          Contact
        </a>
      </div>
    </header>
  );
}
