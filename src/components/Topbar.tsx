import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { MAPS } from "@/config/maps";


function Dropdown({
  name,
  basePath,
}: {
  name: string;
  basePath: "/strats" | "/stuffs";
}) {
  const navigate = useNavigate();

  return (
    <div className="relative group">
      {/* Bouton */}
      <button
        type="button"
        className="px-3 py-2 rounded-lg hover:bg-white/5 text-sm"
      >
        {name}
      </button>

      {/* Zone tampon invisible pour éviter le “gap” */}
      <div className="absolute left-0 top-full h-3 w-52 hidden group-hover:block" />

      {/* Menu */}
      <div
        className="
          absolute left-0 top-full pt-2
          hidden group-hover:block
          z-50
        "
      >
        <div className="w-44 rounded-xl border border-white/10 bg-black/80 backdrop-blur shadow-soft overflow-hidden">
          {MAPS.map((m) => (
            <button
              key={m.key}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-white/10"
              onClick={() => navigate(`${basePath}/${m.key}`)}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>
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

          <Dropdown name="Strats" basePath="/strats" />
          <Dropdown name="Stuffs" basePath="/stuffs" />
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
