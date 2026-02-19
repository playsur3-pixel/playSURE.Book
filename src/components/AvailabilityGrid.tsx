import { useEffect, useMemo, useState } from "react";
import { apiAvailabilityGet, apiAvailabilitySet, type AvailabilityData, type AvailabilitySlot } from "../app/auth";

const HOURS = [17, 18, 19, 20, 21, 22, 23]; // 23 => 23-00
const DAY_MS = 24 * 60 * 60 * 1000;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dateKeyLocal(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfWeekMonday(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  // JS: 0=Sunday .. 6=Saturday
  const day = x.getDay();
  const delta = day === 0 ? -6 : 1 - day; // move to Monday
  x.setDate(x.getDate() + delta);
  return x;
}

function formatDayLabel(d: Date) {
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function formatWeekRange(monday: Date) {
  const sunday = new Date(monday.getTime() + 6 * DAY_MS);
  const a = monday.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  const b = sunday.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  return `${a} → ${b}`;
}

function nextStateForMe(slot: AvailabilitySlot | undefined, me: string) {
  const isA = !!slot?.a?.includes(me);
  const isU = !!slot?.u?.includes(me);
  // unknown -> available -> unavailable -> clear
  if (!isA && !isU) return "available" as const;
  if (isA) return "unavailable" as const;
  return "clear" as const;
}

function stateForMe(slot: AvailabilitySlot | undefined, me: string) {
  if (slot?.a?.includes(me)) return "available";
  if (slot?.u?.includes(me)) return "unavailable";
  return "unknown";
}

export default function AvailabilityGrid({ meUsername }: { meUsername: string }) {
  const [data, setData] = useState<AvailabilityData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const weeks = useMemo(() => {
    const now = new Date();
    const monday = startOfWeekMonday(now);
    return Array.from({ length: 4 }).map((_, i) => new Date(monday.getTime() + i * 7 * DAY_MS));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        const res = await apiAvailabilityGet();
        setData({ version: 1 as const, updatedAt: res.updatedAt, slots: res.slots || {} });

      } catch (e: any) {
        setErr(e?.message || "Erreur chargement planning");
      }
    })();
  }, []);

  async function toggle(slotKey: string) {
    const slot = data?.slots?.[slotKey];
    const next = nextStateForMe(slot, meUsername);

    // optimistic update
    setSavingKey(slotKey);

    const optimistic = structuredClone(
  data ?? ({ version: 1 as const, updatedAt: "", slots: {} as Record<string, AvailabilitySlot> })
);

    const cur = optimistic.slots[slotKey] ?? { a: [], u: [] };
    const a = new Set(cur.a);
    const u = new Set(cur.u);
    a.delete(meUsername);
    u.delete(meUsername);
    if (next === "available") a.add(meUsername);
    if (next === "unavailable") u.add(meUsername);

    const newSlot = { a: Array.from(a), u: Array.from(u) };
    if (newSlot.a.length === 0 && newSlot.u.length === 0) delete optimistic.slots[slotKey];
    else optimistic.slots[slotKey] = newSlot;

    setData(optimistic);

    try {
      const res = await apiAvailabilitySet(slotKey, next);
      const confirmed = structuredClone(optimistic);
      // res.slot is normalized by server
      if (res.slot.a.length === 0 && res.slot.u.length === 0) delete confirmed.slots[slotKey];
      else confirmed.slots[slotKey] = res.slot;
      confirmed.updatedAt = new Date().toISOString();
      setData(confirmed);
    } catch (e: any) {
      setErr(e?.message || "Erreur sauvegarde");
      // reload from server to be safe
      const res = await apiAvailabilityGet();
      setData({ version: 1 as const, updatedAt: res.updatedAt, slots: res.slots || {} });

    } finally {
      setSavingKey(null);
    }
  }

  if (err) {
    return (
      <div className="rounded-xl2 border border-border bg-card/60 p-4 shadow-soft backdrop-blur text-sm text-red-200">
        {err}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl2 border border-border bg-card/60 p-4 shadow-soft backdrop-blur text-sm text-muted">
        Chargement du planning…
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-xl2 border border-border bg-card/60 p-4 shadow-soft backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold">Disponibilités</h3>
            <p className="mt-1 text-xs text-muted">
              Clic sur un créneau = Inconnu → Dispo → Indispo → Inconnu. Plage horaire 17h–00h, sur 4 semaines.
            </p>
          </div>
          <div className="text-xs text-muted">
            Connecté : <span className="text-white/90">@{meUsername}</span>
          </div>
        </div>
      </div>

      {weeks.map((monday, wi) => {
        const days = Array.from({ length: 7 }).map((_, di) => new Date(monday.getTime() + di * DAY_MS));

        return (
          <div key={wi} className="overflow-hidden rounded-xl2 border border-border bg-card/60 shadow-soft backdrop-blur">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="font-semibold">Semaine {wi + 1}</div>
              <div className="text-xs text-muted">{formatWeekRange(monday)}</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="w-24 px-3 py-2 text-left text-xs font-semibold text-muted">Heure</th>
                    {days.map((d) => (
                      <th key={d.toISOString()} className="px-3 py-2 text-left text-xs font-semibold text-muted">
                        {formatDayLabel(d)}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {HOURS.map((h) => (
                    <tr key={h} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-2 align-top text-xs text-muted">
                        {pad(h)}h–{h === 23 ? "00" : `${pad(h + 1)}h`}
                      </td>

                      {days.map((d) => {
                        const slotKey = `${dateKeyLocal(d)}|${pad(h)}`;
                        const slot = data.slots[slotKey];
                        const meState = stateForMe(slot, meUsername);

                        const title =
                          `Dispo: ${(slot?.a || []).join(", ") || "-"}\n` +
                          `Indispo: ${(slot?.u || []).join(", ") || "-"}`;

                        const cellBase =
                          "relative w-[12.5%] cursor-pointer select-none px-3 py-2 align-top text-xs transition";
                        const cellRing =
                          meState === "available"
                            ? "bg-accent/10 ring-1 ring-accent/60"
                            : meState === "unavailable"
                              ? "bg-white/5 ring-1 ring-white/20"
                              : "hover:bg-white/5 ring-1 ring-white/10";

                        return (
                          <td
                            key={slotKey}
                            title={title}
                            onClick={() => toggle(slotKey)}
                            className={`${cellBase} ${cellRing}`}
                          >
                            {savingKey === slotKey && (
                              <span className="absolute right-2 top-2 text-[10px] text-muted">…</span>
                            )}

                            {/* Dispo */}
                            {slot?.a?.length ? (
                              <div className="mb-1 flex flex-wrap gap-1">
                                {slot.a.slice(0, 3).map((u) => (
                                  <span key={u} className="rounded-lg bg-accent/20 px-2 py-0.5 text-[11px] text-white">
                                    {u}
                                  </span>
                                ))}
                                {slot.a.length > 3 && (
                                  <span className="rounded-lg bg-accent/10 px-2 py-0.5 text-[11px] text-muted">
                                    +{slot.a.length - 3}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="mb-1 text-[11px] text-muted">Dispo: —</div>
                            )}

                            {/* Indispo */}
                            {slot?.u?.length ? (
                              <div className="flex flex-wrap gap-1">
                                {slot.u.slice(0, 3).map((u) => (
                                  <span key={u} className="rounded-lg bg-white/10 px-2 py-0.5 text-[11px] text-white/80">
                                    {u}
                                  </span>
                                ))}
                                {slot.u.length > 3 && (
                                  <span className="rounded-lg bg-white/5 px-2 py-0.5 text-[11px] text-muted">
                                    +{slot.u.length - 3}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="text-[11px] text-muted">Indispo: —</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
