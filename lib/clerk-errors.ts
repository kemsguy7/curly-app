import { isClerkAPIResponseError } from '@clerk/expo';

type ParamLike = string | undefined;

function pickMetaParam(meta: Record<string, unknown> | undefined): ParamLike {
  if (!meta) return undefined;
  const paramName = meta.param_name ?? meta.paramName;
  if (typeof paramName === 'string') return paramName;
  return undefined;
}

/**
 * Returns a short, user-facing message for the first Clerk API error, optionally filtered by `param`.
 */
type ClerkApiErrorLike = {
  message: string;
  longMessage?: string;
  meta?: Record<string, unknown>;
};

export function getClerkErrorMessage(error: unknown, param?: string): string | undefined {
  if (!error) return undefined;
  if (isClerkAPIResponseError(error)) {
    const errors = error.errors as ClerkApiErrorLike[];
    const match = errors.find((e) => {
      if (!param) return true;
      return pickMetaParam(e.meta) === param;
    });
    const message = match?.longMessage || match?.message;
    return message || error.message;
  }
  if (error instanceof Error) return error.message;
  return undefined;
}

export function getClerkFieldErrors(error: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!error || !isClerkAPIResponseError(error)) return out;
  const errors = error.errors as ClerkApiErrorLike[];
  for (const e of errors) {
    const param = pickMetaParam(e.meta);
    if (!param) continue;
    out[param] = e.longMessage || e.message;
  }
  return out;
}
