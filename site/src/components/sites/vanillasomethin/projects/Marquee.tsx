/**
 * "OTHER PROJECT" ticker: the phrase repeated, alternating muted / white, scrolling left
 * forever (two identical halves, translate -50%). Respects reduced motion.
 */
export function Marquee({ text, copies = 8 }: { text: string; copies?: number }) {
  const items = Array.from({ length: copies }, (_, i) => i);
  const half = (hidden: boolean) => (
    <div className="flex shrink-0 gap-5 pr-5" aria-hidden={hidden || undefined}>
      {items.map((i) => (
        <h2
          key={i}
          className={`font-grotesk text-[44px] leading-[1.3] font-bold tracking-[0.01em] whitespace-nowrap uppercase min-[810px]:text-[68px] min-[1200px]:text-[96px] ${
            i % 2 === 0 ? "text-vs-muted" : "text-vs-fg"
          }`}
        >
          {text}
        </h2>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden">
      <div className="vs-marquee flex w-max">
        {half(false)}
        {half(true)}
      </div>
    </div>
  );
}
