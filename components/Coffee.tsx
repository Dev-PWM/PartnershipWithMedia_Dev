import Image from "next/image";
import { FaArrowUpRightFromSquare, FaMugHot } from "react-icons/fa6";
import { support } from "@/lib/content";

export default function Coffee() {
  return (
    <section id="coffee" aria-labelledby="coffee-heading" className="border-t-2 border-border bg-surface py-20 md:py-28 font-brutalist">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[minmax(0,1fr)_auto] gap-12 lg:gap-20 items-center">
        <div>
          <span className="text-accent font-black uppercase tracking-widest text-xs mb-6 block">
            Support_Signal / Optional
          </span>
          <h2 id="coffee-heading" className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] mb-8">
            Buy me
            <br />
            <span className="text-accent">a coffee.</span>
          </h2>
          <p className="text-lg text-muted leading-relaxed font-medium max-w-xl mb-8">
            If my work helped you, you can send a small thank-you through PayPal. No pressure — I appreciate you being here.
          </p>
          <a
            href={support.paypalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 bg-accent text-black px-8 py-4 text-sm sm:text-base font-black uppercase tracking-widest brutalist-button"
          >
            <FaMugHot aria-hidden="true" />
            Buy me a coffee
            <FaArrowUpRightFromSquare aria-hidden="true" className="text-xs" />
          </a>
          <p className="text-xs text-muted mt-5 font-bold uppercase tracking-wide">
            Opens PayPal in a new tab. You can also scan the code.
          </p>
        </div>
        <div className="border-4 border-accent bg-white p-5 sm:p-7 shadow-[12px_12px_0px_#111111] w-fit max-w-full mx-auto lg:mx-0">
          <Image
            src="/images/paypal-coffee-qr.png"
            alt="PayPal QR code to buy PWM_DEV a coffee"
            width={500}
            height={500}
            sizes="(min-width: 640px) 280px, 70vw"
            className="w-56 sm:w-70 max-w-full h-auto"
          />
          <p className="text-black text-center font-black uppercase tracking-widest text-xs mt-4">
            Scan with PayPal
          </p>
        </div>
      </div>
    </section>
  );
}
