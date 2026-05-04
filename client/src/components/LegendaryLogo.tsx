interface LegendaryLogoProps {
  size?: number | string;
  className?: string;
  glow?: boolean;
  title?: string;
}

export function LegendaryLogo({
  size,
  className,
  glow = true,
  title = "Legendary RPG",
}: LegendaryLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title}
      data-testid="img-legendary-logo"
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="ll-light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="45%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#92400e" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="ll-glow" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>

      {glow && <circle cx="32" cy="30" r="28" fill="url(#ll-glow)" />}

      <path
        d="M22 22 A 10 10 0 0 1 42 22 V 56 H 22 Z"
        fill="url(#ll-light)"
      />

      <path
        d="M14 58 V 22 A 18 18 0 0 1 50 22 V 58 H 42 V 22 A 10 10 0 0 0 22 22 V 58 Z"
        fill="#d97706"
      />

      <rect x="11" y="56" width="42" height="3" rx="1" fill="#d97706" />

      <circle cx="32" cy="48" r="1.6" fill="#fef3c7" opacity="0.95" />
    </svg>
  );
}

export default LegendaryLogo;
