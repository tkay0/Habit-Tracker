import { getDb } from './client';
import { generateId } from './id';

export interface Profile {
  id: string;
  name: string;
  biometricEnabled: boolean;
  createdAt: string;
}

export interface NewProfileInput {
  name: string;
  biometricEnabled?: boolean;
}

interface ProfileRow {
  id: string;
  name: string;
  pin_hash: string | null;
  biometric_enabled: number;
  created_at: string;
}

// pin_hash lives in expo-secure-store (see src/lib/auth.ts), never in SQLite,
// so that column is intentionally left unpopulated here.
function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    biometricEnabled: row.biometric_enabled === 1,
    createdAt: row.created_at,
  };
}

export async function createProfile(input: NewProfileInput): Promise<Profile> {
  const db = await getDb();
  const id = generateId();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO profile (id, name, biometric_enabled, created_at) VALUES (?, ?, ?, ?)`,
    id,
    input.name,
    input.biometricEnabled ? 1 : 0,
    createdAt
  );

  const profile = await getProfile();
  if (!profile) throw new Error('Failed to create profile');
  return profile;
}

export async function getProfile(): Promise<Profile | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ProfileRow>('SELECT * FROM profile LIMIT 1');
  return row ? mapProfileRow(row) : null;
}

export async function setBiometricEnabled(id: string, enabled: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE profile SET biometric_enabled = ? WHERE id = ?', enabled ? 1 : 0, id);
}
