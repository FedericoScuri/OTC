/**
 * Logo de OTC: un pin de destino (turismo) con el degradé de la marca
 * (violeta → coral) y un destello. Escalable; `size` controla el lado del badge.
 */
export function LogoMark({ size = 34 }: { size?: number }) {
  const id = "otc-logo-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed" />
          <stop offset="0.55" stopColor="#a855f7" />
          <stop offset="1" stopColor="#fb6f92" />
        </linearGradient>
      </defs>
      {/* Badge */}
      <rect width="40" height="40" rx="12" fill={`url(#${id})`} />
      {/* Brillo superior */}
      <rect width="40" height="20" rx="12" fill="white" opacity="0.12" />
      {/* Pin de destino */}
      <path
        d="M20 9.5a7.2 7.2 0 0 0-7.2 7.2c0 5.3 7.2 13.8 7.2 13.8s7.2-8.5 7.2-13.8A7.2 7.2 0 0 0 20 9.5z"
        fill="white"
      />
      {/* Hueco del pin (deja ver el degradé) */}
      <circle cx="20" cy="16.4" r="3" fill={`url(#${id})`} />
      {/* Destello */}
      <path
        d="M30 8.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"
        fill="white"
        opacity="0.9"
      />
    </svg>
  );
}
