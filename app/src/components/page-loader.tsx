import { LogoMark } from "@/components/logo";

// Full-screen brand loader: the logo on ink with a ring spinning clockwise
// around it. Rendered by loading.tsx boundaries and the navigation loader.
export function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <svg viewBox="0 0 96 96" className="absolute inset-0 h-full w-full animate-spin [animation-duration:0.9s]">
          <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(247,244,238,0.12)" strokeWidth="4" />
          <circle
            cx="48"
            cy="48"
            r="44"
            fill="none"
            stroke="#F2A93B"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="70 207"
          />
        </svg>
        <LogoMark size={52} />
      </div>
    </div>
  );
}
