"use client";

import Particles from "react-tsparticles";
import type { Engine } from "tsparticles-engine";
import { loadSlim } from "tsparticles-slim";
import { useCallback } from "react";

/**
 * Partículas leves para telas de auth.
 * Importante:
 * - NÃO usar z-index negativo aqui; deixamos em z-0
 * - O wrapper (pai) deve ter `relative` e `isolate`
 * - O card principal fica com `z-10`
 */
export default function AuthParticles() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="auth-particles"
      init={particlesInit}
      className="absolute inset-0 z-0 pointer-events-none"
      options={{
        fullScreen: false, // controlamos via container
        background: { color: "transparent" },
        detectRetina: true,
        fpsLimit: 60,
        particles: {
          number: { value: 45, density: { enable: true, area: 900 } },
          color: { value: "#08FFB8" },
          opacity: { value: 0.18 },
          size: { value: { min: 1, max: 2 } },
          links: {
            enable: true,
            color: "#08FFB8",
            opacity: 0.08,
            distance: 140,
            width: 1,
          },
          move: { enable: true, speed: 0.35, outModes: { default: "out" } },
        },
        interactivity: {
          events: { resize: true },
        },
      }}
    />
  );
}
