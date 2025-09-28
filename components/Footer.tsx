"use client";

import Particles from "react-tsparticles";
import type { Engine } from "tsparticles-engine";
import { loadSlim } from "tsparticles-slim"; // ✅ loader leve e compatível v2.x
import { useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faInstagram } from "@fortawesome/free-brands-svg-icons";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";

export default function Footer() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <footer className="relative w-full mt-4 glass overflow-hidden rounded-2xl">
      {/* Partículas azuis bem leves no background */}
      <Particles
        id="footer-particles"
        init={particlesInit}
        className="absolute inset-0 -z-10"
        options={{
          fullScreen: false,
          background: { color: "transparent" },
          detectRetina: true,
          fpsLimit: 60,
          particles: {
            number: { value: 28, density: { enable: true, area: 800 } },
            color: { value: "#60a5fa" },
            opacity: { value: 0.12 },
            size: { value: { min: 1, max: 2 } },
            links: { enable: true, color: "#60a5fa", opacity: 0.08, distance: 120, width: 1 },
            move: { enable: true, speed: 0.3, outModes: { default: "out" } }
          }
        }}
      />

      {/* Conteúdo */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 items-center gap-3 px-4 py-4">
        {/* ESQUERDA — Logo melhorada (badge com gradiente/borda/sombra) */}
        <div className="flex items-center gap-3 justify-center md:justify-start">
          <div className="h-10 w-10 p-[2px] rounded-2xl bg-gradient-to-tr from-brand3 via-brand1 to-brand2 shadow-soft">
            <div className="h-full w-full rounded-[14px] bg-black/90 grid place-items-center">
              <img
                src="https://etheriumtech.com.br/wp-content/uploads/2024/04/LOGO-BRANCO.png"
                alt="Etheriumtech"
                className="h-6 w-auto drop-shadow"
              />
            </div>
          </div>
        </div>

        {/* CENTRO — Texto centralizado */}
        <div className="text-center">
          <span className="text-sm md:text-base font-medium">
            Infraestrutura Etheriumtech 2025
          </span>
        </div>

        {/* DIREITA — Neon + Ícones (LinkedIn/Instagram sem link, Site com link e só ícone) */}
        <div className="flex items-center justify-center md:justify-end gap-3">
          <span className="neon text-sm font-semibold whitespace-nowrap select-none">
            Powered by Jeferson Rocha
          </span>

          <a
            href="#"
            aria-label="LinkedIn"
            className="h-9 w-9 grid place-items-center rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
            title="LinkedIn"
          >
            <FontAwesomeIcon icon={faLinkedin} className="h-4 w-4" />
          </a>

          <a
            href="#"
            aria-label="Instagram"
            className="h-9 w-9 grid place-items-center rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20"
            title="Instagram"
          >
            <FontAwesomeIcon icon={faInstagram} className="h-4 w-4" />
          </a>

          <a
            href="https://etheriumtech.com.br"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Site Etheriumtech"
            className="h-9 w-9 grid place-items-center rounded-lg bg-brand1 text-white hover:opacity-90"
            title="Visitar site"
          >
            <FontAwesomeIcon icon={faGlobe} className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
