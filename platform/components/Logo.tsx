export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#ff715b" />
      <path
        d="M16 6.5c.9 4.9 3.6 7.6 8.5 8.5-4.9.9-7.6 3.6-8.5 8.5-.9-4.9-3.6-7.6-8.5-8.5 4.9-.9 7.6-3.6 8.5-8.5Z"
        fill="#fff"
      />
      <circle cx="24.5" cy="24.5" r="2" fill="#141414" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-xl font-bold tracking-tight ${className}`}>
      <LogoMark />
      GratiFi
    </span>
  );
}
