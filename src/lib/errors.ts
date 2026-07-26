export type FieldErrors = Record<string, string>;

interface ApiErrorBody {
  error?: string;
  details?: { fieldErrors?: Record<string, string[]> };
}

/**
 * Unpacks the server's error envelope so a form can point at the field that
 * failed instead of showing one catch-all line.
 *
 * Validation failures arrive as
 *   { error: "Validation failed", details: { fieldErrors: { title: [...] } } }
 * everything else as
 *   { error: "Invalid credentials" }
 */
export function readApiError(
  err: unknown,
  fallback: string
): { message: string; fieldErrors: FieldErrors } {
  const res = (err as { response?: { data?: ApiErrorBody } })?.response;
  const body = res?.data;

  const fieldErrors: FieldErrors = {};
  for (const [field, messages] of Object.entries(body?.details?.fieldErrors ?? {})) {
    if (messages?.[0]) fieldErrors[field] = messages[0];
  }

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const message = hasFieldErrors ? "" : body?.error || fallback;

  return { message, fieldErrors };
}
