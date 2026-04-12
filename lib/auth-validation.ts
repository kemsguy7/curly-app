const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export type FieldErrors = {
  email?: string;
  password?: string;
  code?: string;
};

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string): string | undefined {
  const email = normalizeEmail(value);
  if (!email) return 'Enter your email address.';
  if (!EMAIL_RE.test(email)) return 'Enter a valid email address.';
  return undefined;
}

export function validatePassword(value: string): string | undefined {
  if (!value) return 'Enter your password.';
  if (value.length < 8) return 'Use at least 8 characters.';
  if (value.length > 128) return 'Password is too long.';
  return undefined;
}

export function validateVerificationCode(value: string): string | undefined {
  const code = value.trim();
  if (!code) return 'Enter the verification code.';
  if (code.length < 6) return 'That code looks too short.';
  return undefined;
}
