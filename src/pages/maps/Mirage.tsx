import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import GridOverlay from "../../components/GridOverlay";
import { mirageLineups } from "../../data/mirageLineups";

const ICONS = {
  smoke: "/icons/ct-smoke.svg",
  flash: "/icons/flash.svg",
  molotov: "/icons/molotov.svg",
  he: "/icons/he.svg",
  player: "/icons/player.svg",
} as const;

function ArrowOverlay({
  from,
  to,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
}) {
  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none z-30"
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
  const navigate = useNavigate();

  const [showGrid, setShowGrid] = useState(false);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const hoveredLineup = useMemo(
    () => mirageLineups.find((l) => l.lineupId === hoveredId) ?? null,
    [hoveredId]
  );

  const selectedLineup = useMemo(
    () => mirageLineups.find((l) => l.lineupId === selectedId) ?? null,
    [selectedId]
  );

  function onMapBackgroundClick() {
    setSelectedId(null);
  }

  function openDetails(lineupId: string, stuffId: string) {
    navigate(`/maps/mirage/stuff/${stuffId}?lineup=${lineupId}`);
  }

  return (
    <div className="rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Mirage</h2>
          <p className="mt-1 text-sm text-muted">
            Hover une smoke = preview. Clique une smoke = affiche le lancer. Clique le joueur = page détail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGrid((v) => !v)}
            className="rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-xs hover:bg-card/60 transition"
          >
            {showGrid ? "Masquer grille" : "Afficher grille"}
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-xl2 border border-border/60 bg-black/20 p-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* MAP */}
          <div
            ref={mapRef}
            className="relative w-full h-[72vh] overflow-hidden rounded-xl2 border border-border/50 bg-black/30"
            onClick={onMapBackgroundClick}
          >
            {/* Layer 1: background (ne doit JAMAIS capter les events) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <img
                src="/maps/mirage.png"
                srcSet="/maps/mirage_x2.png 2x"
                alt="Mirage overview"
                className="h-full w-full object-contain select-none"
                draggable={false}
              />
            </div>

            {/* Layer 2: overlays non interactifs */}
            <div className="absolute inset-0 z-50 pointer-events-auto outline outline-2 outline-red-500">
              <GridOverlay rows={rows} cols={cols} show={showGrid} />
              {selectedLineup && <ArrowOverlay from={selectedLineup.throw} to={selectedLineup.result} />}
            </div>

            {/* Layer 3: interaction (TOUT ce qui est cliquable/hover) */}
            <div className="absolute inset-0 z-50 pointer-events-auto outline outline-2 outline-blue-500">
              {/* Player (uniquement si sélection) */}
              {selectedLineup && (
                <button
                  type="button"
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${selectedLineup.throw.x}%`, top: `${selectedLineup.throw.y}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openDetails(selectedLineup.lineupId, selectedLineup.stuffId);
                  }}
                  title={`Ouvrir fiche: ${selectedLineup.title}`}
                >
                  <img
                    src={ICONS.player}
                    alt=""
                    draggable={false}
                    className="drop-shadow transition-transform hover:scale-110"
                    style={{ width: 34, height: 34 }}
                  />
                </button>
              )}

              {/* Markers RESULT */}
              {mirageLineups.map((l) => (
                <button
                  key={l.lineupId}
                  type="button"
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${l.result.x}%`, top: `${l.result.y}%` }}
                  onPointerEnter={() => setHoveredId(l.lineupId)}
                  onPointerLeave={() => setHoveredId((cur) => (cur === l.lineupId ? null : cur))}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(l.lineupId);
                  }}
                  title={l.title}
                >
                  <img
                    src={ICONS[l.type]}
                    alt=""
                    draggable={false}
                    className="drop-shadow transition-transform group-hover:scale-110"
                    style={{ width: 30, height: 30 }}
                  />

                  {/* Tooltip preview */}
                  <div
                    className="
                      pointer-events-none opacity-0 group-hover:opacity-100 transition
                      absolute left-1/2 top-[-10px] -translate-x-1/2 -translate-y-full
                      w-64 rounded-lg overflow-hidden border border-white/15 bg-black/70 backdrop-blur
                    "
                  >
                    <div className="px-2 py-1 text-xs text-white/90">{l.title}</div>
                    <img src={l.previewImg} alt="" className="w-full h-36 object-cover" draggable={false} />
                    <div className="px-2 py-1 text-[11px] text-white/70">Clique pour afficher le lancer</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* PANEL DROIT */}
          <div className="rounded-xl2 border border-border/50 bg-card/40 p-3 lg:sticky lg:top-24 h-fit">
            <div className="text-sm font-semibold">Sélection</div>
            <div className="mt-2 text-sm">
              {selectedLineup ? (
                <>
                  <div className="font-medium">{selectedLineup.title}</div>
                  <div className="text-xs text-muted/80 mt-1">
                    type: {selectedLineup.type} • stuffId: {selectedLineup.stuffId}
                  </div>
                  <div className="text-xs text-muted/80 mt-1">
                    Clique le joueur sur la map pour ouvrir la fiche.
                  </div>
                </>
              ) : (
                <div className="text-xs text-muted/80">Clique une icône sur la map.</div>
              )}
            </div>

            {hoveredLineup && !selectedLineup && (
              <div className="mt-4 text-xs text-muted/80">
                Hover: <span className="text-white/80">{hoveredLineup.title}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}