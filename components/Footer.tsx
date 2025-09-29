"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Particles from "react-tsparticles";
import type { Engine } from "tsparticles-engine";
import { loadSlim } from "tsparticles-slim";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faInstagram } from "@fortawesome/free-brands-svg-icons";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";

/**
 * Footer — versão otimizada
 * - Visual glass com borda gradiente e linha superior sutil
 * - Partículas leves (desativam com prefers-reduced-motion e quando a aba não está ativa)
 * - Acessível (aria-labels, foco visível)
 * - Responsivo e com melhor espaçamento
 */

export default function Footer() {
  const [allowParticles, setAllowParticles] = useState(true);
  const year = useMemo(() => new Date().getFullYear(), []);

  // Carrega engine slim (leve)
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  // Desativa partículas se o usuário prefere redução de movimento ou quando a aba/guia não está ativa
  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const onVis = () => {
      const hidden = document.visibilityState !== "visible";
      setAllowParticles(!reduce && !hidden);
    };

    setAllowParticles(!reduce && document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <footer
      role="contentinfo"
      className="relative w-full mt-6 rounded-2xl overflow-hidden
                 bg-white/60 dark:bg-neutral-900/70
                 backdrop-blur-md
                 ring-1 ring-black/10 dark:ring-white/10"
    >
      {/* linha superior sutil */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

      {/* glow/borda gradiente externa (decoração) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[1px] rounded-[18px]
                   bg-[radial-gradient(120px_60px_at_10%_-20%,rgba(16,185,129,0.25),transparent),
                       radial-gradient(120px_60px_at_90%_120%,rgba(59,130,246,0.18),transparent)]"
      />

      {/* partículas (opcionais e leves) */}
      {allowParticles && (
        <Particles
          id="footer-particles"
          init={particlesInit}
          className="absolute inset-0 -z-10"
          options={{
            fullScreen: false,
            background: { color: "transparent" },
            detectRetina: true,
            fpsLimit: 48,
            pauseOnBlur: true,
            particles: {
              number: { value: 18, density: { enable: true, area: 800 } },
              color: { value: ["#34d399", "#60a5fa"] }, // emerald / blue
              opacity: { value: 0.12 },
              size: { value: { min: 1, max: 2 } },
              links: {
                enable: true,
                color: "#60a5fa",
                opacity: 0.08,
                distance: 120,
                width: 1,
              },
              move: {
                enable: true,
                speed: 0.25,
                direction: "none",
                outModes: { default: "out" },
              },
            },
          }}
        />
      )}

      {/* conteúdo */}
      <div className="relative z-10 px-4 py-4 md:px-6 md:py-5">
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 justify-between">
          {/* ESQUERDA — Logomarca em badge */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 p-[2px] rounded-2xl
                            bg-gradient-to-tr from-emerald-500 via-emerald-400 to-sky-400
                            shadow-[0_10px_30px_-12px_rgba(16,185,129,0.45)]">
              <div className="h-full w-full rounded-[14px] bg-black/90 grid place-items-center">
                <img
                  src="https://etheriumtech.com.br/wp-content/uploads/2024/04/LOGO-BRANCO.png"
                  alt="Etheriumtech"
                  className="h-6 w-auto"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="hidden sm:block">
              <div className="text-sm font-semibold leading-tight">
                Etheriumtech
              </div>
              <div className="text-xs opacity-75 leading-tight">
                Infraestrutura • {year}
              </div>
            </div>
          </div>

          {/* CENTRO — Copyright + statuszinho */}
          <div className="text-center order-last md:order-none">
            <p className="text-xs md:text-sm opacity-85">
              © {year} Etheriumtech. Todos os direitos reservados.
            </p>
          </div>

          {/* DIREITA — Autor + Ações */}
          <div className="flex items-center gap-2">
            <span
              className="hidden sm:inline-block neon text-sm font-semibold whitespace-nowrap select-none
                         text-emerald-400"
              title="Autor do projeto"
            >
              Powered by Jeferson Rocha
            </span>

            {/* Links sociais: troque '#' pelos seus perfis */}
            <a
              href="#"
              aria-label="LinkedIn"
              className="h-9 w-9 grid place-items-center rounded-lg
                         bg-black/5 dark:bg-white/10
                         hover:bg-black/10 dark:hover:bg-white/20
                         focus-visible:ring-2 focus-visible:ring-emerald-400 outline-none"
              title="LinkedIn"
            >
              <FontAwesomeIcon icon={faLinkedin} className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="h-9 w-9 grid place-items-center rounded-lg
                         bg-black/5 dark:bg-white/10
                         hover:bg-black/10 dark:hover:bg-white/20
                         focus-visible:ring-2 focus-visible:ring-emerald-400 outline-none"
              title="Instagram"
            >
              <FontAwesomeIcon icon={faInstagram} className="h-4 w-4" />
            </a>
            <a
              href="https://etheriumtech.com.br"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Site Etheriumtech"
              className="h-9 w-9 grid place-items-center rounded-lg
                         bg-emerald-600 text-white hover:bg-emerald-500
                         focus-visible:ring-2 focus-visible:ring-emerald-400 outline-none"
              title="Visitar site"
            >
              <FontAwesomeIcon icon={faGlobe} className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* linha inferior sutil (separador) */}
        <div className="mt-3 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>
    </footer>
  );
}
