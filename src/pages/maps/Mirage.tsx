import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import GridOverlay from "../../components/GridOverlay";
import PlacementTool from "../../components/PlacementTool";
import { mirageLineups } from "../../data/mirageLineups";
import { GRENADE_ICONS, PLAYER_ICON, type GrenadeType, type GrenadeFilter } from "../../config/icons";


function ArrowOverlay({
  from,
  to,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
}) {
  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none z-10"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <marker id="arrowHead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,255,255,0.85)" />
        </marker>
      </defs>

      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke="rgba(255,255,255,0.75)"
        strokeWidth="1.2"
        markerEnd="url(#arrowHead)"
      />
    </svg>
  );
}

export default function Mirage() {
  const cols = 26;
  const rows = 20;

  const mapRef = useRef<HTMLDivElement>(null);

  // topbar height (measured)
  const [topbarH, setTopbarH] = useState(72);

  // admin (Konami)
  const [showAdmin, setShowAdmin] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [debugCoords, setDebugCoords] = useState(true);

  // filter + hover/selection
  const [grenadeFilter, setGrenadeFilter] = useState<GrenadeFilter>("smoke");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  

  const konamiSeq = useMemo(
    () => [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
    ],
    []
  );

  // Disable scroll for this page (drawer scrolls internally)
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

  // Measure topbar height automatically (header or data-topbar)
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

  // Konami + ESC
  useEffect(() => {
    let buffer: string[] = [];

    const onKeyDown = (e: KeyboardEvent) => {
      // close admin with ESC
      if (e.key === "Escape") {
        setShowAdmin(false);
        return;
      }

      // ignore when typing
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
  }, [konamiSeq]);

  // Stable square size: min(viewport width, available height below topbar)
  const squareSizeStyle = useMemo(
    () =>
      ({
        width: `min(100vw, calc(100dvh - ${topbarH}px))`,
        height: `min(100vw, calc(100dvh - ${topbarH}px))`,
      }) as const,
    [topbarH]
  );

  const visibleLineups =
    grenadeFilter === "all"
      ? mirageLineups
      : mirageLineups.filter((l) => l.type === grenadeFilter);

  // Keep selection even if filter changes (recommended)
  const selectedLineup = selectedId
    ? mirageLineups.find((l) => l.lineupId === selectedId) ?? null
    : null;
  // ajout pour décaler le player et éviter qu'il soit coupé sur les bords de la map
    const PLAYER_SIZE = 60;
    const PLAYER_HOVER_SCALE = 1.1; // hover:scale-110
    const PLAYER_SAFE_HALF = (PLAYER_SIZE * PLAYER_HOVER_SCALE) / 2 + 2; // +2px de marge

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
    // fin ajout
    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

    const clampPctPoint = (
      p: { x: number; y: number },
      w: number,
      h: number,
      safeHalfPx: number
    ) => {
      if (!w || !h) return p;

      const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

      const xPx = clamp((p.x / 100) * w, safeHalfPx, w - safeHalfPx);
      const yPx = clamp((p.y / 100) * h, safeHalfPx, h - safeHalfPx);

      return { x: (xPx / w) * 100, y: (yPx / h) * 100 };
    };

    const displayThrow = selectedLineup
    ? clampPctPoint(selectedLineup.throw, mapSize.w, mapSize.h, PLAYER_SAFE_HALF)
    : null;

  return (
    <>
      {/* MAP full-fit under topbar */}
      <div className="fixed left-0 right-0 bottom-0 z-0" style={{ top: `${topbarH}px` }}>
        <div className="h-full w-full flex items-center justify-center">
          <div ref={mapRef} className="relative overflow-visible" style={squareSizeStyle}>
            {/* Clip uniquement l'image */}
            <div className="absolute inset-0 overflow-hidden">
              <img
                src="/maps/mirage.png"
                alt="Mirage overview"
                className="h-full w-full object-contain select-none pointer-events-none"
                draggable={false}
              />
            </div>

            {/* Filter (top-right) */}
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

            {/* Grid */}
            <GridOverlay rows={rows} cols={cols} show={showGrid} />

            {/* Arrow + Player when selected */}
            {selectedLineup && displayThrow && (
              <button
                type="button"
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                style={{ left: `${displayThrow.x}%`, top: `${displayThrow.y}%`, width: PLAYER_SIZE, height: PLAYER_SIZE }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={PLAYER_ICON.src /* ou ICONS.player.src */}
                  alt=""
                  draggable={false}
                  className="w-full h-full object-contain drop-shadow transition-transform hover:scale-110"
                />
              </button>
            )}

            {/* Markers (filtered) */}
            {visibleLineups.map((l) => {
              const isSelected = l.lineupId === selectedId;
              const icon = GRENADE_ICONS[l.type as GrenadeType];

              const TOOLTIP_H = 420; // ~ titre + image 360 + padding (ajuste si besoin)
              const TOOLTIP_MARGIN = 12;

              const [hoveredId, setHoveredId] = useState<string | null>(null);
              const [tooltipSide, setTooltipSide] = useState<"top" | "bottom">("top");
              const [brokenPreview, setBrokenPreview] = useState<Record<string, boolean>>({});

              return (
              <button
                key={l.lineupId}
                type="button"
                className="absolute -translate-x-1/2 -translate-y-1/2 group z-20 pointer-events-auto"
                style={{ left: `${l.result.x}%`, top: `${l.result.y}%` }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelectedId(l.lineupId);
                }}
                onPointerEnter={(e) => {
                  setHoveredId(l.lineupId);

                  const markerRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  const mapRect = mapRef.current?.getBoundingClientRect();

                  const needed = TOOLTIP_H + TOOLTIP_MARGIN;

                  if (mapRect) {
                    const spaceAbove = markerRect.top - mapRect.top;
                    const spaceBelow = mapRect.bottom - markerRect.bottom;

                    if (spaceAbove < needed && spaceBelow >= needed) setTooltipSide("bottom");
                    else setTooltipSide("top");
                  } else {
                    // fallback
                    setTooltipSide(markerRect.top < needed ? "bottom" : "top");
                  }
                }}
                onPointerLeave={() => {
                  setHoveredId((cur) => (cur === l.lineupId ? null : cur));
                }}
                title={l.title}
              >
                <img
                  src={icon.src}
                  alt=""
                  draggable={false}
                  style={{ width: icon.size, height: icon.size }}
                  className={`drop-shadow transition-transform ${
                    isSelected ? "scale-110" : "group-hover:scale-110"
                  }`}
                />

                {/* Hover tooltip preview */}
                <div
                  className={`
                    pointer-events-none opacity-0 group-hover:opacity-100 transition
                    absolute left-1/2 -translate-x-1/2 z-50
                    ${tooltipSide === "top"
                      ? "top-[-10px] -translate-y-full"
                      : "top-[calc(100%+10px)] translate-y-0"}
                    w-[min(640px,90vw)] rounded-lg overflow-hidden
                    border border-white/15 bg-black/70 backdrop-blur
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

                  <div className="px-2 py-1 text-[11px] text-white/70">
                    Clique pour afficher le lancer
                  </div>
                </div>
              </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ADMIN DRAWER (Konami)
          - overlay is pointer-events-none so the map stays clickable
          - panel is pointer-events-auto so buttons work
      */}
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

              <div className="mt-3 text-[11px] text-white/60">
                Konami: ↑↑↓↓←→←→ • ESC pour fermer
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}