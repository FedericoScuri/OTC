/**
 * Íconos SVG inline (sin dependencias). Heredan tamaño y color del contexto;
 * pasales `className` para color/tamaño con Tailwind.
 */
type IconProps = { className?: string; size?: number };

function base(size = 16, className = "") {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
}

export function MapPinIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
export function StarIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)} fill="currentColor" stroke="none">
      <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18.9 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9L12 2.5Z" />
    </svg>
  );
}
export function HeartIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 6 4.5 4.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7 7-7Z" />
    </svg>
  );
}
export function SearchIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
export function CalendarIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
export function UsersIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </svg>
  );
}
export function CheckIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
export function WineIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M8 22h8M12 15v7" />
      <path d="M7 3h10l-1 6a4 4 0 0 1-8 0L7 3Z" />
    </svg>
  );
}
export function BuildingIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01M10 21v-3h4v3" />
    </svg>
  );
}
export function MountainIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="m3 20 6.5-11 4 6 2-3L21 20H3Z" />
    </svg>
  );
}
export function LandmarkIcon({ className, size }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M3 21h18M4 10h16M5 10l7-6 7 6M6 10v8M10 10v8M14 10v8M18 10v8" />
    </svg>
  );
}
