const link = "text-muted hover:text-accent transition-colors text-xs font-black uppercase tracking-widest";

export default function Footer() {
  return (
    <footer className="bg-bgdark border-t-4 border-border py-16 font-brutalist">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">
        <p className="text-muted text-xs font-black uppercase tracking-widest">
          &copy; {new Date().getFullYear()} PWM_DEV / ALL_RIGHTS_RESERVED
        </p>
        <div className="flex gap-12">
          <a href="#" className={link}>Privacy_V1.0</a>
          <a href="#" className={link}>Terms_of_Use</a>
        </div>
      </div>
    </footer>
  );
}
