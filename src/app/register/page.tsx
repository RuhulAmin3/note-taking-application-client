"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "", interests: "" });
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const interests = f.interests.split(",").map((s) => s.trim()).filter(Boolean);
      await register(f.name, f.email, f.password, interests);
      router.push("/notes");
    } catch {
      setError("Registration failed");
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto mt-20 flex flex-col gap-3">
      <h1 className="text-xl font-bold">Register</h1>
      <Input placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <Input placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <Input type="password" placeholder="Password (min 8)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      <Input placeholder="Interests (comma separated)" value={f.interests} onChange={(e) => setF({ ...f, interests: e.target.value })} />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button type="submit">Register</Button>
      <a href="/login" className="text-sm underline">Have an account? Login</a>
    </form>
  );
}
