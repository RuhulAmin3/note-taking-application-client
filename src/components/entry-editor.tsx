"use client";

import { useState } from "react";
import { readApiError, type FieldErrors } from "@/lib/errors";
import { Field, FormError } from "@/components/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface EntryValues {
  title: string;
  content: string;
}

/**
 * Notes and posts are the same shape — a title and a body — so they share one
 * editor rather than two dialogs that drift apart.
 */
export function EntryEditor({
  open,
  onOpenChange,
  heading,
  bodyLabel,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  heading: string;
  bodyLabel: string;
  initial: EntryValues;
  onSave: (values: EntryValues) => Promise<void>;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  function edit(patch: Partial<EntryValues>) {
    setValues((prev) => ({ ...prev, ...patch }));
    setErrors({});
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!values.title.trim()) {
      setErrors({ title: "Give it a title." });
      return;
    }
    setErrors({});

    setPending(true);
    try {
      await onSave({ ...values, title: values.title.trim() });
      onOpenChange(false);
    } catch (err) {
      const { message, fieldErrors } = readApiError(err, "Could not save the changes.");
      setErrors(fieldErrors);
      setFormError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{heading}</DialogTitle>
          <DialogDescription>Changes apply as soon as you save.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-2">
          <Field id="edit-title" label="Title" error={errors.title}>
            <Input
              id="edit-title"
              value={values.title}
              aria-invalid={!!errors.title}
              onChange={(e) => edit({ title: e.target.value })}
            />
          </Field>
          <Field id="edit-content" label={bodyLabel} hint="optional" error={errors.content}>
            <Textarea
              id="edit-content"
              rows={4}
              value={values.content}
              aria-invalid={!!errors.content}
              onChange={(e) => edit({ content: e.target.value })}
            />
          </Field>
          <FormError message={formError} />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />} disabled={pending}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
