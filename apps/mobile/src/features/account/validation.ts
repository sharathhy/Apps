export const MIN_PASSWORD_LENGTH = 8;

export type EmailError = 'required' | 'invalid';
export type PasswordError = 'required' | 'tooShort';

export function validateEmail(value: string): EmailError | null {
  const email = value.trim();
  if (!email) return 'required';
  // Deliberately simple: the server sends a confirmation email anyway.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : 'invalid';
}

export function validatePassword(value: string): PasswordError | null {
  if (!value) return 'required';
  return value.length < MIN_PASSWORD_LENGTH ? 'tooShort' : null;
}
