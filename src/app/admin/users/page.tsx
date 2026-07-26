"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { readApiError } from "@/lib/errors";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { FormError } from "@/components/field";
import { Pager } from "@/components/pager";
import { UserForm, type Role, type UserValues } from "@/components/user-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
  interests: string[];
}

interface InterestGroup {
  interest: string;
  count: number;
}

const PAGE_SIZE = 10;

function toInterests(value: string) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AdminUsersPage() {
  const { token, user, ready } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [groups, setGroups] = useState<InterestGroup[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    try {
      const [list, grouped] = await Promise.all([
        api.get(`/users?page=${page}&limit=${PAGE_SIZE}`),
        api.get(`/users/grouped-by-interests`),
      ]);
      setError("");
      setUsers(list.data.data);
      setMeta(list.data.meta);
      setGroups(grouped.data.groups);
    } catch (err) {
      const { message } = readApiError(err, "Could not load users.");
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (!ready || !token || user?.role !== "admin") return;
    // load() awaits the requests before it touches state, so nothing is set
    // synchronously here; the rule cannot see past the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [ready, token, user, load]);

  async function create(values: UserValues) {
    await api.post("/users", {
      name: values.name,
      email: values.email,
      password: values.password,
      role: values.role,
      interests: toInterests(values.interests),
    });
    await load();
  }

  async function update(id: string, values: UserValues) {
    // The server rejects a password on update, so it is never sent here.
    await api.patch(`/users/${id}`, {
      name: values.name,
      email: values.email,
      role: values.role,
      interests: toInterests(values.interests),
    });
    await load();
  }

  async function remove(id: string) {
    try {
      await api.delete(`/users/${id}`);
      if (users.length === 1 && page > 1) setPage((p) => p - 1);
      else await load();
    } catch (err) {
      const { message } = readApiError(err, "Could not delete the user.");
      setError(message);
    }
  }

  return (
    <AppShell
      title="Users"
      description="Everyone with an account, and what they said they're into."
      requireAdmin
      action={
        <Button onClick={() => setCreating(true)}>
          <Plus data-icon="inline-start" />
          Add user
        </Button>
      }
    >
      <div className="space-y-6">
        {error && <FormError message={error} />}

        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <Card className="py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Interests</TableHead>
                    <TableHead className="w-0" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.interests?.length ? u.interests.join(", ") : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${u.name}`}
                            onClick={() => setEditing(u)}
                          >
                            <Pencil />
                          </Button>
                          {/* The server refuses self-deletion; don't offer it. */}
                          {u._id !== user?.id && (
                            <ConfirmDelete
                              title="Delete this user?"
                              description={`${u.name} (${u.email}) will lose access immediately.`}
                              confirmLabel="Delete user"
                              onConfirm={() => remove(u._id)}
                            >
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Delete ${u.name}`}
                              >
                                <Trash2 />
                              </Button>
                            </ConfirmDelete>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Pager
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              unit="users"
              onChange={setPage}
            />

            <Card>
              <CardHeader>
                <CardTitle>Interests</CardTitle>
              </CardHeader>
              <CardContent>
                {groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No one has listed an interest yet.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {groups.map((g) => (
                      <li
                        key={g.interest}
                        className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0"
                      >
                        <span>{g.interest}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {g.count} {g.count === 1 ? "person" : "people"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {creating && (
        <UserForm
          open
          onOpenChange={(open) => !open && setCreating(false)}
          onSave={create}
        />
      )}

      {editing && (
        <UserForm
          key={editing._id}
          open
          onOpenChange={(open) => !open && setEditing(null)}
          initial={{
            name: editing.name,
            email: editing.email,
            role: editing.role,
            interests: editing.interests?.join(", ") ?? "",
          }}
          onSave={(values) => update(editing._id, values)}
        />
      )}
    </AppShell>
  );
}
