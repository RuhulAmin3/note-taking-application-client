"use client";

import { useCallback, useEffect, useState } from "react";
import { NotebookPen, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { readApiError, type FieldErrors } from "@/lib/errors";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { EmptyState } from "@/components/empty-state";
import { EntryCard, OwnerSection, formatDate, groupByOwner } from "@/components/entry-card";
import { EntryEditor } from "@/components/entry-editor";
import { Field, FormError } from "@/components/field";
import { Pager } from "@/components/pager";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

interface Owner {
  _id: string;
  name: string;
  email: string;
}

interface Note {
  _id: string;
  title: string;
  content: string;
  createdAt?: string;
  owner?: Owner;
}

const PAGE_SIZE = 5;

export default function NotesPage() {
  const { token, user, ready } = useAuth();
  const isAdmin = user?.role === "admin";

  const [notes, setNotes] = useState<Note[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ title: "", content: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [editing, setEditing] = useState<Note | null>(null);

  function edit(patch: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...patch }));
    setErrors({});
  }

  const load = useCallback(async () => {
    try {
      // Admins oversee everyone's notes; everyone else sees only their own.
      const path = isAdmin ? "/notes/all" : "/notes";
      const { data } = await api.get(`${path}?page=${page}&limit=${PAGE_SIZE}`);
      setListError("");
      setNotes(data.data);
      setMeta(data.meta);
    } catch (err) {
      const { message } = readApiError(err, "Could not load notes.");
      setListError(message);
    } finally {
      setLoading(false);
    }
  }, [page, isAdmin]);

  useEffect(() => {
    if (!ready || !token) return;
    // load() awaits the request before it touches state, so nothing is set
    // synchronously here; the rule cannot see past the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [ready, token, load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!form.title.trim()) {
      setErrors({ title: "Give the note a title." });
      return;
    }
    setErrors({});

    setPending(true);
    try {
      await api.post("/notes", { ...form, title: form.title.trim() });
      setForm({ title: "", content: "" });
      await load();
    } catch (err) {
      const { message, fieldErrors } = readApiError(err, "Could not save the note.");
      setErrors(fieldErrors);
      setFormError(message);
    } finally {
      setPending(false);
    }
  }

  async function save(id: string, values: { title: string; content: string }) {
    await api.patch(`/notes/${id}`, values);
    await load();
  }

  async function remove(id: string) {
    try {
      await api.delete(`/notes/${id}`);
      // Deleting the last note on a page would otherwise strand the reader on
      // an empty one.
      if (notes.length === 1 && page > 1) setPage((p) => p - 1);
      else await load();
    } catch (err) {
      const { message } = readApiError(err, "Could not delete the note.");
      setListError(message);
    }
  }

  function actionsFor(note: Note) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${note.title}`}
          onClick={() => setEditing(note)}
        >
          <Pencil />
        </Button>
        <ConfirmDelete
          title="Delete this note?"
          description={`"${note.title}" will be removed for good.`}
          confirmLabel="Delete note"
          onConfirm={() => remove(note._id)}
        >
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${note.title}`}>
            <Trash2 />
          </Button>
        </ConfirmDelete>
      </>
    );
  }

  const description = isAdmin
    ? meta.total > 0
      ? `${meta.total} ${meta.total === 1 ? "note" : "notes"} across every account`
      : "Notes from every account will appear here."
    : meta.total > 0
      ? `${meta.total} ${meta.total === 1 ? "note" : "notes"}`
      : "Everything you write here stays private to your account.";

  return (
    <AppShell title={isAdmin ? "All notes" : "Notes"} description={description}>
      <div className="space-y-6">
        {/* Admins read; they don't write on someone else's behalf. */}
        {!isAdmin && (
          <Card>
            <CardContent>
              <form onSubmit={create} noValidate className="space-y-2">
                <Field id="title" label="Title" error={errors.title}>
                  <Input
                    id="title"
                    value={form.title}
                    aria-invalid={!!errors.title}
                    placeholder="What is this about?"
                    onChange={(e) => edit({ title: e.target.value })}
                  />
                </Field>
                <Field id="content" label="Note" hint="optional" error={errors.content}>
                  <Textarea
                    id="content"
                    rows={3}
                    value={form.content}
                    aria-invalid={!!errors.content}
                    placeholder="Write it down before it goes."
                    onChange={(e) => edit({ content: e.target.value })}
                  />
                </Field>
                <FormError message={formError} />
                <div className="flex justify-end">
                  <Button type="submit" disabled={pending}>
                    {pending ? "Saving…" : "Save note"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {listError && <FormError message={listError} />}

        {loading ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : notes.length === 0 ? (
          <EmptyState
            icon={<NotebookPen />}
            title="No notes yet"
            hint={
              isAdmin
                ? "Nobody has written one so far."
                : "Write your first one using the form above."
            }
          />
        ) : isAdmin ? (
          <div className="space-y-8">
            {groupByOwner(notes, (n) => n.owner).map((group) => (
              <OwnerSection
                key={group.owner._id}
                name={group.owner.name}
                email={group.owner.email}
                count={group.items.length}
              >
                {group.items.map((note) => (
                  <EntryCard
                    key={note._id}
                    title={note.title}
                    content={note.content}
                    meta={formatDate(note.createdAt)}
                  />
                ))}
              </OwnerSection>
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <li key={note._id}>
                <EntryCard
                  title={note.title}
                  content={note.content}
                  meta={formatDate(note.createdAt)}
                  actions={actionsFor(note)}
                />
              </li>
            ))}
          </ul>
        )}

        <Pager
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          unit="notes"
          onChange={setPage}
        />
      </div>

      {editing && (
        <EntryEditor
          key={editing._id}
          open
          onOpenChange={(open) => !open && setEditing(null)}
          heading="Edit note"
          bodyLabel="Note"
          initial={{ title: editing.title, content: editing.content ?? "" }}
          onSave={(values) => save(editing._id, values)}
        />
      )}
    </AppShell>
  );
}
