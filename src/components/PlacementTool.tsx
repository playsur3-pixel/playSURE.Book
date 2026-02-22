import React, { useEffect, useMemo, useState } from "react";

type Point = { x: number; y: number; grid: string };

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function pctToGrid(xPct: number, yPct: number, rows: number, cols: number) {
  const col = Math.min(cols - 1, Math.max(0, Math.floor((xPct / 100) * cols)));
  const row = Math.min(rows - 1, Math.max(0, Math.floor((yPct / 100) * rows)));
  const letter = String.fromCharCode(65 + col);
  return `${letter}${row + 1}`;
}

// object-contain content rect
function getContainRect(containerW: number, containerH: number, imageAspect: number) {
  const containerAspect = containerW / containerH;

  // image "wider" than container -> fit width
  if (imageAspect > containerAspect) {
    const w = containerW;
    const h = w / imageAspect;
    const x = 0;
    const y = (containerH - h) / 2;
    return { x, y, w, h };
  }

  // fit height
  const h = containerH;
  const w = h * imageAspect;
  const y = 0;
  const x = (containerW - w) / 2;
  return { x, y, w, h };
}

export default function PlacementTool({
  mapRef,
  rows,
  cols,
  defaultType = "smoke",
  defaultStuffId = "new-stuff",
  defaultTitle = "New lineup",
  enabledFromParent = true,
  fitMode = "contain",
  imageAspect = 1,
}: {
  mapRef: React.RefObject<HTMLDivElement>;
  rows: number;
  cols: number;
  defaultType?: "smoke" | "flash" | "molotov" | "he";
  defaultStuffId?: string;
  defaultTitle?: string;
  enabledFromParent?: boolean;
  fitMode?: "contain";
  imageAspect?: number; // width/height
}) {
  const storageKey = "playsure:placementTool:v1";

  const [enabled, setEnabled] = useState(true);
  const [type, setType] = useState<"smoke" | "flash" | "molotov" | "he">(defaultType);
  const [stuffId, setStuffId] = useState(defaultStuffId);
  const [title, setTitle] = useState(defaultTitle);

  const [throwP, setThrowP] = useState<Point | null>(null);
  const [resultP, setResultP] = useState<Point | null>(null);

  // Restore localStorage
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

  // Persist localStorage
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

  // Attach event listener (pointerdown is more reliable than click)
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;

    const handler = (ev: PointerEvent) => {
      if (!enabled) return;
      if (!enabledFromParent) return;
      if (ev.button !== 0) return; // left button only

      const rect = el.getBoundingClientRect();
      const localX = ev.clientX - rect.left;
      const localY = ev.clientY - rect.top;

      let imgRect = { x: 0, y: 0, w: rect.width, h: rect.height };
      if (fitMode === "contain") {
        imgRect = getContainRect(rect.width, rect.height, imageAspect);
      }

      const inside =
        localX >= imgRect.x &&
        localX <= imgRect.x + imgRect.w &&
        localY >= imgRect.y &&
        localY <= imgRect.y + imgRect.h;

      if (!inside) return; // click in letterbox area

      const xPct = ((localX - imgRect.x) / imgRect.w) * 100;
      const yPct = ((localY - imgRect.y) / imgRect.h) * 100;

      const x = +clamp(xPct, 0, 100).toFixed(2);
      const y = +clamp(yPct, 0, 100).toFixed(2);
      const grid = pctToGrid(x, y, rows, cols);

      const point: Point = { x, y, grid };

      if (ev.altKey) setThrowP(point);
      else setResultP(point);
    };

    el.addEventListener("pointerdown", handler);
    return () => el.removeEventListener("pointerdown", handler);
  }, [mapRef, enabled, enabledFromParent, rows, cols, fitMode, imageAspect]);

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
    } catch {
      // clipboard can be blocked; user can copy manually
    }
  }

  function resetPoints() {
    setThrowP(null);
    setResultP(null);
  }

  function clearAll() {
    resetPoints();
    setType(defaultType);
    setStuffId(defaultStuffId);
    setTitle(defaultTitle);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-white/90">Mode placement</div>
          <div className="text-xs text-white/60">
            ALT+clic = lancer • clic = arrivée • {cols}×{rows} • fit:{fitMode}
          </div>
          {!enabledFromParent && (
            <div className="mt-1 text-[11px] text-amber-300/90">
              Debug OFF : clics ignorés.
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 transition"
          >
            {enabled ? "Activer" : "Activer"}
          </button>

          <button
            type="button"
            onClick={resetPoints}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 transition"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={clearAll}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 transition"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <label className="grid gap-1">
          <span className="text-xs text-white/60">stuffId</span>
          <input
            value={stuffId}
            onChange={(e) => setStuffId(e.target.value)}
            className="rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white/90 outline-none"
            placeholder="smokewindow"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-white/60">Titre</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white/90 outline-none"
            placeholder="Smoke Window"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs text-white/60">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white/90 outline-none"
          >
            <option value="smoke">smoke</option>
            <option value="flash">flash</option>
            <option value="molotov">molotov</option>
            <option value="he">he</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-white/15 bg-black/25 p-2">
          <div className="text-xs text-white/60">Throw (ALT+clic)</div>
          <div className="text-sm text-white/90">
            {throwP ? `${throwP.grid} • x:${throwP.x} y:${throwP.y}` : "—"}
          </div>
        </div>

        <div className="rounded-lg border border-white/15 bg-black/25 p-2">
          <div className="text-xs text-white/60">Result (clic)</div>
          <div className="text-sm text-white/90">
            {resultP ? `${resultP.grid} • x:${resultP.x} y:${resultP.y}` : "—"}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/15 bg-black/25 p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-white/60">Snippet à coller</div>
          <button
            type="button"
            onClick={copySnippet}
            disabled={!snippet}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 transition disabled:opacity-50"
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