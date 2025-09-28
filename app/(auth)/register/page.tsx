"use client";

import { useState } from "react";
import AuthParticles from "@components/AuthParticles";
import AuthInput from "@components/AuthInput";
import PasswordInput from "@components/PasswordInput";
import { faEnvelope, faUser } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import Link from "next/link";
import { api } from "@services/api";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);

    try {
      if (password !== confirm) {
        setErr("As senhas não conferem.");
        return;
      }

      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      router.push("/login?registered=1");
    } catch (er: any) {
      const m = String(er?.message || "");
      if (m.includes("UNIQUE_CONSTRAINT")) setErr("Já existe um usuário com esse e-mail.");
      else if (m.includes("VALIDATION_FAILED")) setErr("Dados inválidos.");
      else setErr("Não foi possível criar sua conta agora.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <AuthParticles />

      {/* Auras */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-emerald-400/35 via-emerald-600/25 to-transparent blur-3xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-16 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-300/25 via-emerald-500/20 to-transparent blur-3xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, delay: 0.1 }}
      />

      {/* Card */}
      <motion.div
        className="relative glass rounded-3xl p-7 md:p-9 w-full ring-1 ring-emerald-400/10 hover:ring-emerald-400/25 transition-shadow shadow-[0_10px_40px_-20px_rgba(16,185,129,0.45)]"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 18 }}
      >
        <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

        {/* Cabeçalho com emoji 📶 */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="h-10 w-10 rounded-xl grid place-items-center ring-1 ring-emerald-400/30 text-2xl select-none
                       bg-gradient-to-br from-emerald-500/20 via-emerald-400/10 to-transparent"
            aria-label="Ícone de roteador"
            title="Roteador"
          >
            📶
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="text-white">Criar conta</span>
          </h1>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <AuthInput
            icon={faUser}
            placeholder="Nome"
            value={name}
            onChange={setName}
            name="name"
            autoComplete="name"
          />
          <AuthInput
            icon={faEnvelope}
            placeholder="Email"
            value={email}
            onChange={setEmail}
            name="email"
            autoComplete="email"
          />
          <PasswordInput
            placeholder="Senha"
            value={password}
            onChange={setPassword}
            name="password"
            autoComplete="new-password"
          />
          <PasswordInput
            placeholder="Confirmar senha"
            value={confirm}
            onChange={setConfirm}
            name="confirm"
            autoComplete="new-password"
          />

          {err && (
            <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded p-2">
              {err}
            </div>
          )}

          <button
            className="btn-shine w-full py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            disabled={busy}
          >
            {busy ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <div className="text-xs opacity-80 mt-4 text-center">
          Já tem conta?{" "}
          <Link href="/login" className="underline decoration-emerald-400/70 hover:decoration-emerald-400">
            Entrar
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
