type LogoProps = {
  size?: number;
  className?: string;
};

export function LogoMark({ size = 34, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34 34"
      fill="none"
      className={className}
    >
      <rect x="0.5" y="0.5" width="33" height="33" rx="9" fill="#1B1F3B" />
      <path d="M18.6 8.5L11.6 18.4H16.2L15 25.5L22.8 15H17.8L18.6 8.5Z" fill="#F2A93B" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`text-xl font-bold tracking-tight text-ink ${className ?? ""}`}>
      zapeet
    </span>
  );
}

export function Brand({ logoSize = 34 }: { logoSize?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={logoSize} />
      <Wordmark />
    </div>
  );
}
