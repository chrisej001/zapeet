import { Brand } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mb-11 grid grid-cols-1 gap-9 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div className="flex max-w-[300px] flex-col gap-3">
            <Brand logoSize={30} />
            <p className="text-sm text-ink-60">insured checkout. automated delivery.</p>
          </div>

          <div>
            <h5 className="mb-4 text-xs font-bold tracking-[0.06em] text-ink uppercase">
              Product
            </h5>
            <ul className="flex flex-col gap-3">
              <li>
                <a href="#how-it-works" className="text-sm text-ink-60 hover:text-terracotta">
                  How it works
                </a>
              </li>
              <li>
                <a href="#who-its-for" className="text-sm text-ink-60 hover:text-terracotta">
                  Who it’s for
                </a>
              </li>
              <li>
                <a href="#trust" className="text-sm text-ink-60 hover:text-terracotta">
                  Why vendors trust us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="mb-4 text-xs font-bold tracking-[0.06em] text-ink uppercase">
              Company
            </h5>
            <ul className="flex flex-col gap-3">
              <li className="text-sm text-ink-60">[YOUR CONTACT EMAIL]</li>
              <li className="text-sm text-ink-60">[YOUR PHONE NUMBER]</li>
              <li className="text-sm text-ink-60">[YOUR COMPANY ADDRESS]</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-ink/10 pt-6 text-sm text-ink-60">
          <span>© 2026 Zapeet. All rights reserved.</span>
          <span>Insurance and delivery infrastructure provided by licensed partners.</span>
        </div>
      </div>
    </footer>
  );
}
