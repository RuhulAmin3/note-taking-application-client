"use client";

import { useCallback, useEffect, useState } from "react";
import { PenLine, Pencil, Trash2 } from "lucide-react";
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

interface Author {
  _id: string;
  name: string;
  email: string;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  createdAt?: string;
  author: Author;
}

const PAGE_SIZE = 5;

export default function PostsPage() {
  const { token, user, ready } = useAuth();
  const isAdmin = user?.role === "admin";

  const [posts, setPosts] = useState<Post[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ title: "", content: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [editing, setEditing] = useState<Post | null>(null);

  function edit(patch: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...patch }));
    setErrors({});
  }

  const load = useCallback(async () => {
    if (!user) return;
    try {
      // Admins oversee everyone's posts; everyone else sees only their own.
      const path = isAdmin ? "/posts/all" : `/posts/user/${user.id}`;
      const { data } = await api.get(`${path}?page=${page}&limit=${PAGE_SIZE}`);
      setListError("");
      setPosts(data.data);
      setMeta(data.meta);
    } catch (err) {
      const { message } = readApiError(err, "Could not load posts.");
      setListError(message);
    } finally {
      setLoading(false);
    }
  }, [user, page, isAdmin]);

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
      setErrors({ title: "Give the post a title." });
      return;
    }
    setErrors({});

    setPending(true);
    try {
      await api.post("/posts", { ...form, title: form.title.trim() });
      setForm({ title: "", content: "" });
      if (page !== 1) setPage(1);
      else await load();
    } catch (err) {
      const { message, fieldErrors } = readApiError(err, "Could not publish the post.");
      setErrors(fieldErrors);
      setFormError(message);
    } finally {
      setPending(false);
    }
  }

  async function save(id: string, values: { title: string; content: string }) {
    await api.patch(`/posts/${id}`, values);
    await load();
  }

  async function remove(id: string) {
    try {
      await api.delete(`/posts/${id}`);
      if (posts.length === 1 && page > 1) setPage((p) => p - 1);
      else await load();
    } catch (err) {
      const { message } = readApiError(err, "Could not delete the post.");
      setListError(message);
    }
  }

  function actionsFor(post: Post) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${post.title}`}
          onClick={() => setEditing(post)}
        >
          <Pencil />
        </Button>
        <ConfirmDelete
          title="Delete this post?"
          description={`"${post.title}" will be removed for good.`}
          confirmLabel="Delete post"
          onConfirm={() => remove(post._id)}
        >
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${post.title}`}>
            <Trash2 />
          </Button>
        </ConfirmDelete>
      </>
    );
  }

  const description = isAdmin
    ? meta.total > 0
      ? `${meta.total} ${meta.total === 1 ? "post" : "posts"} across every account`
      : "Posts from every account will appear here."
    : meta.total > 0
      ? `${meta.total} ${meta.total === 1 ? "post" : "posts"} under your name`
      : "Posts carry your name alongside them.";

  return (
    <AppShell title={isAdmin ? "All posts" : "Posts"} description={description}>
      <div className="space-y-6">
        {/* Admins read; they don't publish on someone else's behalf. */}
        {!isAdmin && (
          <Card>
            <CardContent>
              <form onSubmit={create} noValidate className="space-y-2">
                <Field id="post-title" label="Title" error={errors.title}>
                  <Input
                    id="post-title"
                    value={form.title}
                    aria-invalid={!!errors.title}
                    placeholder="Name the post"
                    onChange={(e) => edit({ title: e.target.value })}
                  />
                </Field>
                <Field id="post-content" label="Body" hint="optional" error={errors.content}>
                  <Textarea
                    id="post-content"
                    rows={3}
                    value={form.content}
                    aria-invalid={!!errors.content}
                    placeholder="Say the thing."
                    onChange={(e) => edit({ content: e.target.value })}
                  />
                </Field>
                <FormError message={formError} />
                <div className="flex justify-end">
                  <Button type="submit" disabled={pending}>
                    {pending ? "Publishing…" : "Publish post"}
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
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<PenLine />}
            title="No posts yet"
            hint={
              isAdmin
                ? "Nobody has published one so far."
                : "Publish your first one using the form above."
            }
          />
        ) : isAdmin ? (
          <div className="space-y-8">
            {groupByOwner(posts, (p) => p.author).map((group) => (
              <OwnerSection
                key={group.owner._id}
                name={group.owner.name}
                email={group.owner.email}
                count={group.items.length}
              >
                {group.items.map((post) => (
                  <EntryCard
                    key={post._id}
                    title={post.title}
                    content={post.content}
                    meta={formatDate(post.createdAt)}
                  />
                ))}
              </OwnerSection>
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post._id}>
                <EntryCard
                  title={post.title}
                  content={post.content}
                  meta={formatDate(post.createdAt)}
                  actions={actionsFor(post)}
                />
              </li>
            ))}
          </ul>
        )}

        <Pager
          page={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          unit="posts"
          onChange={setPage}
        />
      </div>

      {editing && (
        <EntryEditor
          key={editing._id}
          open
          onOpenChange={(open) => !open && setEditing(null)}
          heading="Edit post"
          bodyLabel="Body"
          initial={{ title: editing.title, content: editing.content ?? "" }}
          onSave={(values) => save(editing._id, values)}
        />
      )}
    </AppShell>
  );
}
