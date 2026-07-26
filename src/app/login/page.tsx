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

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const next: FieldErrors = {};
    if (!email.trim()) next.email = "Enter your email address.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    try {
      await login(email.trim(), password);
      router.push("/notes");
    } catch (err) {
      const { message, fieldErrors } = readApiError(err, "Could not sign in.");
      setErrors(fieldErrors);
      setFormError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      description="Pick up where you left off."
      footer={
        <>
          No account yet?{" "}
          <Link
            href="/register"
            className="text-primary underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-2">
        <Field id="email" label="Email" error={errors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            aria-invalid={!!errors.email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors({});
            }}
          />
        </Field>
        <Field id="password" label="Password" error={errors.password}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            aria-invalid={!!errors.password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors({});
            }}
          />
        </Field>
        <FormError message={formError} />
        <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
