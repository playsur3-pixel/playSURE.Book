import React, { useEffect, useMemo, useState } from "react";
import { pctToGrid } from "../components/GridOverlay";

type Point = { x: number; y: number; grid: string };

function clampPct(v: number) {
  return Math.min(100, Math.max(0, v));
}

export default function PlacementTool({
  mapRef,
  rows,
  cols,
  defaultType = "smoke",
  defaultStuffId = "new-stuff",
  defaultTitle = "New lineup",
  onMarkersChange,
  enabledFromParent,
}: {
  mapRef: React.RefObject<HTMLDivElement>;
  rows: number;
  cols: number;
  defaultType?: "smoke" | "flash" | "molotov" | "he";
  defaultStuffId?: string;
  defaultTitle?: string;
  onMarkersChange?: (throwP: Point | null, resultP: Point | null) => void;
  enabledFromParent?: boolean; // si false => aucun clic pris en compte
}) {
  const storageKey = "playsure:miragePlacement";

  const [enabled, setEnabled] = useState(true);
  const [type, setType] = useState<"smoke" | "flash" | "molotov" | "he">(defaultType);
  const [stuffId, setStuffId] = useState(defaultStuffId);
  const [title, setTitle] = useState(defaultTitle);

  const [throwP, setThrowP] = useState<Point | null>(null);
  const [resultP, setResultP] = useState<Point | null>(null);

  // Restore from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      setEnabled(parsed.enabled ?? true);
      setType(parsed.type ?? defaultType);
      setStuffId(parsed.stuffId ?? defaultStuffId);
      setTitle(parsed.title ?? defaultTitle);
      setThrowP(parsed.throwP ?? null);
      setResultP(parsed.resultP ?? null);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ enabled, type, stuffId, title, throwP, resultP })
      );
    } catch {
      // ignore
    }
  }, [enabled, type, stuffId, title, throwP, resultP]);

  // Notify parent (optional)
  useEffect(() => {
    onMarkersChange?.(throwP, resultP);
  }, [throwP, resultP, onMarkersChange]);

  // Click handler on map (native event, so it works even outside React tree)
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;

    const handler = (ev: MouseEvent) => {
      // local toggle
      if (!enabled) return;
      // global toggle (Debug OFF)
      if (enabledFromParent === false) return;

      // left click only
      if (ev.button !== 0) return;

      const rect = el.getBoundingClientRect();
      const xPct = clampPct(((ev.clientX - rect.left) / rect.width) * 100);
      const yPct = clampPct(((ev.clientY - rect.top) / rect.height) * 100);

      const x = +xPct.toFixed(2);
      const y = +yPct.toFixed(2);
      const grid = pctToGrid(xPct, yPct, rows, cols);

      const point: Point = { x, y, grid };

      // ALT = throw, else result
      if (ev.altKey) {
        setThrowP(point);
        console.log("Throw (ALT+click):", point);
      } else {
        setResultP(point);
        console.log("Result (click):", point);
      }
    };

    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, [enabled, enabledFromParent, mapRef, rows, cols]);

  // Generate a lineupId each time stuffId changes (timestamped)
  const lineupId = useMemo(() => {
    const base = (stuffId.trim() || "new-stuff")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "");
    return `${base}-${stamp}`;
  }, [stuffId]);

  const snippet = useMemo(() => {
    if (!throwP || !resultP) return null;

    const safeStuffId = (stuffId || "new-stuff").trim();
    const safeTitle = (title || "New lineup").trim();

    return `{
  lineupId: "${lineupId}",
  stuffId: "${safeStuffId}",
  title: "${safeTitle}",
  type: "${type}",
  result: { x: ${resultP.x}, y: ${resultP.y} },
  throw: { x: ${throwP.x}, y: ${throwP.y} },
  previewImg: "/previews/mirage/${safeStuffId}.jpg",
},`;
  }, [throwP, resultP, lineupId, stuffId, title, type]);

  async function copySnippet() {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet);
      console.log("✅ Snippet copied to clipboard");
    } catch {
      console.log("❌ Clipboard blocked, copy manually from the panel.");
    }
  }

  function resetPoints() {
    setThrowP(null);
    setResultP(null);
  }

  function clearAll() {
    resetPoints();
    setStuffId(defaultStuffId);
    setTitle(defaultTitle);
    setType(defaultType);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">Mode placement</div>
          <div className="text-xs text-muted/80">
            ALT+clic = lancer • clic = arrivée • {cols}×{rows}
          </div>
          {enabledFromParent === false && (
            <div className="mt-1 text-[11px] text-amber-300/90">
              Debug OFF : les clics sur la map sont ignorés.
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-xs hover:bg-card/60 transition"
            onClick={() => setEnabled((v) => !v)}
            type="button"
          >
            {enabled ? "Désactiver" : "Activer"}
          </button>

          <button
            className="rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-xs hover:bg-card/60 transition"
            onClick={resetPoints}
            type="button"
          >
            Reset
          </button>

          <button
            className="rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-xs hover:bg-card/60 transition"
            onClick={clearAll}
            type="button"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <label className="grid gap-1">
          <span className="text-xs text-muted">stuffId</span>
          <input
            value={stuffId}
            onChange={(e) => setStuffId(e.target.value)}
            className="rounded-lg border border-border/60 bg-black/20 px-2 py-1.5 text-sm outline-none"
            placeholder="mid-window"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-muted">Titre</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-border/60 bg-black/20 px-2 py-1.5 text-sm outline-none"
            placeholder="Smoke Window"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-muted">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="rounded-lg border border-border/60 bg-black/20 px-2 py-1.5 text-sm outline-none"
          >
            <option value="smoke">smoke</option>
            <option value="flash">flash</option>
            <option value="molotov">molotov</option>
            <option value="he">he</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <div className="rounded-lg border border-border/60 bg-black/20 p-2">
          <div className="text-xs text-muted">Throw (ALT+clic)</div>
          <div className="text-sm">{throwP ? `${throwP.grid} • x:${throwP.x} y:${throwP.y}` : "—"}</div>
        </div>

        <div className="rounded-lg border border-border/60 bg-black/20 p-2">
          <div className="text-xs text-muted">Result (clic)</div>
          <div className="text-sm">{resultP ? `${resultP.grid} • x:${resultP.x} y:${resultP.y}` : "—"}</div>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-black/20 p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted">Snippet à coller dans ton fichier data</div>
          <button
            type="button"
            onClick={copySnippet}
            disabled={!snippet}
            className="rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-xs hover:bg-card/60 transition disabled:opacity-50"
          >
            Copier
          </button>
        </div>

        <pre className="mt-2 whitespace-pre-wrap text-xs text-white/80">
          {snippet ?? "Définis les 2 points (ALT+clic + clic) pour générer le snippet."}
        </pre>
      </div>
    </div>
  );
}