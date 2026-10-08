import { validateEmail, validatePassword } from '../validation';

describe('validateEmail', () => {
  it.each([
    ['', 'required'],
    ['   ', 'required'],
    ['priya', 'invalid'],
    ['priya@', 'invalid'],
    ['priya@example', 'invalid'],
    ['priya @example.com', 'invalid'],
  ])('%p is %p', (input, expected) => {
    expect(validateEmail(input)).toBe(expected);
  });

  it('accepts normal addresses, ignoring surrounding spaces', () => {
    expect(validateEmail('priya@example.com')).toBeNull();
    expect(validateEmail('  sam.lee+wellness@mail.co.in ')).toBeNull();
  });
});

describe('validatePassword', () => {
  it('requires at least 8 characters', () => {
    expect(validatePassword('')).toBe('required');
    expect(validatePassword('1234567')).toBe('tooShort');
    expect(validatePassword('12345678')).toBeNull();
  });
});
