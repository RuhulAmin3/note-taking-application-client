"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Post { _id: string; title: string; content: string; author: { name: string; email: string }; }

export default function PostsPage() {
  const { token, user, ready } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState({ title: "", content: "" });

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await api.get(`/posts/user/${user.id}?page=1&limit=20`);
    setPosts(data.data);
  }, [user]);

  useEffect(() => {
    if (!ready) return;
    if (!token) { router.replace("/login"); return; }
    load();
  }, [ready, token, load, router]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/posts", form);
    setForm({ title: "", content: "" });
    load();
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 flex flex-col gap-4">
      <h1 className="text-xl font-bold">My Posts</h1>
      <form onSubmit={create} className="flex flex-col gap-2 border p-3 rounded">
        <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input placeholder="Content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <Button type="submit">Add post</Button>
      </form>
      <ul className="flex flex-col gap-2">
        {posts.map((p) => (
          <li key={p._id} className="border p-2 rounded"><b>{p.title}</b> — {p.content} <span className="text-xs text-gray-500">by {p.author?.name}</span></li>
        ))}
      </ul>
    </div>
  );
}
