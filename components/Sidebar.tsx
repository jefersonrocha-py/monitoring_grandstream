"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@store/ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMap, faChartPie, faGear } from "@fortawesome/free-solid-svg-icons";
import { useEffect } from "react";

type ItemProps = {
  href: string;
  icon: any;
  label: string;
  open: boolean;
  active: boolean;
  onClick?: () => void;
};

function NavItem({ href, icon, label, open, active, onClick }: ItemProps) {
  return (
    <Link
      href={href}
      title={label}
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2 rounded-lg
        hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400
        ${active ? "bg-white/10" : ""}
      `}
      aria-current={active ? "page" : undefined}
    >
      <FontAwesomeIcon className="w-4 h-4 shrink-0" icon={icon} />
      {open && <span className="text-sm">{label}</span>}
      {!open && <span className="sr-only">{label}</span>}
    </Link>
  );
}

function Hamburger({
  open,
  onClick,
  title,
}: {
  open: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label="Alternar menu"
      aria-expanded={open}
      aria-controls="app-sidebar"
      title={title || "Menu"}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg
                 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
    >
      <span
        className={`absolute block h-[2px] w-5 bg-current transition-transform duration-200
          ${open ? "translate-y-0 rotate-45" : "-translate-y-1.5"}
        `}
      />
      <span
        className={`absolute block h-[2px] w-5 bg-current transition-opacity duration-200
          ${open ? "opacity-0" : "opacity-100"}
        `}
      />
      <span
        className={`absolute block h-[2px] w-5 bg-current transition-transform duration-200
          ${open ? "translate-y-0 -rotate-45" : "translate-y-1.5"}
        `}
      />
    </button>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  // Fechar off-canvas no ESC (mobile)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setSidebarOpen]);

  const links = [
    { href: "/", icon: faMap, label: "Mapa" },
    { href: "/dashboard", icon: faChartPie, label: "Dashboard" },
    { href: "/settings", icon: faGear, label: "Configurações" },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Backdrop mobile */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden transition-opacity
          ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        aria-hidden={!sidebarOpen}
      />

      {/* DESKTOP */}
      <aside
        id="app-sidebar"
        className={`
          fixed left-0 top-0 z-50 h-screen text-white
          transition-all duration-300 ease-out
          hidden md:flex flex-col
          ${sidebarOpen ? "md:w-64" : "md:w-16"}
        `}
        style={{
          background:
            "linear-gradient(180deg, rgba(41,107,104,1) 0%, rgba(58,60,57,1) 45%, rgba(8,255,184,0.35) 100%)",
        }}
      >
        {/* Cabeçalho com hambúrguer (desktop) */}
        <div className="p-3 flex items-center gap-2 border-b border-white/10 min-h-[56px]">
          <Hamburger
            open={sidebarOpen}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Expandir/Retrair"
          />
          {sidebarOpen ? (
            <>
              <img
                src="https://etheriumtech.com.br/wp-content/uploads/2024/04/LOGO-BRANCO.png"
                alt="Etheriumtech"
                className="h-6"
              />
              <span className="ml-auto text-xs opacity-80">v1.0.0</span>
            </>
          ) : (
            <div className="h-6 w-6 rounded-lg bg-white/15" aria-hidden />
          )}
        </div>

        {/* Navegação */}
        <nav className="p-2 space-y-1 overflow-y-auto">
          {links.map((l) => (
            <NavItem
              key={l.href}
              href={l.href}
              icon={l.icon}
              label={l.label}
              open={sidebarOpen}
              active={isActive(l.href)}
            />
          ))}
        </nav>
      </aside>

      {/* MOBILE (off-canvas com X) */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen w-72 text-white
          flex flex-col md:hidden transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          background:
            "linear-gradient(180deg, rgba(41,107,104,1) 0%, rgba(58,60,57,1) 45%, rgba(8,255,184,0.35) 100%)",
        }}
        aria-hidden={!sidebarOpen}
      >
        <div className="p-3 flex items-center gap-2 border-b border-white/10 min-h-[56px]">
          {/* Botão fechar (X) */}
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
            className="h-9 w-9 grid place-items-center rounded-lg bg-black/5 hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            title="Fechar menu"
          >
            <span className="relative block h-[2px] w-5 bg-current rotate-45 after:absolute after:inset-0 after:-rotate-90 after:bg-current" />
          </button>
          <img
            src="https://etheriumtech.com.br/wp-content/uploads/2024/04/LOGO-BRANCO.png"
            alt="Etheriumtech"
            className="h-6 ml-1"
          />
          <span className="ml-auto text-xs opacity-80">v1.0.0</span>
        </div>

        <nav className="p-2 space-y-1 overflow-y-auto">
          {links.map((l) => (
            <NavItem
              key={l.href}
              href={l.href}
              icon={l.icon}
              label={l.label}
              open={true}
              active={isActive(l.href)}
              onClick={() => setSidebarOpen(false)}
            />
          ))}
        </nav>
      </aside>

      {/* Empurrador do conteúdo no desktop */}
      <div
        aria-hidden
        className={`hidden md:block transition-[width] duration-300 ${
          sidebarOpen ? "w-64" : "w-16"
        }`}
      />
    </>
  );
}
