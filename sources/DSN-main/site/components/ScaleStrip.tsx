// Light, mid and dark steps of a scale in a Select's 16px icon slot.
export function ScaleStrip({ scale }: { scale: Record<string, string> }) {
  const [l, m, d] = [scale['300'], scale['600'], scale['900']];
  return (
    <span
      className="theme-preset-strip"
      style={{ background: `linear-gradient(90deg, ${l} 0 33%, ${m} 33% 67%, ${d} 67%)` }}
    />
  );
}
