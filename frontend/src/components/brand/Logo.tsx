interface LogoProps {
  tone?: "dark" | "light";
  showTagline?: boolean;
  compact?: boolean;
}

export function Logo({
  tone = "dark",
  showTagline = false,
  compact = false,
}: LogoProps) {
  return (
    <span
      className={`brand brand--${tone}${compact ? " brand--compact" : ""}`}
    >
      <svg
        className="brand__mark"
        viewBox="0 0 64 64"
        aria-hidden="true"
        focusable="false"
      >
        <rect width="64" height="64" rx="14" fill="currentColor" />
        <path
          d="M18 43c0-13 8-22 22-24-1 15-9 23-22 24Z"
          fill="none"
          stroke="var(--ivory)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M22 46c4-10 10-16 18-20"
          fill="none"
          stroke="var(--ivory)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="44" cy="20" r="4" fill="var(--terracotta)" />
      </svg>
      <span className="brand__text">
        <span className="brand__name">
          Sahaaya<span aria-hidden="true">.</span>
        </span>
        {showTagline ? (
          <span className="brand__tagline">
            Healthcare, made understandable.
          </span>
        ) : null}
      </span>
    </span>
  );
}
