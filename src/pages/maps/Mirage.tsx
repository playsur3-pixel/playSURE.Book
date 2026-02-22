import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mirageLineups, MirageLineup } from "../../data/mirageLineups";

const ICONS = {
  smoke: "/icons/tr-smoke.svg",
  flash: "/icons/flash.svg",
  molotov: "/icons/molotov.svg",
  he: "/icons/he.svg",
  player: "/icons/player.svg",
};

function pctStyle(p: { x: number; y: number }) {
  return { left: `${p.x}%`, top: `${p.y}%` } as const;
}

export default function Mirage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  const hoveredLineup = useMemo(
    () => mirageLineups.find((l) => l.lineupId === hovered) ?? null,
    [hovered]
  );

  return (
    <div className="rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Mirage</h2>
        <p className="mt-1 text-sm text-muted">
          Passe la souris sur une icône pour voir la flèche + preview. Clique sur le joueur pour ouvrir la fiche.
        </p>
      </div>

      <div className="relative w-full max-w-5xl mx-auto overflow-hidden rounded-xl2 border border-border/60 bg-black/20">
        {/* ratio: adapte si ton svg n'est pas carré */}
        <div className="relative w-full aspect-[1/1]">
          {/* Overview */}
          <img
            src="/maps/mirage.svg"
            alt="Mirage overview"
            className="absolute inset-0 h-full w-full object-contain select-none pointer-events-none"
            draggable={false}
          />

          {/* Overlay flèche (uniquement quand hover) */}
          {hoveredLineup && (
            <ArrowOverlay from={hoveredLineup.throw} to={hoveredLineup.result} />
          )}

          {/* Markers */}
          {mirageLineups.map((l) => (
            <LineupMarkers
              key={l.lineupId}
              lineup={l}
              isHovered={hovered === l.lineupId}
              onHover={(v) => setHovered(v)}
              onLeave={() => setHovered(null)}
              onOpen={() => navigate(`/mirage/stuff/${l.stuffId}?lineup=${l.lineupId}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LineupMarkers({
  lineup,
  isHovered,
  onHover,
  onLeave,
  onOpen,
}: {
  lineup: MirageLineup;
  isHovered: boolean;
  onHover: (id: string) => void;
  onLeave: () => void;
  onOpen: () => void;
}) {
  // tailles icônes
  const size = 30;
  const playerSize = 32;

  return (
    <>
      {/* Icône résultat (smoke) */}
      <button
        type="button"
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={pctStyle(lineup.result)}
        onMouseEnter={() => onHover(lineup.lineupId)}
        onMouseLeave={onLeave}
        aria-label={lineup.title}
      >
        <img
          src={ICONS[lineup.type]}
          alt=""
          width={size}
          height={size}
          className={`drop-shadow transition-transform ${isHovered ? "scale-110" : "scale-100"}`}
          draggable={false}
        />
      </button>

      {/* Icône joueur (position de lancer) + tooltip preview */}
      <button
        type="button"
        className="absolute -translate-x-1/2 -translate-y-1/2 group"
        style={pctStyle(lineup.throw)}
        onMouseEnter={() => onHover(lineup.lineupId)}
        onMouseLeave={onLeave}
        onClick={onOpen}
        aria-label={`Ouvrir la fiche: ${lineup.title}`}
      >
        <img
          src={ICONS.player}
          alt=""
          width={playerSize}
          height={playerSize}
          className={`drop-shadow transition-transform ${isHovered ? "scale-110" : "scale-100"}`}
          draggable={false}
        />

        {/* Tooltip preview */}
        <div
          className={`
            pointer-events-none opacity-0 group-hover:opacity-100 transition
            absolute left-1/2 top-[-10px] -translate-x-1/2 -translate-y-full
            w-64 rounded-lg overflow-hidden border border-white/15 bg-black/70 backdrop-blur
          `}
        >
          <div className="px-2 py-1 text-xs text-white/90">{lineup.title}</div>
          <img
            src={lineup.previewImg}
            alt={`Preview ${lineup.title}`}
            className="w-full h-36 object-cover"
            draggable={false}
          />
          <div className="px-2 py-1 text-[11px] text-white/70">
            Clique pour voir les détails
          </div>
        </div>
      </button>
    </>
  );
}

/**
 * Flèche en overlay SVG au-dessus de la map.
 * Les coords sont en % et on dessine en viewBox 0..100 pour simplifier.
 */
function ArrowOverlay({
  from,
  to,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
}) {
  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <marker
          id="arrowHead"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
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