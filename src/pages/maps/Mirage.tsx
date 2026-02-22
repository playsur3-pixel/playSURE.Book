import { useRef, useState } from "react";
import GridOverlay from "../../components/GridOverlay";
import PlacementTool from "../../components/PlacementTool";
import { mirageLineups } from "../../data/mirageLineups";

export default function Mirage() {
  const cols = 26; // A..Z
  const rows = 20; // 1..20

 const mapRef = useRef<HTMLDivElement>(null);

  const ICONS = {
    smoke: "/icones/ct-smoke.svg",
    flash: "/icones/flash.svg",
    molotov: "/icones/molotov.svg",
    he: "/icones/he.svg",
    player: "/icones/player.svg",
} as const;

  const [showGrid, setShowGrid] = useState(true);
  const [debugCoords, setDebugCoords] = useState(true);

  return (
    <div className="rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Mirage</h2>
          <p className="mt-1 text-sm text-muted">
            Overview + grille de placement. ALT+clic = position lancer • clic = position arrivée.
          </p>
          <p className="mt-1 text-xs text-muted/80">
            Grid: {cols} cols (A-Z), {rows} rows (1-{rows})
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

          <button
            type="button"
            onClick={() => setDebugCoords((v) => !v)}
            className="rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-xs hover:bg-card/60 transition"
            title="Active/désactive le mode placement (clics sur la map)"
          >
            {debugCoords ? "Debug: ON" : "Debug: OFF"}
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="mt-5 rounded-xl2 border border-border/60 bg-black/20 p-3">
        {/* 2 colonnes (desktop) / 1 colonne (mobile) */}
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* MAP */}
          <div
            ref={mapRef}
            className="relative w-full h-[72vh] overflow-hidden rounded-xl2 border border-border/50 bg-black/30"
          >
            <img
              src="/maps/mirage.png"
              srcSet="/maps/mirage.png 2x"
              alt="Mirage overview"
              className="absolute inset-0 h-full w-full object-contain select-none"
              draggable={false}
            />

            <GridOverlay rows={rows} cols={cols} show={showGrid} />

            {mirageLineups.map((l) => (
              <div key={l.lineupId}>
                {/* RESULT ICON */}
                <img
                  src={ICONS[l.type]}
                  alt=""
                  className="absolute -translate-x-1/2 -translate-y-1/2 drop-shadow pointer-events-none"
                  style={{ left: `${l.result.x}%`, top: `${l.result.y}%`, width: 28, height: 28 }}
                  draggable={false}
                />

                {/* THROW PLAYER ICON */}
                <img
                  src={ICONS.player}
                  alt=""
                  className="absolute -translate-x-1/2 -translate-y-1/2 drop-shadow pointer-events-none"
                  style={{ left: `${l.throw.x}%`, top: `${l.throw.y}%`, width: 28, height: 28 }}
                  draggable={false}
                />
              </div>
            ))}


          </div>

          {/* PANEL DROIT */}
          <div className="rounded-xl2 border border-border/50 bg-card/40 p-3 lg:sticky lg:top-24 h-fit">
            {/* <PlacementTool
              mapRef={mapRef}
              rows={rows}
              cols={cols}
              enabledFromParent={debugCoords}
              defaultStuffId="new-stuff"
              defaultTitle="New lineup"
              defaultType="smoke"
            /> */}
          </div>
        </div>

        <div className="mt-2 text-xs text-muted/80">
          Astuce : laisse Debug ON, puis ALT+clic (lancer) + clic (arrivée) → clique “Copier” et colle dans ton fichier data.
        </div>
      </div>
    </div>
  );
}