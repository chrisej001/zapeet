type IconProps = {
  className?: string;
};

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function LinkIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.9} className={className}>
      <path d="M9 12h6" />
      <path d="M13 6h3a4 4 0 0 1 0 8h-2" />
      <path d="M11 18H8a4 4 0 0 1 0-8h2" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.9} className={className}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4.5" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.9} className={className}>
      <path d="M4 11.5L12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-5.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V20h3a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.9} className={className}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

export function SendIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.9} className={className}>
      <path d="M4 12h13" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.9} className={className}>
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.9} className={className}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.7A10.6 10.6 0 0 1 12 5.5c6.5 0 10 6.5 10 6.5a15 15 0 0 1-3.4 4" />
      <path d="M6.5 7.4C4 9 2 12 2 12s3.5 6.5 10 6.5a9.9 9.9 0 0 0 3.4-.6" />
      <path d="M9.5 10a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

export function ArrowUpRightIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <path d="M7 17L17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

export function ArrowDownLeftIcon({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={2} className={className}>
      <path d="M17 7L7 17" />
      <path d="M15 17H7V9" />
    </svg>
  );
}
