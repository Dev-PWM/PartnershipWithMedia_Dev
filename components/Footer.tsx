import Link from "next/link";
import { servicePages } from "@/lib/servicePages";
import { billingPortalUrl } from "@/lib/site";

const link = "text-muted hover:text-accent transition-colors text-xs font-black uppercase tracking-widest";

export default function Footer() {
  return (
    <footer className="bg-bgdark border-t-4 border-border py-16 font-brutalist">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">
        <p className="text-muted text-xs font-black uppercase tracking-widest text-center">
          &copy; {new Date().getFullYear()} PWM_DEV / LOS_ANGELES / ALL_RIGHTS_RESERVED
        </p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 md:gap-x-12">
          <Link href="/#work" className={link}>Project_Log</Link>
          <Link href="/#coffee" className={link}>Buy_Me_A_Coffee</Link>
          <Link href="/how-it-works" className={link}>How_It_Works</Link>
          <Link href="/agreement" className={link}>Agreement</Link>
          <Link href="/privacy" className={link}>Privacy_V1.0</Link>
          {billingPortalUrl && (
            <a href={billingPortalUrl} className={link}>Manage_Or_Cancel_Plan</a>
          )}
        </div>
      </div>
      <nav aria-label="Services" className="max-w-7xl mx-auto px-6 mt-10 flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-3">
        {servicePages.map((s) => (
          <Link key={s.slug} href={`/services/${s.slug}`} className="text-muted hover:text-accent transition-colors text-xs font-bold">
            {s.title}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
