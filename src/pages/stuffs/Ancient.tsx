import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import GridOverlay from "@/components/GridOverlay";
import PlacementTool from "@/components/PlacementTool";
import { ancientLineups } from "@/data/ancientLineups";
import { GRENADE_ICONS, PLAYER_ICON } from "@/config/icons";

type GrenadeFilter = "all" | "smoke" | "flash" | "molotov" | "he";
type GrenadeType = "smoke" | "flash" | "molotov" | "he";
type PointPct = { x: number; y: number };

function TrajectoryOverlay({
  id,
  from,
  to,
}: {
  id: string;
  from: PointPct;
  to: PointPct;
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;

  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;

  const nx = -dy / len;
  const ny = dx / len;

  const bend = Math.min(14, Math.max(7, len * 0.18));
  const cx = mx + nx * bend;
  const cy = my + ny * bend;

  const gradId = `traj-grad-${id}`;
  const arrowId = `traj-arrow-${id}`;
  const glowId = `traj-glow-${id}`;

  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none z-10"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <linearGradient
          id={gradId}
          gradientUnits="userSpaceOnUse"
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
        >
          <stop offset="0%" stopColor="rgba(255,165,0,0.25)" />
          <stop offset="60%" stopColor="rgba(255,165,0,0.85)" />
          <stop offset="100%" stopColor="rgba(255,165,0,0.95)" />
        </linearGradient>

        <marker id={arrowId} markerWidth="6" markerHeight="6" refX="5.2" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,165,0,0.95)" />
        </marker>
      </defs>

      <path
        d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="1.0"
        strokeLinecap="round"
        markerEnd={`url(#${arrowId})`}
        filter={`url(#${glowId})`}
      />
      <path
        d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
        fill="none"
        stroke="rgba(255,220,120,0.35)"
        strokeWidth="0.45"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AncientStuffs() {
  const cols = 26;
  const rows = 20;

  const mapRef = useRef<HTMLDivElement>(null);
  const [topbarH, setTopbarH] = useState(72);

  const [showAdmin, setShowAdmin] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [debugCoords, setDebugCoords] = useState(true);

  const [grenadeFilter, setGrenadeFilter] = useState<GrenadeFilter>("smoke");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [tooltipSide, setTooltipSide] = useState<"top" | "bottom">("top");
  const [brokenPreview, setBrokenPreview] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  useLayoutEffect(() => {
    const header =
      (document.querySelector("header") as HTMLElement | null) ||
      (document.querySelector('[data-topbar="true"]') as HTMLElement | null);

    if (!header) return;

    const update = () => setTopbarH(Math.ceil(header.getBoundingClientRect().height));
    update();

    const ro = new ResizeObserver(update);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const konamiSeq = [
      "ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight",
    ];
    let buffer: string[] = [];

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAdmin(false);
        return;
      }
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || el?.isContentEditable) return;

      buffer.push(e.key);
      if (buffer.length > konamiSeq.length) buffer.shift();

      const ok = konamiSeq.every((k, i) => buffer[i] === k);
      if (ok) {
        setShowAdmin((v) => !v);
        setDebugCoords(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const squareSizeStyle = useMemo(
    () =>
      ({
        width: `min(100vw, calc(100dvh - ${topbarH}px))`,
        height: `min(100vw, calc(100dvh - ${topbarH}px))`,
      }) as const,
    [topbarH]
  );

  const visibleLineups = useMemo(() => {
    if (grenadeFilter === "all") return ancientLineups;
    return ancientLineups.filter((l) => l.type === grenadeFilter);
  }, [grenadeFilter]);

  const selectedLineup = useMemo(() => {
    if (!selectedId) return null;
    return ancientLineups.find((l) => l.lineupId === selectedId) ?? null;
  }, [selectedId]);

  const [mapSize, setMapSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setMapSize({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const PLAYER_SIZE = 60;
  const PLAYER_HOVER_SCALE = 1.1;
  const PLAYER_SAFE_HALF = (PLAYER_SIZE * PLAYER_HOVER_SCALE) / 2 + 2;

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  const clampPctPoint = (p: PointPct, w: number, h: number, safeHalfPx: number) => {
    if (!w || !h) return p;

    const xPx = clamp((p.x / 100) * w, safeHalfPx, w - safeHalfPx);
    const yPx = clamp((p.y / 100) * h, safeHalfPx, h - safeHalfPx);

    return { x: (xPx / w) * 100, y: (yPx / h) * 100 };
  };

  const displayThrow = selectedLineup
    ? clampPctPoint(selectedLineup.throw, mapSize.w, mapSize.h, PLAYER_SAFE_HALF)
    : null;

  const TOOLTIP_H = 420;
  const TOOLTIP_MARGIN = 12;
  const neededTooltipSpace = TOOLTIP_H + TOOLTIP_MARGIN;

  return (
    <>
      <div className="fixed left-0 right-0 bottom-0 z-0" style={{ top: `${topbarH}px` }}>
        <div className="h-full w-full flex items-center justify-center">
          <div ref={mapRef} className="relative overflow-visible" style={squareSizeStyle}>
            <div className="absolute inset-0 overflow-hidden">
              <img
                src="/maps/ancient.png"
                alt="Ancient overview"
                className="h-full w-full object-contain select-none pointer-events-none"
                draggable={false}
              />
            </div>

            <div
              className="absolute right-3 top-3 z-30 pointer-events-auto"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <select
                value={grenadeFilter}
                onChange={(e) => setGrenadeFilter(e.target.value as GrenadeFilter)}
                className="rounded-lg border border-white/15 bg-black/60 px-3 py-1.5 text-xs text-white/90 backdrop-blur outline-none"
                title="Filtrer par grenade"
              >
                <option value="all">Toutes</option>
                <option value="smoke">Smoke</option>
                <option value="flash">Flash</option>
                <option value="molotov">Molotov</option>
                <option value="he">HE</option>
              </select>
            </div>

            <GridOverlay rows={rows} cols={cols} show={showGrid} />

            {selectedLineup && displayThrow && (
              <>
                <TrajectoryOverlay id={selectedLineup.lineupId} from={displayThrow} to={selectedLineup.result} />
                <button
                  type="button"
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                  style={{ left: `${displayThrow.x}%`, top: `${displayThrow.y}%` }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  title="Position de lancer"
                >
                  <img
                    src={PLAYER_ICON.src}
                    alt=""
                    draggable={false}
                    className="w-full h-full object-contain drop-shadow transition-transform hover:scale-110"
                    style={{ width: PLAYER_SIZE, height: PLAYER_SIZE }}
                  />
                </button>
              </>
            )}

            {visibleLineups.map((l) => {
              const isSelected = l.lineupId === selectedId;
              const isHovered = hoveredId === l.lineupId;

              const t = l.type as GrenadeType;
              const icon = GRENADE_ICONS[t];

              return (
                <button
                  key={l.lineupId}
                  type="button"
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group pointer-events-auto ${isHovered ? "z-50" : "z-20"}`}
                  style={{ left: `${l.result.x}%`, top: `${l.result.y}%` }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelectedId(l.lineupId);
                  }}
                  onPointerEnter={(e) => {
                    setHoveredId(l.lineupId);

                    const markerRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    const mapRect = mapRef.current?.getBoundingClientRect();

                    if (mapRect) {
                      const spaceAbove = markerRect.top - mapRect.top;
                      const spaceBelow = mapRect.bottom - markerRect.bottom;
                      if (spaceAbove < neededTooltipSpace && spaceBelow >= neededTooltipSpace) setTooltipSide("bottom");
                      else setTooltipSide("top");
                    } else {
                      setTooltipSide(markerRect.top < neededTooltipSpace ? "bottom" : "top");
                    }
                  }}
                  onPointerLeave={() => setHoveredId((cur) => (cur === l.lineupId ? null : cur))}
                  title={l.title}
                >
                  <img
                    src={icon.src}
                    alt=""
                    draggable={false}
                    style={{ width: icon.size, height: icon.size }}
                    className={`drop-shadow transition-transform ${isSelected ? "scale-110" : "group-hover:scale-110"}`}
                  />

                  <div
                    className={`
                      pointer-events-none opacity-0 group-hover:opacity-100 transition
                      absolute left-1/2 -translate-x-1/2 z-50
                      ${tooltipSide === "top" ? "top-[-10px] -translate-y-full" : "top-[calc(100%+10px)] translate-y-0"}
                      w-[min(640px,90vw)] rounded-lg overflow-hidden
                      border border-white/15 bg-black/95 backdrop-blur
                    `}
                  >
                    <div className="px-2 py-1 text-xs text-white/90">{l.title}</div>

                    {l.previewImg && !brokenPreview[l.lineupId] ? (
                      <div className="w-full aspect-video bg-black/30">
                        <img
                          src={l.previewImg}
                          alt=""
                          className="h-full w-full object-cover"
                          draggable={false}
                          onError={() => setBrokenPreview((p) => ({ ...p, [l.lineupId]: true }))}
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-black/30 flex items-center justify-center text-xs text-white/60">
                        Pas de preview
                      </div>
                    )}

                    <div className="px-2 py-1 text-[11px] text-white/70">Clique pour afficher le lancer</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showAdmin && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          <div className="absolute inset-0 bg-black/60 pointer-events-none" />

          <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-black/85 backdrop-blur border-l border-white/10 pointer-events-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="text-sm font-semibold text-white/90">Admin • Placement (Konami)</div>
              <button
                type="button"
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 transition"
                onClick={() => setShowAdmin(false)}
              >
                Fermer
              </button>
            </div>

            <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-white/10">
              <button
                type="button"
                onClick={() => setShowGrid((v) => !v)}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 transition"
              >
                {showGrid ? "Masquer grille" : "Afficher grille"}
              </button>

              <button
                type="button"
                onClick={() => setDebugCoords((v) => !v)}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 transition"
              >
                {debugCoords ? "Debug: ON" : "Debug: OFF"}
              </button>
            </div>

            <div className="h-[calc(100%-96px)] overflow-auto p-4">
              <PlacementTool
                mapRef={mapRef}
                rows={rows}
                cols={cols}
                enabledFromParent={debugCoords}
                fitMode="contain"
                imageAspect={1}
                defaultStuffId="new-stuff"
                defaultTitle="New lineup"
                defaultType="smoke"
              />

              <div className="mt-3 text-[11px] text-white/60">Konami: ↑↑↓↓←→←→ • ESC pour fermer</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
