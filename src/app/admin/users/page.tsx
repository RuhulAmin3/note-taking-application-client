"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

interface U { _id: string; name: string; email: string; role: string; interests: string[]; }
interface Group { interest: string; count: number; }

export default function AdminUsersPage() {
  const { token, user, ready } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<U[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });

  const load = useCallback(async () => {
    const [u, g] = await Promise.all([
      api.get(`/users?page=${page}&limit=10`),
      api.get(`/users/grouped-by-interests`),
    ]);
    setUsers(u.data.data);
    setMeta(u.data.meta);
    setGroups(g.data.groups);
  }, [page]);

  useEffect(() => {
    if (!ready) return;
    if (!token) { router.replace("/login"); return; }
    if (user && user.role !== "admin") { router.replace("/notes"); return; }
    load();
  }, [ready, token, user, load, router]);

  async function remove(id: string) {
    await api.delete(`/users/${id}`);
    if (users.length === 1 && page > 1) setPage((p) => p - 1);
    else load();
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 flex flex-col gap-4">
      <div className="flex justify-between">
        <h1 className="text-xl font-bold">Admin — Users</h1>
        <Button variant="outline" onClick={() => router.push("/notes")}>Back</Button>
      </div>
      <table className="w-full border">
        <thead><tr className="border-b"><th className="text-left p-2">Name</th><th className="text-left p-2">Email</th><th className="text-left p-2">Role</th><th className="text-left p-2">Interests</th><th></th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id} className="border-b">
              <td className="p-2">{u.name}</td><td className="p-2">{u.email}</td>
              <td className="p-2">{u.role}</td><td className="p-2">{u.interests?.join(", ")}</td>
              <td className="p-2">
                {u._id !== user?.id && (
                  <Button size="sm" variant="destructive" onClick={() => remove(u._id)}>Delete</Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 items-center">
        <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
        <span>Page {meta.page} / {meta.totalPages}</span>
        <Button size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
      <h2 className="text-lg font-bold mt-4">Users grouped by interest</h2>
      <ul>{groups.map((g) => <li key={g.interest}>{g.interest}: {g.count}</li>)}</ul>
    </div>
  );
}
