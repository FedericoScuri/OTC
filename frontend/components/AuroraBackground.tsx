/**
 * Fondo decorativo sutil: dos manchas de color tenues (violeta y coral) que
 * flotan despacio. Discreto, para no competir con las fichas blancas.
 */
export function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-violet-300/20 blur-3xl animate-float-slow" />
      <div
        className="absolute right-[-12rem] top-0 h-[26rem] w-[26rem] rounded-full bg-rose-300/15 blur-3xl animate-float"
        style={{ animationDelay: "1.5s" }}
      />
      <div
        className="absolute bottom-[-14rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-fuchsia-300/12 blur-3xl animate-float-slow"
        style={{ animationDelay: "3s" }}
      />
    </div>
  );
}
