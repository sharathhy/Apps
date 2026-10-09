import { CryptoDigestAlgorithm, digestStringAsync, getRandomBytes } from 'expo-crypto';

import { gestationalAge, sessionMinutes, type KickSession } from '@/features/pregnancy/model';
import type { Appointment } from '@/features/pregnancy/store';

/**
 * What a partner can see, by scope. Only a summary is ever shared: never
 * notes, symptoms, weight or names.
 */
export const shareScopes = ['week', 'appointments', 'kicks'] as const;
export type ShareScope = (typeof shareScopes)[number];

export interface WeekSnapshot {
  dueDate: string;
}
export type AppointmentsSnapshot = { title: string; at: string }[];
export type KicksSnapshot = { startedAt: string; count: number; minutes: number }[];

export interface Snapshots {
  week: WeekSnapshot | null;
  appointments: AppointmentsSnapshot;
  kicks: KicksSnapshot;
}

/** Builds the shared summary from the owner's own data. */
export function buildSnapshots(
  input: { dueDate: string | null; appointments: Appointment[]; kicks: KickSession[] },
  now: Date,
): Snapshots {
  const iso = now.toISOString();
  return {
    week: input.dueDate ? { dueDate: input.dueDate } : null,
    appointments: input.appointments
      .filter((a) => a.at >= iso)
      .slice(0, 10)
      .map((a) => ({ title: a.title, at: a.at })),
    kicks: input.kicks
      .filter((k) => k.endedAt)
      .slice(0, 7)
      .map((k) => ({ startedAt: k.startedAt, count: k.count, minutes: sessionMinutes(k) })),
  };
}

/** The partner's view of the week, computed on their device from the shared due date. */
export const sharedWeek = (snapshot: WeekSnapshot | null, today: string) =>
  snapshot ? gestationalAge(snapshot.dueDate, today) : null;

/** No 0/O or 1/I/L, so a code read aloud or typed is hard to get wrong. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 8;

export function generateCode(): string {
  // Rejection sampling keeps every character equally likely.
  const limit = 256 - (256 % ALPHABET.length);
  let code = '';
  while (code.length < CODE_LENGTH) {
    for (const byte of getRandomBytes(CODE_LENGTH * 2)) {
      if (byte < limit && code.length < CODE_LENGTH) code += ALPHABET[byte % ALPHABET.length];
    }
  }
  return code;
}

export const normalizeCode = (code: string) => code.replace(/[\s-]/g, '').toUpperCase();

/** The server stores only this hash (accept_partner_invite hashes the same way). */
export async function hashCode(code: string): Promise<string> {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, normalizeCode(code));
}
