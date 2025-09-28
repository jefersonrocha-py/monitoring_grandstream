"use client";

import Link from "next/link";
import { useUIStore } from "@store/ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faChevronLeft, faChevronRight, faMap, faChartPie, faGear } from "@fortawesome/free-solid-svg-icons";

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  const Item = ({ href, icon, label }: { href: string; icon: any; label: string }) => (
    <Link
      href={href}
      className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10"
      title={label}
    >
      <FontAwesomeIcon icon={icon} className="w-4 h-4 shrink-0" />
      {sidebarOpen && <span className="text-sm">{label}</span>}
    </Link>
  );

  return (
    <aside
      className={`text-white transition-all duration-300 ${
        sidebarOpen ? "w-64" : "w-16"
      } h-screen fixed left-0 top-0 flex flex-col`}
      style={{
        background:
          "linear-gradient(180deg, rgba(41,107,104,1) 0%, rgba(58,60,57,1) 45%, rgba(8,255,184,0.35) 100%)"
      }}
    >
      <div className="p-3 flex items-center gap-2 border-b border-white/10">
        <button
          className="rounded bg-white/10 px-2 py-1 hover:bg-white/20"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title="Expandir/Retrair"
        >
          <FontAwesomeIcon icon={sidebarOpen ? faChevronLeft : faChevronRight} />
        </button>
        {sidebarOpen && (
          <>
            <img
              src="https://etheriumtech.com.br/wp-content/uploads/2024/04/LOGO-BRANCO.png"
              alt="Etheriumtech"
              className="h-6 ml-2"
            />
            <span className="ml-auto text-xs opacity-70">v1.0.0</span>
          </>
        )}
      </div>

      <nav className="p-2 space-y-1">
        <Item href="/" icon={faMap} label="Mapa" />
        <Item href="/dashboard" icon={faChartPie} label="Dashboard" />
        <Item href="/settings" icon={faGear} label="Configurações" />
      </nav>

      {!sidebarOpen && (
        <div className="mt-auto p-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-full rounded bg-white/10 p-2 hover:bg-white/20"
            title="Abrir menu"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        </div>
      )}
    </aside>
  );
}
