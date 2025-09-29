"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@services/api";
import AuthParticles from "@components/AuthParticles";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faTowerBroadcast } from "@fortawesome/free-solid-svg-icons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const sp = useSearchParams();
  const router = useRouter();
  const justRegistered = useMemo(() => sp.get("registered") === "1", [sp]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.push("/");
    } catch (er: any) {
      const m = String(er?.message || "");
      if (m.includes("INVALID_CREDENTIALS")) setErr("Credenciais inválidas.");
      else setErr("Não foi possível entrar agora.");
    } finally {
      setBusy(false);
    }
  }

  return (
    // 🔑 Wrapper: relative + isolate + altura para o canvas aparecer
    <div className="relative isolate w-full max-w-2xl mx-auto min-h-[70vh] py-12">
      {/* Fundo com partículas (fica em z-0) */}
      <AuthParticles />

      {/* “Auras” */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-emerald-400/35 via-emerald-600/25 to-transparent blur-3xl z-0"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-16 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-300/25 via-emerald-500/20 to-transparent blur-3xl z-0"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, delay: 0.1 }}
      />

      {/* CARD (ficará acima das partículas) */}
      <motion.div
        className="relative z-10 overflow-hidden rounded-3xl shadow-[0_10px_45px_-18px_rgba(16,185,129,0.5)] ring-1 ring-white/10"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 18 }}
      >
        {/* Header: ícone + título + logo à direita */}
        <div className="relative px-6 sm:px-10 py-6 bg-gradient-to-b from-emerald-300/90 via-emerald-400/80 to-emerald-500/60 backdrop-blur">
          <div className="flex items-center gap-3 justify-between">
            <div className="inline-flex items-center gap-3">
              <span className="grid place-items-center h-10 w-10 rounded-xl bg-white/70 text-emerald-700 shadow">
                <FontAwesomeIcon icon={faTowerBroadcast} className="h-5 w-5" />
              </span>
              <h1 className="text-xl sm:text-2xl tracking-wide font-semibold text-black/90">
                Stats A.P.
              </h1>
            </div>
            <img
              src="https://etheriumtech.com.br/wp-content/uploads/2024/04/LOGO-BRANCO.png"
              alt="Etheriumtech"
              className="h-8 w-auto drop-shadow"
            />
          </div>
        </div>

        {/* Corpo */}
        <div className="glass rounded-b-3xl px-6 sm:px-10 py-8">
          {justRegistered && (
            <motion.div
              className="mb-4 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 rounded p-2"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Conta criada com sucesso! Faça login para continuar.
            </motion.div>
          )}

          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="block">
              <span className="sr-only">Email</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-80">
                  <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="Username / Email"
                  className="w-full pl-9 pr-3 h-11 rounded-xl bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-emerald-400 outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="sr-only">Senha</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-80">
                  <FontAwesomeIcon icon={faLock} className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  className="w-full pl-9 pr-3 h-11 rounded-xl bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-emerald-400 outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </label>

            {err && (
              <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded p-2">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-shine w-full h-11 rounded-xl bg-white text-neutral-900 hover:bg-white/95 active:scale-[.995] transition shadow-soft"
            >
              {busy ? "Entrando..." : "LOGIN"}
            </button>

            <div className="text-center text-xs opacity-80">
              Esqueceu a senha?{" "}
              <a href="#" className="underline decoration-emerald-400/70 hover:decoration-emerald-400">
                Clique aqui
              </a>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-1" />

            <Link
              href="/register"
              className="inline-flex items-center justify-center w-full h-11 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 transition"
            >
              REGISTER
            </Link>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
