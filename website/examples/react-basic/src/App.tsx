function Box({
  label,
  className,
  style,
}: {
  label: string;
  className: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`h-28 w-28 ${className}`} style={style} />
      <span className="text-xs text-zinc-400 text-center max-w-28">{label}</span>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 p-10 text-zinc-100">
      <h1 className="mb-2 text-2xl font-bold">tw-squircle Demo</h1>
      <p className="mb-8 text-zinc-400">
        Comparing regular rounded corners with squircle corners at
        different radii.
      </p>

      <div className="space-y-10">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-300">
            Small radius
          </h2>
          <div className="flex gap-6">
            <Box label="rounded-lg" className="rounded-lg bg-indigo-600" />
            <Box label="rounded-lg + corner-shape" className="rounded-lg bg-amber-600" style={{ cornerShape: "superellipse" } as React.CSSProperties} />
            <Box label="squircle-lg" className="squircle-lg bg-pink-600" />
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-300">
            Medium radius
          </h2>
          <div className="flex gap-6">
            <Box label="rounded-2xl" className="rounded-2xl bg-indigo-600" />
            <Box label="rounded-2xl + corner-shape" className="rounded-2xl bg-amber-600" style={{ cornerShape: "superellipse" } as React.CSSProperties} />
            <Box label="squircle-2xl" className="squircle-2xl bg-pink-600" />
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-300">
            Large radius
          </h2>
          <div className="flex gap-6">
            <Box label="rounded-3xl" className="rounded-3xl bg-indigo-600" />
            <Box label="rounded-3xl + corner-shape" className="rounded-3xl bg-amber-600" style={{ cornerShape: "superellipse" } as React.CSSProperties} />
            <Box label="squircle-3xl" className="squircle-3xl bg-pink-600" />
          </div>
        </section>
      </div>
    </div>
  );
}
