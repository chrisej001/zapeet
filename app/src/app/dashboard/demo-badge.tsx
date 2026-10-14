/** Reminds a vendor in demo mode that nothing here is real money. */
export function DemoBadge() {
  return (
    <div className="mb-4 flex items-center justify-center gap-2 rounded-full bg-marigold/15 px-3 py-1.5 text-xs font-semibold text-marigold-ink">
      <span className="h-1.5 w-1.5 rounded-full bg-marigold" />
      Demo mode · no real money moves
    </div>
  );
}
