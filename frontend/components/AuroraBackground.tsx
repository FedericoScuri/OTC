/**
 * Fondo decorativo: blobs de color borrosos y translúcidos que flotan despacio,
 * más una grilla muy sutil. Va detrás de todo (-z-10) y no captura clicks.
 */
export function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Blobs aurora */}
      <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-teal-300/30 blur-3xl animate-float-slow" />
      <div className="absolute right-[-10rem] top-10 h-[26rem] w-[26rem] rounded-full bg-cyan-300/25 blur-3xl animate-float" />
      <div
        className="absolute bottom-[-12rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-emerald-300/20 blur-3xl animate-float-slow"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute right-1/4 bottom-0 h-[22rem] w-[22rem] rounded-full bg-sky-200/30 blur-3xl animate-float"
        style={{ animationDelay: "1.2s" }}
      />

      {/* Grilla muy tenue */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}
