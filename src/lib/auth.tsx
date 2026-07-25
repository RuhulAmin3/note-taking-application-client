"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";

interface User { id: string; name: string; email: string; role: "user" | "admin"; }
interface AuthCtx {
  user: User | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, interests: string[]) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (t) setToken(t);
    if (u) setUser(JSON.parse(u));
    setReady(true);
  }, []);

  function persist(t: string, u: User) {
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
    setToken(t);
    setUser(u);
  }

  async function login(email: string, password: string) {
    const { data } = await api.post("/auth/login", { email, password });
    persist(data.token, data.user);
  }
  async function register(name: string, email: string, password: string, interests: string[]) {
    const { data } = await api.post("/auth/register", { name, email, password, interests });
    persist(data.token, data.user);
  }
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }

  return <Ctx.Provider value={{ user, token, ready, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
