"use client";

import Particles from "react-tsparticles";
import type { Engine } from "tsparticles-engine";
import { loadSlim } from "tsparticles-slim";
import { useCallback } from "react";

export default function AuthParticles() {
  const init = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="auth-particles"
      init={init}
      className="absolute inset-0 -z-10"
      options={{
        fullScreen: false,
        background: { color: "transparent" },
        detectRetina: true,
        fpsLimit: 60,
        particles: {
          number: { value: 65, density: { enable: true, area: 800 } },
          size: { value: { min: 1, max: 3 } },
          move: { enable: true, speed: 0.55, outModes: { default: "out" } },
          opacity: { value: 0.22 },
          shape: { type: "circle" },
          // gradiente “fake”: escolhe aleatório entre verdes
          color: { value: ["#22c55e", "#10b981", "#86efac"] },
          links: {
            enable: true,
            color: "#22c55e",
            distance: 140,
            opacity: 0.12,
            width: 1,
          },
        },
      }}
    />
  );
}
