"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faLock } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";

export default function PasswordInput({
  placeholder,
  value,
  onChange,
  name,
  autoComplete
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  name?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <motion.label
      className="block"
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 250, damping: 22 }}
    >
      <div className="relative">
        <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 h-4 w-4" />
        <input
          className="w-full pl-9 pr-10 py-3 rounded-xl bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:ring-2 focus:ring-brand3 outline-none"
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          name={name}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          required
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        >
          <FontAwesomeIcon icon={show ? faEyeSlash : faEye} className="h-4 w-4" />
        </button>
      </div>
    </motion.label>
  );
}
