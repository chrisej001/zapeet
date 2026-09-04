import { MotionLink } from "./motion-link";
import { Reveal } from "./reveal";

export function FinalCta() {
  return (
    <section className="bg-ink py-16 text-center sm:py-24 lg:py-28">
      <Reveal className="mx-auto flex max-w-xl flex-col items-center gap-5 px-5 sm:px-8">
        <h2 className="text-3xl text-paper sm:text-5xl">Protected. Instant. Local.</h2>
        <p className="text-lg text-paper/70">
          Give your customers a payment link that pays you, insures them, and gets
          the rider moving — before they close the chat.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-6">
          <MotionLink
            href="https://zapeet-app.vercel.app/auth?mode=signup"
            className="rounded-[10px] bg-marigold px-7 py-4 text-base font-semibold text-ink"
          >
            Generate your first link
          </MotionLink>
          <MotionLink
            href="#"
            lift={false}
            className="text-sm font-semibold text-paper"
          >
            Talk to our team →
          </MotionLink>
        </div>
      </Reveal>
    </section>
  );
}
