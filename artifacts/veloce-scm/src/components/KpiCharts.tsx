export function arcPath(
  cx: number, cy: number, r: number, startDeg: number, endDeg: number,
): string {
  const rad = Math.PI / 180;
  const x1 = cx + r * Math.cos(startDeg * rad);
  const y1 = cy - r * Math.sin(startDeg * rad);
  const x2 = cx + r * Math.cos(endDeg * rad);
  const y2 = cy - r * Math.sin(endDeg * rad);
  const large = Math.abs(startDeg - endDeg) > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 0 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export interface GaugeBenchmark {
  value: number;
  color: string;
  label?: string;
}

export function SemiGauge({
  value, label, valueLabel, color, benchmarks,
}: {
  value: number; label: string; valueLabel: string; color: string;
  benchmarks?: GaugeBenchmark[];
}) {
  const cx = 70; const cy = 72; const r = 54;
  const fillDeg = 180 - Math.min(100, Math.max(0, value)) * 1.8;
  const pctToDeg = (pct: number) => 180 - Math.min(100, Math.max(0, pct)) * 1.8;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 140 82" className="w-full max-w-[180px]">
        <path d={arcPath(cx, cy, r, 180, 0)} fill="none" stroke="#e2e8f0" strokeWidth={12} strokeLinecap="round" />
        <path d={arcPath(cx, cy, r, 180, fillDeg)} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" />
        {benchmarks?.map((b, i) => {
          const deg = pctToDeg(b.value);
          const rad = (deg * Math.PI) / 180;
          const x1 = cx + (r - 8) * Math.cos(rad);
          const y1 = cy - (r - 8) * Math.sin(rad);
          const x2 = cx + (r + 4) * Math.cos(rad);
          const y2 = cy - (r + 4) * Math.sin(rad);
          return <line key={i} x1={x1.toFixed(2)} y1={y1.toFixed(2)} x2={x2.toFixed(2)} y2={y2.toFixed(2)} stroke={b.color} strokeWidth={2} strokeLinecap="round" />;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight="bold" fill={color}>{valueLabel}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={9} fill="#64748b">{label}</text>
      </svg>
    </div>
  );
}

export function wcColor(util: number): string {
  if (util > 100) return "#ef4444";
  if (util >= 85) return "#f59e0b";
  return "#22c55e";
}

export function slColor(sl: number): string {
  if (sl >= 95) return "#22c55e";
  if (sl >= 90) return "#f59e0b";
  return "#ef4444";
}

export function ceColor(pct: number): string {
  if (pct <= 5) return "#22c55e";
  if (pct <= 15) return "#f59e0b";
  return "#ef4444";
}

export const COST_BAR_COLORS: Record<string, string> = {
  "Capacity":     "#6366f1",
  "Holding":      "#14b8a6",
  "Changeovers":  "#f59e0b",
  "Stockouts":    "#ef4444",
  "Markdown":     "#f97316",
  "Scrap/Rework": "#fb7185",
  "Training":     "#a855f7",
  "Lean":         "#22c55e",
  "Cap. Impr.":   "#0ea5e9",
};

export const M3_COST_COLORS: Record<string, string> = {
  "Shipping":   "#8b5cf6",
  "DC Ops":     "#6366f1",
  "Holding":    "#14b8a6",
  "Transport":  "#3b82f6",
  "Stockouts":  "#ef4444",
  "Carbon Tax": "#22c55e",
  "Markdown":   "#f97316",
};
