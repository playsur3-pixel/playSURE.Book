import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import GridOverlay from "../../components/GridOverlay";
import PlacementTool from "../../components/PlacementTool";
import { mirageLineups } from "../../data/mirageLineups";

const ICONS = {
  smoke: "/icons/ct-smoke.svg",
  flash: "/icons/flash.svg",
  molotov: "/icons/molotov.svg",
  he: "/icons/he.svg",
  player: "/icons/player.svg",
} as const;

type GrenadeType = "smoke" | "flash" | "molotov" | "he";
type GrenadeFilter = "all" | GrenadeType;

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
  const [grenadeFilter, setGrenadeFilter] = useState<GrenadeFilter>("all");
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

  return (
    <>
      {/* MAP full-fit under topbar */}
      <div className="fixed left-0 right-0 bottom-0 z-0" style={{ top: `${topbarH}px` }}>
        <div className="h-full w-full flex items-center justify-center">
          <div
            ref={mapRef}
            className="relative overflow-hidden bg-black/20"
            style={squareSizeStyle}
            // click in empty space => deselect
            onPointerDown={() => setSelectedId(null)}
          >
            {/* Overview */}
            <img
              src="/maps/mirage.png"
              alt="Mirage overview"
              className="absolute inset-0 h-full w-full object-contain select-none pointer-events-none"
              draggable={false}
            />

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
            {selectedLineup && (
              <>
                <ArrowOverlay from={selectedLineup.throw} to={selectedLineup.result} />

                <button
                  type="button"
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                  style={{
                    left: `${selectedLineup.throw.x}%`,
                    top: `${selectedLineup.throw.y}%`,
                  }}
                  title="Position de lancer"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={ICONS.player}
                    alt=""
                    draggable={false}
                    style={{ width: 34, height: 34 }}
                    className="drop-shadow transition-transform hover:scale-110"
                  />
                </button>
              </>
            )}

            {/* Markers (filtered) */}
            {visibleLineups.map((l) => {
              const isSelected = l.lineupId === selectedId;

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
                  onPointerEnter={() => setHoveredId(l.lineupId)}
                  onPointerLeave={() =>
                    setHoveredId((cur) => (cur === l.lineupId ? null : cur))
                  }
                  title={l.title}
                >
                  <img
                    src={ICONS[l.type as GrenadeType]}
                    alt=""
                    draggable={false}
                    style={{ width: 30, height: 30 }}
                    className={`drop-shadow transition-transform ${
                      isSelected ? "scale-110" : "group-hover:scale-110"
                    }`}
                  />

                  {/* Hover tooltip preview */}
                  <div
                    className="
                      pointer-events-none opacity-0 group-hover:opacity-100 transition
                      absolute left-1/2 top-[-10px] -translate-x-1/2 -translate-y-full
                      w-64 rounded-lg overflow-hidden border border-white/15 bg-black/70 backdrop-blur
                    "
                  >
                    <div className="px-2 py-1 text-xs text-white/90">{l.title}</div>
                    <img
                      src={l.previewImg}
                      alt=""
                      className="w-full h-36 object-cover"
                      draggable={false}
                    />
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