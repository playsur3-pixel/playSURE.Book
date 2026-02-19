import { CollapsibleCard } from "../../components/CollapsibleCard";
import { YouTubeEmbed } from "../../components/YouTubeEmbed";
import { mirageStuff, mirageStrats } from "../../content/maps/mirage";

export default function Mirage() {
  return (
    <div className="grid gap-4">
      {/* Header Mirage */}
      <div className="rounded-xl2 border border-border bg-card/60 p-6 shadow-soft backdrop-blur">
        <h2 className="text-xl font-semibold">Mirage</h2>
        <p className="mt-2 text-sm text-muted">
          Stuff, lineups, exécutions et strats — format déroulable.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-xl bg-white/5 px-3 py-1 text-xs text-white/80">#Stuff</span>
          <span className="rounded-xl bg-white/5 px-3 py-1 text-xs text-white/80">#Stratégie</span>
        </div>
      </div>

      {/* #Stuff */}
      <CollapsibleCard title="#Stuff" subtitle="Vidéos + instructions">
        <div className="grid gap-3">
          {mirageStuff.map((it) => (
            <CollapsibleCard
              key={it.title}
              title={it.title}
              subtitle="Clique pour afficher"
              className="bg-card/30"
            >
              {/* ✅ 3/4 vidéo + 1/4 instructions */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="md:col-span-3">
                  <YouTubeEmbed embedSrc={it.embedSrc} start={it.start} />
                </div>

                <div className="md:col-span-1 rounded-xl2 border border-border bg-white/5 p-4">
                  <div className="text-sm font-semibold">Instructions</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                    {it.instructions.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CollapsibleCard>
          ))}
        </div>
      </CollapsibleCard>

      {/* #Stratégie */}
      <CollapsibleCard title="#Stratégie" subtitle="Plans / executes / calls">
        <div className="grid gap-3">
          {mirageStrats.map((it) => (
            <CollapsibleCard key={it.title} title={it.title} subtitle={it.goal} className="bg-card/30">
              <div className="rounded-xl2 border border-border bg-white/5 p-4">
                <div className="text-sm font-semibold">Plan</div>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
                  {it.steps.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ol>
              </div>
            </CollapsibleCard>
          ))}
        </div>
      </CollapsibleCard>
    </div>
  );
}
