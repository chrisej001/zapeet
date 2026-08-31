export function FinalCta() {
  return (
    <section className="bg-ink py-16 text-center sm:py-24 lg:py-28">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-5 sm:px-8">
        <h2 className="text-3xl text-paper sm:text-5xl">Protected. Instant. Local.</h2>
        <p className="text-lg text-paper/70">
          Give your customers a payment link that pays you, insures them, and gets
          the rider moving — before they close the chat.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-6">
          <a
            href="#"
            className="rounded-[10px] bg-marigold px-7 py-4 text-base font-semibold text-ink hover:bg-marigold/90"
          >
            Generate your first link
          </a>
          <a href="#" className="text-sm font-semibold text-paper hover:text-marigold">
            Talk to our team →
          </a>
        </div>
      </div>
    </section>
  );
}
