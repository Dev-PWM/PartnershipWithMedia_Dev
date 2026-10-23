import Link from "next/link";
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
          <Link href="/privacy" className={link}>Privacy_V1.0</Link>
          {billingPortalUrl && (
            <a href={billingPortalUrl} className={link}>Manage_Subscription</a>
          )}
        </div>
      </div>
    </footer>
  );
}
