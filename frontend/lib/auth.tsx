"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Autenticación Web2 de la demo (RF-A01, lado tradicional email/contraseña).
 *
 * IMPORTANTE: es una implementación DE DEMO. Los usuarios se guardan en el
 * localStorage del navegador, no en un backend. La contraseña se ofusca con
 * base64 (NO es seguro: en producción iría hasheada en el servidor con bcrypt
 * + Account Abstraction, según el PRD). Sirve para mostrar el flujo de
 * registro / login / sesión sin montar infraestructura.
 *
 * El login Web2 identifica al usuario; la wallet (Web3) sigue siendo necesaria
 * para firmar transacciones on-chain. Juntos cubren la "autenticación híbrida".
 */

export type Role = "cliente" | "proveedor" | "agente";

export type SessionUser = {
  name: string;
  email: string;
  role: Role;
};

type StoredUser = SessionUser & { password: string; createdAt: number };

type Result = { ok: true } | { ok: false; error: string };

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  register: (data: { name: string; email: string; password: string; role: Role }) => Result;
  login: (email: string, password: string) => Result;
  logout: () => void;
};

const USERS_KEY = "otc_users";
const SESSION_KEY = "otc_session";

const AuthContext = createContext<AuthContextValue | null>(null);

function readUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/** Ofuscación mínima de demo (NO es seguridad real). */
const obfuscate = (s: string) => (typeof window === "undefined" ? s : btoa(unescape(encodeURIComponent(s))));

/**
 * Cuentas pre-cargadas para la demo/presentación. Se siembran al abrir la app
 * (si no existen) así no hay que registrarse en vivo. Credenciales fijas y
 * conocidas. admin1 queda como "usuario general" (cliente).
 */
const DEMO_ACCOUNTS: { name: string; email: string; password: string; role: Role }[] = [
  { name: "Admin Uno", email: "admin1@otc.com", password: "admin123", role: "cliente" },
  { name: "Usuario Demo", email: "usuario@otc.com", password: "usuario123", role: "cliente" },
  { name: "Creador de Actividades", email: "creador@otc.com", password: "creador123", role: "proveedor" },
];

/**
 * Asegura que existan las cuentas de demo. Si una ya existe, NO le pisa la
 * contraseña (respeta la que el usuario haya puesto), solo corrige el rol.
 */
function seedDemoAccounts() {
  const users = readUsers();
  let changed = false;
  for (const d of DEMO_ACCOUNTS) {
    const existing = users.find((u) => u.email === d.email);
    if (existing) {
      if (existing.role !== d.role) {
        existing.role = d.role;
        changed = true;
      }
    } else {
      users.push({
        name: d.name,
        email: d.email,
        password: obfuscate(d.password),
        role: d.role,
        createdAt: 0,
      });
      changed = true;
    }
  }
  if (changed) writeUsers(users);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sesión al cargar (y sembrar las cuentas de demo).
  useEffect(() => {
    try {
      seedDemoAccounts();
      const email = localStorage.getItem(SESSION_KEY);
      if (email) {
        const u = readUsers().find((x) => x.email === email);
        if (u) setUser({ name: u.name, email: u.email, role: u.role });
      }
    } catch {
      /* sin sesión */
    }
    setLoading(false);
  }, []);

  function register(data: { name: string; email: string; password: string; role: Role }): Result {
    const email = data.email.trim().toLowerCase();
    if (!data.name.trim()) return { ok: false, error: "Ingresá tu nombre." };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Email inválido." };
    if (data.password.length < 6) return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };

    const users = readUsers();
    if (users.some((u) => u.email === email)) {
      return { ok: false, error: "Ya existe una cuenta con ese email." };
    }

    const nuevo: StoredUser = {
      name: data.name.trim(),
      email,
      password: obfuscate(data.password),
      role: data.role,
      createdAt: Date.now(),
    };
    writeUsers([...users, nuevo]);
    localStorage.setItem(SESSION_KEY, email);
    setUser({ name: nuevo.name, email: nuevo.email, role: nuevo.role });
    return { ok: true };
  }

  function login(emailRaw: string, password: string): Result {
    const email = emailRaw.trim().toLowerCase();
    const u = readUsers().find((x) => x.email === email);
    if (!u || u.password !== obfuscate(password)) {
      return { ok: false, error: "Email o contraseña incorrectos." };
    }
    localStorage.setItem(SESSION_KEY, email);
    setUser({ name: u.name, email: u.email, role: u.role });
    return { ok: true };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

export const ROLE_LABELS: Record<Role, string> = {
  cliente: "Cliente / Viajero",
  proveedor: "Proveedor (hotel, bodega, aventura)",
  agente: "Agente de viajes",
};
