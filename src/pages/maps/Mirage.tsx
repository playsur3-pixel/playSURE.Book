import { CollapsibleCard } from "../../components/CollapsibleCard";
import { YouTubeEmbed } from "../../components/YouTubeEmbed";

import {
  mirageStuffTR,
  mirageStuffCT,
  mirageStratsTR,
  mirageStratsCT,
  type StuffPack,
  type StratItem,
} from "../../content/maps/mirage";

function StuffPackCard({ pack }: { pack: StuffPack }) {
  return (
    <CollapsibleCard title={pack.title} subtitle="Clique pour afficher les vidéos + la fiche" className="bg-card/30">
      <div className="grid gap-4 md:grid-cols-4">
        {/* 3/4 vidéos */}
        <div className="md:col-span-3 grid gap-3">
          {pack.videos.map((v) => (
            <div key={v.label} className="rounded-xl2 border border-border bg-black/20 p-3">
              <div className="mb-2 text-xs font-semibold text-white/80">{v.label}</div>
              <YouTubeEmbed embedSrc={v.embedSrc} start={v.start} />
            </div>
          ))}
        </div>

        {/* 1/4 instructions */}
        <div className="md:col-span-1 rounded-xl2 border border-border bg-white/5 p-4">
          <div className="text-sm font-semibold">Instructions</div>

          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {pack.instructions.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ul>

          <div className="mt-4 text-xs text-white/70">
            <div className="font-semibold mb-1">Vidéos</div>
            <ul className="list-disc pl-5 space-y-1">
              {pack.videos.map((v) => (
                <li key={v.label}>{v.label}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </CollapsibleCard>
  );
}

function StratCard({ it }: { it: StratItem }) {
  return (
    <CollapsibleCard title={it.title} subtitle={it.goal} className="bg-card/30">
      <div className="rounded-xl2 border border-border bg-white/5 p-4">
        <div className="text-sm font-semibold">Plan</div>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
          {it.steps.map((s, idx) => (
            <li key={idx}>{s}</li>
          ))}
        </ol>
      </div>
    </CollapsibleCard>
  );
}

export default function Mirage() {
  return (
    <div className="grid gap-4">
      {/* Header Mirage */}
      <div className="rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur">
        <h2 className="text-xl font-semibold">Mirage</h2>
        <p className="mt-2 text-sm text-muted">Stuff (TR/CT) et Strats (TR/CT) — format déroulable.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-xl bg-white/5 px-3 py-1 text-xs text-white/80">#Stuff</span>
          <span className="rounded-xl bg-white/5 px-3 py-1 text-xs text-white/80">#Stratégie</span>
        </div>
      </div>

      {/* #Stuff (fermé par défaut) */}
      <CollapsibleCard title="#Stuff" subtitle="TR / CT — vidéos + instructions">
        <div className="grid gap-3">
          <CollapsibleCard title="Stuff TR" subtitle="Lineups / exec côté Terrorists">
            <div className="grid gap-3">
              {mirageStuffTR.length ? (
                mirageStuffTR.map((pack) => <StuffPackCard key={pack.title} pack={pack} />)
              ) : (
                <div className="rounded-xl2 border border-border bg-white/5 p-4 text-sm text-muted">
                  Aucun contenu TR pour le moment.
                </div>
              )}
            </div>
          </CollapsibleCard>

          <CollapsibleCard title="Stuff CT" subtitle="Setups / retakes côté Counter-Terrorists">
            <div className="grid gap-3">
              {mirageStuffCT.length ? (
                mirageStuffCT.map((pack) => <StuffPackCard key={pack.title} pack={pack} />)
              ) : (
                <div className="rounded-xl2 border border-border bg-white/5 p-4 text-sm text-muted">
                  Aucun contenu CT pour le moment.
                </div>
              )}
            </div>
          </CollapsibleCard>
        </div>
      </CollapsibleCard>

      {/* #Stratégie (avec TR/CT) */}
      <CollapsibleCard title="#Stratégie" subtitle="TR / CT — plans / executes / calls">
        <div className="grid gap-3">
          <CollapsibleCard title="Stratégies TR" subtitle="Defaults / executes / splits">
            <div className="grid gap-3">
              {mirageStratsTR.length ? (
                mirageStratsTR.map((it) => <StratCard key={it.title} it={it} />)
              ) : (
                <div className="rounded-xl2 border border-border bg-white/5 p-4 text-sm text-muted">
                  Aucun contenu TR pour le moment.
                </div>
              )}
            </div>
          </CollapsibleCard>

          <CollapsibleCard title="Stratégies CT" subtitle="Setups / retakes / anti-strats">
            <div className="grid gap-3">
              {mirageStratsCT.length ? (
                mirageStratsCT.map((it) => <StratCard key={it.title} it={it} />)
              ) : (
                <div className="rounded-xl2 border border-border bg-white/5 p-4 text-sm text-muted">
                  Aucun contenu CT pour le moment.
                </div>
              )}
            </div>
          </CollapsibleCard>
        </div>
      </CollapsibleCard>
    </div>
  );
}
