import { useState } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
} from "recharts";
import { ChevronDown, ChevronRight, TrendingUp } from "lucide-react";

interface HistoricalDataPoint {
  month: number;
  skuA: number;
  skuB: number;
}

interface DemandForecastChartProps {
  dataPoints: HistoricalDataPoint[];
  avgA: number;
  avgB: number;
  trendA: number;
  trendB: number;
  forecastA?: number;
  forecastB?: number;
  actualA?: number;
  actualB?: number;
}

interface ChartRow {
  year: number;
  histA: number | null;
  histB: number | null;
  fcstA: number | null;
  fcstB: number | null;
  actA: number | null;
  actB: number | null;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const row: ChartRow = payload[0]?.payload;
  if (!row) return null;

  const isYear31 = row.year === 31;
  const errA =
    row.actA != null && row.fcstA != null && row.fcstA > 0
      ? Math.abs(((row.fcstA - row.actA) / row.actA) * 100)
      : null;
  const errB =
    row.actB != null && row.fcstB != null && row.fcstB > 0
      ? Math.abs(((row.fcstB - row.actB) / row.actB) * 100)
      : null;

  return (
    <div className="bg-background border border-border rounded-xl p-3 shadow-xl text-xs min-w-[220px] space-y-2">
      <p className="font-bold text-sm text-foreground">
        {isYear31 ? "Year 31 — Forecast Year" : `Year ${label}`}
      </p>

      {row.histA != null && (
        <div className="space-y-0.5">
          <p className="text-muted-foreground font-medium">Historical</p>
          <p className="text-blue-600 dark:text-blue-400">
            SKU A (Trend Tee): <strong>{row.histA.toLocaleString()}</strong> units
          </p>
          <p className="text-emerald-600 dark:text-emerald-400">
            SKU B (Core Jogger): <strong>{row.histB?.toLocaleString() ?? "—"}</strong> units
          </p>
        </div>
      )}

      {isYear31 && row.fcstA != null && row.fcstA !== row.histA && (
        <div className="space-y-0.5 pt-1 border-t border-border">
          <p className="text-muted-foreground font-medium">Your Forecast</p>
          <p className="text-blue-500">
            SKU A: <strong>{row.fcstA.toLocaleString()}</strong> units
          </p>
          {row.fcstB != null && (
            <p className="text-emerald-500">
              SKU B: <strong>{row.fcstB.toLocaleString()}</strong> units
            </p>
          )}
        </div>
      )}

      {row.actA != null && (
        <div className="space-y-0.5 pt-1 border-t border-border">
          <p className="text-muted-foreground font-medium">Actual Demand</p>
          <p className={errA != null && errA <= 10 ? "text-green-600" : "text-red-600"}>
            SKU A: <strong>{row.actA.toLocaleString()}</strong> units
            {errA != null && (
              <span className="ml-1 text-[10px]">({errA.toFixed(1)}% error)</span>
            )}
          </p>
          {row.actB != null && (
            <p className={errB != null && errB <= 10 ? "text-green-600" : "text-red-600"}>
              SKU B: <strong>{row.actB.toLocaleString()}</strong> units
              {errB != null && (
                <span className="ml-1 text-[10px]">({errB.toFixed(1)}% error)</span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ActualDot(props: any) {
  const { cx, cy, payload, dataKey } = props;
  if (payload[dataKey] == null) return null;

  const forecastKey = dataKey === "actA" ? "fcstA" : "fcstB";
  const forecast = payload[forecastKey];
  const actual = payload[dataKey];
  const err =
    forecast != null && forecast > 0
      ? Math.abs(((forecast - actual) / actual) * 100)
      : null;

  const color =
    err == null ? "#6366f1" : err <= 10 ? "#22c55e" : err <= 20 ? "#f59e0b" : "#ef4444";

  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={4} fill={color} />
    </g>
  );
}

export function DemandForecastChart({
  dataPoints,
  avgA,
  avgB,
  trendA,
  trendB,
  forecastA,
  forecastB,
  actualA,
  actualB,
}: DemandForecastChartProps) {
  const [tableOpen, setTableOpen] = useState(false);

  const hasForecast = forecastA != null && forecastA > 0;
  const hasActual = actualA != null && actualA > 0;

  const chartData: ChartRow[] = dataPoints.map((d) => ({
    year: d.month,
    histA: d.skuA,
    histB: d.skuB,
    fcstA: null,
    fcstB: null,
    actA: null,
    actB: null,
  }));

  if (hasForecast) {
    chartData[29] = {
      ...chartData[29],
      fcstA: chartData[29].histA,
      fcstB: chartData[29].histB,
    };
    chartData.push({
      year: 31,
      histA: null,
      histB: null,
      fcstA: forecastA,
      fcstB: forecastB ?? null,
      actA: hasActual ? actualA : null,
      actB: hasActual && actualB != null ? actualB : null,
    });
  } else if (hasActual) {
    chartData.push({
      year: 31,
      histA: null,
      histB: null,
      fcstA: null,
      fcstB: null,
      actA: actualA,
      actB: actualB ?? null,
    });
  }

  const ticks = [1, 5, 10, 15, 20, 25, 30, ...(hasForecast || hasActual ? [31] : [])];

  const allVals = dataPoints
    .flatMap((d) => [d.skuA, d.skuB])
    .concat(hasForecast ? [forecastA, forecastB ?? 0] : [])
    .concat(hasActual ? [actualA, actualB ?? 0] : [])
    .filter(Boolean) as number[];
  const yMin = Math.floor(Math.min(...allVals) / 500) * 500 - 500;
  const yMax = Math.ceil(Math.max(...allVals) / 500) * 500 + 500;

  const errA =
    hasActual && hasForecast && forecastA > 0
      ? Math.abs(((forecastA - actualA) / actualA) * 100)
      : null;
  const errB =
    hasActual && hasForecast && forecastB != null && forecastB > 0 && actualB != null
      ? Math.abs(((forecastB - actualB) / actualB) * 100)
      : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">SKU A Average</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{avgA.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3" /> +{trendA}/year trend
          </p>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">SKU B Average</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{avgB.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Trend: {trendB >= 0 ? "+" : ""}{trendB}/year (flat/stable)
          </p>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 24, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis
              dataKey="year"
              type="number"
              domain={[1, hasForecast || hasActual ? 32 : 31]}
              ticks={ticks}
              tickFormatter={(v) => `Y${v}`}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
              label={{
                value: "Year",
                position: "insideBottom",
                offset: -2,
                style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
              tickFormatter={(v) => v.toLocaleString()}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={32}
              wrapperStyle={{ fontSize: 12 }}
            />

            {hasForecast || hasActual ? (
              <ReferenceLine
                x={30.5}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 3"
                strokeOpacity={0.5}
                label={{
                  value: "Forecast →",
                  position: "insideTopRight",
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />
            ) : null}

            <Line
              name="SKU A — Trend Tee (Historical)"
              type="monotone"
              dataKey="histA"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
            <Line
              name="SKU B — Core Jogger (Historical)"
              type="monotone"
              dataKey="histB"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />

            {hasForecast && (
              <>
                <Line
                  name="SKU A Forecast"
                  type="monotone"
                  dataKey="fcstA"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                  legendType="none"
                />
                <Line
                  name="SKU B Forecast"
                  type="monotone"
                  dataKey="fcstB"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                  legendType="none"
                />
              </>
            )}

            {hasActual && (
              <>
                <Line
                  name="SKU A Actual"
                  type="monotone"
                  dataKey="actA"
                  stroke={errA != null && errA <= 10 ? "#22c55e" : "#ef4444"}
                  strokeWidth={0}
                  dot={(props: any) => <ActualDot {...props} dataKey="actA" />}
                  activeDot={false}
                  connectNulls={false}
                  legendType="none"
                />
                <Line
                  name="SKU B Actual"
                  type="monotone"
                  dataKey="actB"
                  stroke={errB != null && errB <= 10 ? "#22c55e" : "#ef4444"}
                  strokeWidth={0}
                  dot={(props: any) => <ActualDot {...props} dataKey="actB" />}
                  activeDot={false}
                  connectNulls={false}
                  legendType="none"
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {hasActual && (
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              sku: "SKU A",
              forecast: forecastA,
              actual: actualA,
              err: errA,
              color: "blue",
            },
            {
              sku: "SKU B",
              forecast: forecastB,
              actual: actualB,
              err: errB,
              color: "emerald",
            },
          ].map(({ sku, forecast, actual, err }) => {
            if (actual == null) return null;
            const good = err != null && err <= 10;
            return (
              <div
                key={sku}
                className={`rounded-xl border p-3 text-xs space-y-1 ${
                  good
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-red-500/5 border-red-500/20"
                }`}
              >
                <p className="font-semibold text-sm">{sku} Reveal</p>
                {forecast != null && (
                  <p className="text-muted-foreground">
                    Forecast: <strong>{forecast.toLocaleString()}</strong>
                  </p>
                )}
                <p className="text-muted-foreground">
                  Actual: <strong>{actual.toLocaleString()}</strong>
                </p>
                {err != null && (
                  <p className={good ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                    {good ? "✓" : "✗"} {err.toFixed(1)}% error
                    {good ? " — on target!" : err <= 20 ? " — close" : " — off target"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!hasForecast && !hasActual && (
        <p className="text-xs text-muted-foreground text-center py-1">
          Enter your Year 31 forecast below — it will appear on the chart as a dashed projection
        </p>
      )}
      {hasForecast && !hasActual && (
        <p className="text-xs text-muted-foreground text-center py-1">
          Your forecast is plotted as a dashed line. Run a simulation to reveal actual Year 31 demand.
        </p>
      )}

      <div className="border border-border/50 rounded-lg overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium text-muted-foreground"
          onClick={() => setTableOpen((v) => !v)}
        >
          <span>View raw data table (30 years)</span>
          {tableOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        {tableOpen && (
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background z-10">
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Year</th>
                  <th className="text-right p-2 text-blue-600 dark:text-blue-400 font-medium">
                    SKU A (Trend Tee)
                  </th>
                  <th className="text-right p-2 text-emerald-600 dark:text-emerald-400 font-medium">
                    SKU B (Core Jogger)
                  </th>
                </tr>
              </thead>
              <tbody>
                {dataPoints.map((d) => (
                  <tr key={d.month} className="border-b border-border/40 hover:bg-muted/30">
                    <td className="p-2 font-medium">Year {d.month}</td>
                    <td className="p-2 text-right tabular-nums">{d.skuA.toLocaleString()}</td>
                    <td className="p-2 text-right tabular-nums">{d.skuB.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
