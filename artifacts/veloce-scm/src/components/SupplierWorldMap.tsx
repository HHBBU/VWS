import { useState, useRef, useMemo, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";

// ─── Map geometry ─────────────────────────────────────────────────────────────

const MAP_W = 900;
const MAP_H = 400;

function project(lon: number, lat: number): [number, number] {
  return [
    (lon + 180) / 360 * MAP_W,
    (90 - lat) / 180 * MAP_H,
  ];
}

// Country center coordinates [lon, lat]
const COUNTRY_CENTER: Record<string, [number, number]> = {
  Portugal: [-8.2, 39.4],
  Turkey:   [35.2, 38.9],
  Vietnam:  [108.2, 14.1],
  Mexico:   [-102.6, 23.6],
};

// Subtle pin offsets so co-located suppliers don't overlap
const PIN_OFFSET: Record<string, [number, number]> = {
  PT1: [-11, 0], PT2: [11, 0],
  TR1: [-11, 0], TR2: [11, 0],
  VN1: [-11, 0], VN2: [11, 0],
  MX1: [-11, 0], MX2: [11, 0],
};

// VeloceWear HQ — Porto (placed slightly north to visually separate from Portugal pins)
const HQ: [number, number] = project(-8.6, 42.2);

// ─── Transport style registry ─────────────────────────────────────────────────

const TRANSPORT_STYLE: Record<string, {
  label: string; costPerKg: string; co2: string;
  color: string; dasharray?: string; strokeWidth: number;
}> = {
  truck: { label: "Truck",  costPerKg: "€0.18/kg", co2: "62 g CO₂/ton·km", color: "#22c55e", dasharray: "8 5",  strokeWidth: 2   },
  rail:  { label: "Rail",   costPerKg: "€0.12/kg", co2: "22 g CO₂/ton·km", color: "#60a5fa", dasharray: "4 4",  strokeWidth: 2   },
  ocean: { label: "Ocean",  costPerKg: "€0.08/kg", co2: "8 g CO₂/ton·km",  color: "#818cf8",                    strokeWidth: 2.5 },
  air:   { label: "Air",    costPerKg: "€0.95/kg", co2: "500 g CO₂/ton·km", color: "#fbbf24", dasharray: "3 3",  strokeWidth: 1.5 },
};

// Geographically-tuned bezier control points [lon, lat] per country + mode.
// These route arcs over the correct oceans / land corridors.
const ROUTE_CTRL: Record<string, Record<string, [number, number]>> = {
  Portugal: {
    truck: [-5, 40], rail: [-5, 40], ocean: [-5, 38], air: [-5, 41],
  },
  Turkey: {
    truck: [12, 43], rail: [10, 43], ocean: [10, 37], air: [20, 48],
  },
  Vietnam: {
    ocean: [62, 23],  // Red Sea / Indian Ocean corridor
    air:   [88, 43],  // over Central Asia
    truck: [60, 25],  rail: [60, 25],
  },
  Mexico: {
    ocean: [-45, 8],  // South Atlantic
    air:   [-52, 32], // North Atlantic
    truck: [-75, 25], rail: [-75, 25],
  },
};

// Build SVG quadratic Bézier: supplier pin → control pt → HQ
function buildArc(sx: number, sy: number, qx: number, qy: number): string {
  const [ex, ey] = HQ;
  return `M${sx.toFixed(1)},${sy.toFixed(1)} Q${qx.toFixed(1)},${qy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`;
}

// ─── Continent & country polygon data ─────────────────────────────────────────

// Simplified continent outlines [[lon,lat], ...]
const CONTINENTS: [number, number][][] = [
  // North America
  [[-168,72],[-130,72],[-100,68],[-78,50],[-65,47],[-60,22],[-85,15],[-95,17],[-117,32],[-120,38],[-120,49],[-140,58],[-168,72]],
  // Greenland
  [[-70,84],[-10,84],[-10,70],[-40,60],[-70,70]],
  // South America
  [[-80,12],[-60,8],[-34,-4],[-40,-56],[-65,-56],[-73,-17],[-80,0],[-80,12]],
  // Europe + Africa (single contiguous polygon)
  [[-10,72],[28,72],[35,62],[32,56],[28,44],[36,37],[53,37],[50,12],[44,-12],[34,-35],[18,-35],[8,-18],[10,5],[-17,14],[-16,38],[-8,37],[-8,44],[-2,52],[5,53],[15,54],[28,58],[28,70],[10,72],[-10,72]],
  // Asia (simplified)
  [[28,72],[60,72],[100,72],[140,72],[180,66],[180,30],[148,-10],[120,-12],[106,-8],[100,2],[104,10],[108,18],[120,27],[130,38],[148,48],[130,52],[100,56],[82,62],[74,70],[60,72],[28,72]],
  // Australia
  [[114,-22],[153,-25],[150,-40],[145,-38],[136,-35],[130,-15],[114,-22]],
  // Japan
  [[129,31],[133,35],[141,41],[141,40],[140,38],[135,34],[130,34]],
  // UK
  [[-5,50],[0,51],[2,52],[0,56],[-4,58],[-6,56],[-5,50]],
];

// Highlighted overlay polygons for each supplier country
const COUNTRY_HIGHLIGHTS: Record<string, { poly: [number, number][]; region: "nearshore" | "offshore" }> = {
  Portugal: { region: "nearshore", poly: [[-9.5,42.2],[-6.2,42.2],[-6.2,36.9],[-9.5,36.9]] },
  Turkey:   { region: "nearshore", poly: [[26,42],[44,42],[44,36],[36,36],[32,36],[26,38]] },
  Vietnam:  { region: "offshore",  poly: [[103,23],[108,23],[109,10],[107,8],[105,9],[103,11]] },
  Mexico:   { region: "offshore",  poly: [[-117,33],[-86,33],[-86,14],[-95,14],[-117,30]] },
};

function polyPath(pts: [number, number][]): string {
  const pp = pts.map(([lon, lat]) => project(lon, lat));
  return pp.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(0)},${y.toFixed(0)}`).join(" ") + " Z";
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupplierInfo {
  id: string; name: string; country: string;
  cottonPrice: number; nylonPrice: number;
  leadTime: number; reliability: number;
  sustainability: number; quality: number;
  region: string;
}

interface AllocRow {
  id: string; supplierId: string; transportMode: string;
  materialType: string; kg: string;
}

interface TooltipState { x: number; y: number; content: React.ReactNode }

interface SupplierWorldMapProps {
  suppliers: SupplierInfo[];
  allocations: AllocRow[];
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SupplierWorldMap({ suppliers, allocations, className }: SupplierWorldMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isStrategyRedrawPending, setIsStrategyRedrawPending] = useState(false);
  const [strategyRedrawRouteKeys, setStrategyRedrawRouteKeys] = useState<Set<string> | null>(null);

  // Track a generation counter per route key so that when a route becomes
  // newly active we can change its React key, forcing a remount that restarts
  // the CSS draw animation.
  const routeGenerations = useRef<Map<string, number>>(new Map());
  const prevActiveKeys = useRef<Set<string>>(new Set());
  const prevAllocationSnapshots = useRef<Map<string, string>>(new Map());
  const hasSeenAllocationSnapshot = useRef(false);

  // Routes that were recently removed and are fading out.
  const [exitingRoutes, setExitingRoutes] = useState<
    Map<string, { supplierId: string; transportMode: string }>
  >(new Map());

  const activeRoutes = useMemo(() => {
    const seen = new Set<string>();
    const out: { supplierId: string; transportMode: string }[] = [];
    for (const a of allocations) {
      if (!a.supplierId) continue;
      const k = `${a.supplierId}:${a.transportMode}`;
      if (!seen.has(k)) { seen.add(k); out.push({ supplierId: a.supplierId, transportMode: a.transportMode }); }
    }
    return out;
  }, [allocations]);

  // Compute the current set of active route keys.
  const activeRouteKeys = useMemo(
    () => new Set(activeRoutes.map((r) => `${r.supplierId}:${r.transportMode}`)),
    [activeRoutes],
  );

  // A preset swaps multiple allocation rows in one state update. Keep a
  // row-level snapshot so it remains distinct from the ordinary one-row
  // supplier or transport edits handled below.
  const allocationSnapshots = useMemo(
    () => new Map(allocations.map((a) => [
      a.id,
      [a.supplierId, a.transportMode, a.materialType, a.kg].join(":"),
    ])),
    [allocations],
  );

  // On each allocation update, bump generations for new routes and fade out
  // removed routes. When several allocation rows change together (a strategy
  // preset), clear every route first, then remount all active paths so even
  // unchanged routes replay the existing 1.1 s draw animation.
  useLayoutEffect(() => {
    const prev = prevActiveKeys.current;
    const prevSnapshots = prevAllocationSnapshots.current;
    let changedAllocationRows = 0;

    for (const [id, snapshot] of allocationSnapshots) {
      if (prevSnapshots.get(id) !== snapshot) changedAllocationRows += 1;
    }
    for (const id of prevSnapshots.keys()) {
      if (!allocationSnapshots.has(id)) changedAllocationRows += 1;
    }

    const isStrategySwitch =
      hasSeenAllocationSnapshot.current &&
      changedAllocationRows >= 2 &&
      (prev.size > 0 || activeRouteKeys.size > 0);

    prevActiveKeys.current = new Set(activeRouteKeys);
    prevAllocationSnapshots.current = new Map(allocationSnapshots);
    hasSeenAllocationSnapshot.current = true;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let staggerCleanupTimer: ReturnType<typeof setTimeout> | undefined;

    if (isStrategySwitch) {
      // Hide all active and exiting paths before replaying the routes. This
      // ensures shared routes feel new after a strategy switch as well.
      setExitingRoutes(new Map());
      for (const routeKey of activeRouteKeys) {
        routeGenerations.current.set(
          routeKey,
          (routeGenerations.current.get(routeKey) ?? 0) + 1,
        );
      }
      setIsStrategyRedrawPending(true);
      setStrategyRedrawRouteKeys(null);
      timer = setTimeout(() => {
        setStrategyRedrawRouteKeys(new Set(activeRouteKeys));
        setIsStrategyRedrawPending(false);
        staggerCleanupTimer = setTimeout(
          () => setStrategyRedrawRouteKeys(null),
          1100 + activeRoutes.length * 120,
        );
      }, 150);

      return () => {
        if (timer !== undefined) clearTimeout(timer);
        if (staggerCleanupTimer !== undefined) clearTimeout(staggerCleanupTimer);
      };
    }

    setIsStrategyRedrawPending(false);
    setStrategyRedrawRouteKeys(null);

    // New routes that weren't active before → bump their generation so the key
    // changes and React unmounts/remounts the path (restarting the animation).
    for (const k of activeRouteKeys) {
      if (!prev.has(k)) {
        routeGenerations.current.set(k, (routeGenerations.current.get(k) ?? 0) + 1);
      }
    }

    // Routes that just disappeared → add to exitingRoutes and schedule removal.
    const newlyExiting: { key: string; supplierId: string; transportMode: string }[] = [];
    for (const k of prev) {
      if (!activeRouteKeys.has(k)) {
        const [supplierId, transportMode] = k.split(":");
        newlyExiting.push({ key: k, supplierId, transportMode });
      }
    }

    if (newlyExiting.length > 0) {
      setExitingRoutes((old) => {
        const next = new Map(old);
        for (const { key, supplierId, transportMode } of newlyExiting) {
          next.set(key, { supplierId, transportMode });
        }
        return next;
      });

      // Fade duration is 400 ms — remove from exiting state after that.
      timer = setTimeout(() => {
        setExitingRoutes((old) => {
          const next = new Map(old);
          for (const { key } of newlyExiting) next.delete(key);
          return next;
        });
      }, 420);
    }

    return () => { if (timer !== undefined) clearTimeout(timer); };
  }, [activeRouteKeys, allocationSnapshots]);

  const activeIds = useMemo(
    () => new Set(allocations.map((a) => a.supplierId).filter(Boolean)),
    [allocations],
  );

  function svgCoords(e: React.MouseEvent<SVGElement>): { x: number; y: number } {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return {
      x: ((e.clientX - r.left) / r.width) * MAP_W,
      y: ((e.clientY - r.top) / r.height) * MAP_H,
    };
  }

  return (
    <div
      data-testid="supplier-world-map"
      className={cn("relative select-none", className)}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="w-full rounded-xl border border-border/30"
        style={{ maxHeight: 340, background: "linear-gradient(180deg,#0a1628 0%,#0d2040 100%)" }}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <style>{`
            @keyframes routeDraw{from{stroke-dashoffset:1000}to{stroke-dashoffset:0}}
            @keyframes routePulse{0%,100%{opacity:.75}50%{opacity:1}}
            @keyframes routeFadeOut{from{opacity:1}to{opacity:0}}
            @keyframes routeVisualIn{from{visibility:hidden}to{visibility:visible}}
            .rd{animation:routeDraw 1.1s ease-out forwards}
            .rp{animation:routeDraw 1.1s ease-out forwards,routePulse 2.4s ease-in-out 1.1s infinite}
            @keyframes pinRing{0%,100%{r:5;opacity:.5}50%{r:9;opacity:0}}
            .pr{animation:pinRing 2s ease-out infinite}
          `}</style>
        </defs>

        {/* Ocean label faint text */}
        {([
          ["PACIFIC OCEAN",   -148, 18],
          ["ATLANTIC OCEAN",  -35,  14],
          ["INDIAN OCEAN",     72, -16],
        ] as [string, number, number][]).map(([label, lon, lat]) => {
          const [x, y] = project(lon, lat);
          return <text key={label} x={x} y={y} textAnchor="middle" fontSize={8} fill="#1e3a60" letterSpacing={2} fontWeight="600">{label}</text>;
        })}

        {/* Equator line */}
        {(() => { const [, y] = project(0, 0); return <line x1={0} y1={y} x2={MAP_W} y2={y} stroke="#1a3050" strokeWidth={0.6} strokeDasharray="6 4" />; })()}

        {/* Continent landmasses */}
        {CONTINENTS.map((poly, i) => (
          <path key={i} d={polyPath(poly)} fill="#1a2e4a" stroke="#243d5c" strokeWidth={0.7} />
        ))}

        {/* Country highlight overlays */}
        {Object.entries(COUNTRY_HIGHLIGHTS).map(([country, { poly, region }]) => {
          const isNear = region === "nearshore";
          return (
            <path
              key={country}
              d={polyPath(poly)}
              fill={isNear ? "#1d3d8a" : "#7a3500"}
              fillOpacity={0.4}
              stroke={isNear ? "#3b82f6" : "#f59e0b"}
              strokeWidth={0.9}
              strokeOpacity={0.7}
            />
          );
        })}

        {/* ── Active trade route arcs ── */}
        {!isStrategyRedrawPending && activeRoutes.map(({ supplierId, transportMode }, routeIndex) => {
          const sup = suppliers.find((s) => s.id === supplierId);
          if (!sup) return null;
          const style = TRANSPORT_STYLE[transportMode] ?? TRANSPORT_STYLE.truck;
          const [clon, clat] = COUNTRY_CENTER[sup.country] ?? [0, 0];
          const [bx, by] = project(clon, clat);
          const [ox, oy] = PIN_OFFSET[supplierId] ?? [0, 0];
          const sx = bx + ox, sy = by + oy;
          const ctrlLL = ROUTE_CTRL[sup.country]?.[transportMode] ?? [0, 30];
          const [qx, qy] = project(...ctrlLL as [number, number]);
          const d = buildArc(sx, sy, qx, qy);
          const routeKey = `${supplierId}:${transportMode}`;
          // Include generation in the React key so that when a route becomes
          // newly active, React unmounts/remounts the element and the CSS
          // draw animation restarts from scratch.
          const gen = routeGenerations.current.get(routeKey) ?? 0;
          const drawDelay = strategyRedrawRouteKeys?.has(routeKey) ? routeIndex * 120 : null;
          const routeAnimationStyle = drawDelay === null
            ? undefined
            : {
                animation: `routeDraw 1.1s ease-out ${drawDelay}ms both, routePulse 2.4s ease-in-out ${drawDelay + 1100}ms infinite`,
              };
          const routeVisualStyle = drawDelay === null
            ? undefined
            : { animation: `routeVisualIn 1ms linear ${drawDelay}ms both` };
          return (
            <g
              key={`${routeKey}:${gen}`}
              data-testid="supplier-route"
              data-route-key={routeKey}
              data-supplier-id={supplierId}
              data-transport-mode={transportMode}
            >
              {/* Soft glow */}
              <path
                d={d}
                fill="none"
                stroke={style.color}
                strokeWidth={style.strokeWidth + 4}
                strokeOpacity={0.1}
                style={routeVisualStyle}
              />
              {/* Route line */}
              <path
                className="rp"
                d={d}
                fill="none"
                stroke={style.color}
                strokeWidth={style.strokeWidth}
                strokeDasharray={style.dasharray ?? undefined}
                strokeLinecap="round"
                pathLength={1000}
                style={routeAnimationStyle}
                onMouseEnter={(e) => {
                  const { x, y } = svgCoords(e);
                  setTooltip({
                    x, y,
                    content: (
                      <div>
                        <p className="font-bold text-sm mb-0.5">{sup.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">{sup.country} → Porto (VeloceWear HQ)</p>
                        <div className="space-y-0.5 text-xs">
                          <p><span className="text-muted-foreground">Mode:</span> <strong>{style.label}</strong></p>
                          <p><span className="text-muted-foreground">Transport cost:</span> <strong>{style.costPerKg}</strong></p>
                          <p><span className="text-muted-foreground">CO₂ intensity:</span> <strong>{style.co2}</strong></p>
                          <p><span className="text-muted-foreground">Lead time:</span> <strong>{sup.leadTime} days</strong></p>
                          <p><span className="text-muted-foreground">Reliability:</span> <strong>{sup.reliability}%</strong></p>
                        </div>
                      </div>
                    ),
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
              {/* HQ arrival dot */}
              <circle
                cx={HQ[0]}
                cy={HQ[1]}
                r={3}
                fill={style.color}
                opacity={0.85}
                style={{ pointerEvents: "none", ...routeVisualStyle }}
              />
            </g>
          );
        })}

        {/* ── Fading-out route arcs (recently removed) ── */}
        {Array.from(exitingRoutes.entries()).map(([routeKey, { supplierId, transportMode }]) => {
          const sup = suppliers.find((s) => s.id === supplierId);
          if (!sup) return null;
          const style = TRANSPORT_STYLE[transportMode] ?? TRANSPORT_STYLE.truck;
          const [clon, clat] = COUNTRY_CENTER[sup.country] ?? [0, 0];
          const [bx, by] = project(clon, clat);
          const [ox, oy] = PIN_OFFSET[supplierId] ?? [0, 0];
          const sx = bx + ox, sy = by + oy;
          const ctrlLL = ROUTE_CTRL[sup.country]?.[transportMode] ?? [0, 30];
          const [qx, qy] = project(...ctrlLL as [number, number]);
          const d = buildArc(sx, sy, qx, qy);
          return (
            <g key={`exiting:${routeKey}`} style={{ animation: "routeFadeOut 0.4s ease-out forwards" }}>
              <path d={d} fill="none" stroke={style.color} strokeWidth={style.strokeWidth + 4} strokeOpacity={0.1} />
              <path
                d={d}
                fill="none"
                stroke={style.color}
                strokeWidth={style.strokeWidth}
                strokeDasharray={style.dasharray ?? undefined}
                strokeLinecap="round"
                style={{ pointerEvents: "none" }}
              />
            </g>
          );
        })}

        {/* ── Supplier pins ── */}
        {suppliers.map((s) => {
          const [clon, clat] = COUNTRY_CENTER[s.country] ?? [0, 0];
          const [bx, by] = project(clon, clat);
          const [ox, oy] = PIN_OFFSET[s.id] ?? [0, 0];
          const x = bx + ox, y = by + oy;
          const active = activeIds.has(s.id);
          const near = s.region === "nearshore";
          const color = near ? "#3b82f6" : "#f59e0b";
          return (
            <g
              key={s.id}
              style={{ cursor: "pointer" }}
              onMouseEnter={(e) => {
                setTooltip({
                  x, y,
                  content: (
                    <div>
                      <p className="font-bold text-sm mb-0.5">{s.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {s.country} — <span style={{ color }}>{near ? "Nearshore" : "Offshore"}</span>
                      </p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                        <span className="text-muted-foreground">Cotton</span><span className="font-medium">€{s.cottonPrice}/kg</span>
                        <span className="text-muted-foreground">Nylon</span><span className="font-medium">€{s.nylonPrice}/kg</span>
                        <span className="text-muted-foreground">Lead time</span><span className="font-medium">{s.leadTime} days</span>
                        <span className="text-muted-foreground">Reliability</span><span className="font-medium">{s.reliability}%</span>
                        <span className="text-muted-foreground">Quality</span><span className="font-medium">{s.quality}/5</span>
                        <span className="text-muted-foreground">Sustainability</span><span className="font-medium">{s.sustainability}/5</span>
                      </div>
                    </div>
                  ),
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              {active && <circle className="pr" cx={x} cy={y} r={5} fill={color} />}
              <circle
                cx={x} cy={y}
                r={active ? 5.5 : 3.5}
                fill={active ? color : "#111e30"}
                stroke={color}
                strokeWidth={active ? 2 : 1.2}
                fillOpacity={active ? 0.92 : 0.55}
              />
              <text x={x} y={y - 8} textAnchor="middle" fontSize={6.5} fill={active ? color : "#4a6080"} fontWeight={active ? "700" : "400"}>
                {s.id}
              </text>
            </g>
          );
        })}

        {/* ── VeloceWear HQ pin ── */}
        <g style={{ pointerEvents: "none" }}>
          <circle cx={HQ[0]} cy={HQ[1]} r={10} fill="none" stroke="#f43f5e" strokeWidth={1.2} strokeOpacity={0.45} />
          <circle cx={HQ[0]} cy={HQ[1]} r={6}  fill="#f43f5e" fillOpacity={0.92} stroke="#fff" strokeWidth={1.5} />
          <text x={HQ[0]} y={HQ[1] - 14} textAnchor="middle" fontSize={7.5} fill="#f43f5e" fontWeight="700" letterSpacing={0.4}>
            VeloceWear HQ
          </text>
          <text x={HQ[0]} y={HQ[1] + 4} textAnchor="middle" fontSize={6.5} fill="#fff" fontWeight="700">HQ</text>
        </g>

        {/* ── Legend ── */}
        <g transform="translate(12,270)">
          <rect x={-3} y={-12} width={152} height={120} rx={5} fill="#060e1d" fillOpacity={0.88} stroke="#1e3050" strokeWidth={0.8} />

          <text fontSize={7.5} fill="#64748b" fontWeight="700" letterSpacing={0.8}>SUPPLIER REGION</text>
          <circle cx={7} cy={13} r={4} fill="#3b82f6" />
          <text x={16} y={17} fontSize={7.5} fill="#94a3b8">Nearshore (EU)</text>
          <circle cx={7} cy={27} r={4} fill="#f59e0b" />
          <text x={16} y={31} fontSize={7.5} fill="#94a3b8">Offshore</text>

          <text y={49} fontSize={7.5} fill="#64748b" fontWeight="700" letterSpacing={0.8}>TRANSPORT MODE</text>
          <line x1={4} y1={63} x2={16} y2={63} stroke="#22c55e" strokeWidth={2} strokeDasharray="5 3" strokeLinecap="round" />
          <text x={21} y={67} fontSize={7.5} fill="#94a3b8">Truck</text>
          <line x1={4} y1={77} x2={16} y2={77} stroke="#60a5fa" strokeWidth={2} strokeDasharray="3 3" strokeLinecap="round" />
          <text x={21} y={81} fontSize={7.5} fill="#94a3b8">Rail</text>
          <line x1={4} y1={91} x2={16} y2={91} stroke="#818cf8" strokeWidth={2.5} strokeLinecap="round" />
          <text x={21} y={95} fontSize={7.5} fill="#94a3b8">Ocean</text>
          <line x1={4} y1={105} x2={16} y2={105} stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="2 2" strokeLinecap="round" />
          <text x={21} y={109} fontSize={7.5} fill="#94a3b8">Air</text>
        </g>

        {/* HQ legend note */}
        <g transform="translate(12,254)">
          <circle cx={7} cy={7} r={4.5} fill="#f43f5e" stroke="#fff" strokeWidth={1} />
          <text x={17} y={11} fontSize={7.5} fill="#94a3b8">VeloceWear HQ (Porto)</text>
        </g>

        {/* "No active routes" hint */}
        {activeRoutes.length === 0 && !isStrategyRedrawPending && (
          <text
            x={MAP_W / 2} y={MAP_H / 2 + 20}
            textAnchor="middle"
            fontSize={11}
            fill="#2a4060"
            fontStyle="italic"
          >
            Select suppliers above to see trade routes appear
          </text>
        )}
      </svg>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none bg-background border border-border rounded-xl p-3 shadow-xl"
          style={{
            left: `${(tooltip.x / MAP_W) * 100}%`,
            top: `${(tooltip.y / MAP_H) * 100}%`,
            transform: tooltip.x > MAP_W * 0.6
              ? "translate(-108%, -50%)"
              : "translate(12px, -50%)",
            minWidth: 210,
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
