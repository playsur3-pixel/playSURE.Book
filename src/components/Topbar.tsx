import { NavLink } from "react-router-dom";

const maps = [
  { name: "Mirage", path: "/maps/mirage" },
  { name: "Dust2", path: "/maps/dust2" },
  { name: "Inferno", path: "/maps/inferno" },
  { name: "Nuke", path: "/maps/nuke" },
  { name: "Overpass", path: "/maps/overpass" },
  { name: "Ancient", path: "/maps/ancient" },
  { name: "Anubis", path: "/maps/anubis" },
];

export function Topbar({ username, onLogout }: { username: string; onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="font-semibold tracking-wide text-white">playSURE Book</span>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {maps.map((m) => (
            <NavLink
              key={m.path}
              to={m.path}
              className={({ isActive }) =>
                `rounded-xl px-3 py-1.5 text-sm transition
                 ${isActive ? "bg-white/10 text-white" : "text-muted hover:text-white hover:bg-white/5"}`
              }
            >
              {m.name}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted sm:block">@{username}</span>
          <button
            onClick={onLogout}
            className="rounded-xl bg-white/5 px-3 py-1.5 text-sm text-white hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
