export function LogoMark({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" className={className}>
      <rect x="0.5" y="0.5" width="33" height="33" rx="9" fill="#1B1F3B" />
      <path d="M18.6 8.5L11.6 18.4H16.2L15 25.5L22.8 15H17.8L18.6 8.5Z" fill="#F2A93B" />
    </svg>
  );
}
