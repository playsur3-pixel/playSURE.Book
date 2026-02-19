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

function NavLinks({ compact = false }: { compact?: boolean }) {
  const base = compact ? "px-2.5 py-1 text-sm" : "px-3 py-1.5 text-sm";

  return (
    <>
      <NavLink
        to="/"
        className={({ isActive }) =>
          `rounded-xl ${base} transition
          ${isActive ? "bg-white/10 text-white" : "text-muted hover:text-white hover:bg-white/5"}`
        }
      >
        Accueil
      </NavLink>

      {maps.map((m) => (
        <NavLink
          key={m.path}
          to={m.path}
          className={({ isActive }) =>
            `rounded-xl ${base} transition
            ${isActive ? "bg-white/10 text-white" : "text-muted hover:text-white hover:bg-white/5"}`
          }
        >
          {m.name}
        </NavLink>
      ))}
    </>
  );
}

export function Topbar({ username, onLogout }: { username: string; onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/70 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4">
        {/* Row 1 */}
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="font-semibold tracking-wide text-white">playSURE Book</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            <NavLinks />
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

        {/* Mobile nav */}
        <nav
          className="md:hidden flex items-center gap-1 overflow-x-auto whitespace-nowrap pb-3
                     [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <NavLinks compact />
        </nav>
      </div>
    </header>
  );
}
