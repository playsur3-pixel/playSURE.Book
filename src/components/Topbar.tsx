import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

const MAPS = [
  { name: "Mirage", key: "mirage" },
  { name: "Inferno", key: "inferno" },
  { name: "Dust2", key: "dust2" },
  { name: "Nuke", key: "nuke" },
  { name: "Overpass", key: "overpass" },
  { name: "Ancient", key: "ancient" },
  { name: "Anubis", key: "anubis" },
];

function Dropdown({
  label,
  basePath,
}: {
  label: string;
  basePath: "/strats" | "/stuffs";
}) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className="rounded-xl px-3 py-1.5 text-sm transition text-muted hover:text-white hover:bg-white/5"
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-bg/90 backdrop-blur shadow-soft z-50">
          {MAPS.map((m) => (
            <button
              key={m.key}
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-white/90 hover:bg-white/10"
              onClick={() => {
                setOpen(false);
                nav(`${basePath}/${m.key}`);
              }}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Topbar({ username, onLogout }: { username: string; onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="font-semibold tracking-wide text-white">playSURE Book</span>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `rounded-xl px-3 py-1.5 text-sm transition ${
                isActive ? "bg-white/10 text-white" : "text-muted hover:text-white hover:bg-white/5"
              }`
            }
          >
            Accueil
          </NavLink>

          <Dropdown label="Strats" basePath="/strats" />
          <Dropdown label="Stuffs" basePath="/stuffs" />
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
