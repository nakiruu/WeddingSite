/**
 * The 11px uppercase accent label, optionally over a 48px hairline. This
 * pattern appears six times across the two source artboards.
 *
 * The label uses `text-mulberry-strong` and the rule uses `bg-mulberry`:
 * the plain accent is 4.17:1 on the dark background, fine for a rule but
 * under AA for text this small.
 */
export function SectionEyebrow({
  children,
  align = "left",
  rule = false,
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "center";
  rule?: boolean;
  className?: string;
}) {
  return (
    <div className={align === "center" ? `text-center ${className}` : className}>
      <span className="block font-sans text-[11px] uppercase tracking-[0.15em] text-mulberry-strong">
        {children}
      </span>
      {rule && (
        <div
          className={`mt-6 h-px w-12 bg-mulberry ${align === "center" ? "mx-auto" : ""}`}
        />
      )}
    </div>
  );
}
