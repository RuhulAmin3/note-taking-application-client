"use client";

import { useState } from "react";
import { readApiError, type FieldErrors } from "@/lib/errors";
import { cn } from "@/lib/utils";
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
import { Label } from "@/components/ui/label";

export type Role = "user" | "admin";

export interface UserValues {
  name: string;
  email: string;
  password: string;
  role: Role;
  interests: string;
}

const EMPTY: UserValues = {
  name: "",
  email: "",
  password: "",
  role: "user",
  interests: "",
};

/** Two roles, so a pair of buttons beats a dropdown. */
function RoleChoice({
  value,
  onChange,
}: {
  value: Role;
  onChange: (role: Role) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {(["user", "admin"] as const).map((role) => (
        <button
          key={role}
          type="button"
          aria-pressed={value === role}
          onClick={() => onChange(role)}
          className={cn(
            "flex-1 rounded-md px-2 py-1 text-sm capitalize transition-colors",
            value === role
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {role}
        </button>
      ))}
    </div>
  );
}

/**
 * Creating and editing a user share a form. The server accepts a password only
 * on create — `adminUpdateSchema` has no password field — so the field is
 * offered only when there is no existing user.
 */
export function UserForm({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<UserValues>;
  onSave: (values: UserValues) => Promise<void>;
}) {
  const isEdit = !!initial;
  const [values, setValues] = useState<UserValues>({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  function edit(patch: Partial<UserValues>) {
    setValues((prev) => ({ ...prev, ...patch }));
    setErrors({});
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const next: FieldErrors = {};
    if (!values.name.trim()) next.name = "Enter a name.";
    if (!values.email.trim()) next.email = "Enter an email address.";
    if (!isEdit && values.password.length < 8) {
      next.password = "Use at least 8 characters.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    try {
      await onSave({
        ...values,
        name: values.name.trim(),
        email: values.email.trim(),
      });
      onOpenChange(false);
    } catch (err) {
      if ((err as { response?: { status?: number } })?.response?.status === 409) {
        setErrors({ email: "That email already has an account." });
        return;
      }
      const { message, fieldErrors } = readApiError(err, "Could not save the user.");
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
          <DialogTitle>{isEdit ? "Edit user" : "Add user"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Passwords can only be set by the account holder."
              : "They can sign in as soon as you save."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-2">
          <Field id="user-name" label="Name" error={errors.name}>
            <Input
              id="user-name"
              value={values.name}
              aria-invalid={!!errors.name}
              onChange={(e) => edit({ name: e.target.value })}
            />
          </Field>
          <Field id="user-email" label="Email" error={errors.email}>
            <Input
              id="user-email"
              type="email"
              value={values.email}
              aria-invalid={!!errors.email}
              onChange={(e) => edit({ email: e.target.value })}
            />
          </Field>
          {!isEdit && (
            <Field
              id="user-password"
              label="Password"
              hint="8 characters or more"
              error={errors.password}
            >
              <Input
                id="user-password"
                type="password"
                autoComplete="new-password"
                value={values.password}
                aria-invalid={!!errors.password}
                onChange={(e) => edit({ password: e.target.value })}
              />
            </Field>
          )}
          {/* New accounts are always regular users; the role is only
              adjustable on an account that already exists. */}
          {isEdit && (
            <div className="space-y-1.5">
              <Label>Role</Label>
              <RoleChoice value={values.role} onChange={(role) => edit({ role })} />
              <p className="min-h-4 text-xs text-destructive">{errors.role}</p>
            </div>
          )}
          <Field
            id="user-interests"
            label="Interests"
            hint="optional"
            error={errors.interests}
          >
            <Input
              id="user-interests"
              placeholder="reading, chess"
              value={values.interests}
              aria-invalid={!!errors.interests}
              onChange={(e) => edit({ interests: e.target.value })}
            />
          </Field>
          <FormError message={formError} />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />} disabled={pending}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
