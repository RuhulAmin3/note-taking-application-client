"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { readApiError, type FieldErrors } from "@/lib/errors";
import { AuthLayout } from "@/components/auth-layout";
import { Field, FormError } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "", interests: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  // Stop flagging a field the moment the reader starts fixing it.
  function set(key: keyof typeof f, value: string) {
    setF((prev) => ({ ...prev, [key]: value }));
    setErrors({});
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const next: FieldErrors = {};
    if (!f.name.trim()) next.name = "Enter your name.";
    if (!f.email.trim()) next.email = "Enter your email address.";
    if (f.password.length < 8) next.password = "Use at least 8 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    try {
      const interests = f.interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await register(f.name.trim(), f.email.trim(), f.password, interests);
      router.push("/notes");
    } catch (err) {
      // A duplicate email is really a problem with one field, and the server's
      // own wording ("Duplicate key") is not something to show a reader.
      if ((err as { response?: { status?: number } })?.response?.status === 409) {
        setErrors({ email: "That email already has an account. Sign in instead." });
        setFormError("");
        return;
      }
      const { message, fieldErrors } = readApiError(err, "Could not create the account.");
      setErrors(fieldErrors);
      setFormError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Create an account"
      description="It takes a moment, then your notes are yours."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-2">
        <Field id="name" label="Name" error={errors.name}>
          <Input
            id="name"
            autoComplete="name"
            value={f.name}
            aria-invalid={!!errors.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field id="email" label="Email" error={errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={f.email}
            aria-invalid={!!errors.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field
          id="password"
          label="Password"
          hint="8 characters or more"
          error={errors.password}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={f.password}
            aria-invalid={!!errors.password}
            onChange={(e) => set("password", e.target.value)}
          />
        </Field>
        <Field
          id="interests"
          label="Interests"
          hint="optional"
          error={errors.interests}
        >
          <Input
            id="interests"
            placeholder="reading, chess"
            value={f.interests}
            aria-invalid={!!errors.interests}
            onChange={(e) => set("interests", e.target.value)}
          />
        </Field>
        <FormError message={formError} />
        <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
