"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Note { _id: string; title: string; content: string; }

export default function NotesPage() {
  const { token, user, ready, logout } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [form, setForm] = useState({ title: "", content: "" });
  const [page, setPage] = useState(1);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const { data } = await api.get(`/notes?page=${page}&limit=5`);
    setNotes(data.data);
    setMeta(data.meta);
  }, [page]);

  useEffect(() => {
    if (!ready) return;
    if (!token) { router.replace("/login"); return; }
    load();
  }, [ready, token, load, router]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await api.post("/notes", form);
      setForm({ title: "", content: "" });
      load();
    } catch {
      setErr("Failed to add note");
    }
  }
  async function remove(id: string) {
    setErr("");
    try {
      await api.delete(`/notes/${id}`);
      // stepping back a page avoids stranding the user on a now-empty page
      if (notes.length === 1 && page > 1) setPage((p) => p - 1);
      else load();
    } catch {
      setErr("Failed to delete note");
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">My Notes ({user?.name})</h1>
        <div className="flex gap-2">
          {user?.role === "admin" && <Button variant="outline" onClick={() => router.push("/admin/users")}>Admin</Button>}
          <Button variant="outline" onClick={() => { logout(); router.replace("/login"); }}>Logout</Button>
        </div>
      </div>
      <form onSubmit={create} className="flex flex-col gap-2 border p-3 rounded">
        <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input placeholder="Content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <Button type="submit">Add note</Button>
        {err && <p className="text-red-500 text-sm">{err}</p>}
      </form>
      <ul className="flex flex-col gap-2">
        {notes.map((n) => (
          <li key={n._id} className="border p-2 rounded flex justify-between">
            <span><b>{n.title}</b> — {n.content}</span>
            <Button variant="destructive" size="sm" onClick={() => remove(n._id)}>Delete</Button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2 items-center">
        <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
        <span>Page {meta.page} / {meta.totalPages}</span>
        <Button size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
    </div>
  );
}
