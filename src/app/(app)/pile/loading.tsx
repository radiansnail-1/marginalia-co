export default function PileLoading() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-mahogany to-mahogany-2 px-5 pt-10">
      <header className="flex items-center justify-between">
        <div
          className="font-display uppercase text-cream"
          style={{ fontSize: "16px", fontWeight: 500, letterSpacing: "3.5px" }}
        >
          Marginalia <i className="text-brass-bright">{"&"}</i> Co.
        </div>
        <div className="h-8 w-8 rounded-full bg-brass/10" />
      </header>

      <h1 className="mt-8 font-display text-brass-bright" style={{ fontSize: "32px", fontWeight: 500 }}>
        The Pile
      </h1>
      <div className="mt-2 h-3 w-44 bg-brass/10" />

      <ul className="mt-8 space-y-2">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center gap-3.5 bg-black/30 p-3.5 ring-1 ring-brass/10">
            <div className="h-[76px] w-[50px] shrink-0 bg-mahogany-3" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-3/4 bg-brass/10" />
              <div className="mt-2 h-3 w-1/2 bg-brass/10" />
            </div>
            <div className="h-8 w-16 border border-brass/30" />
          </li>
        ))}
      </ul>
    </div>
  );
}
