import { eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { adminProfile } from "../db/schema.ts";
import type { ProfileDto, UpdateProfileInput } from "../types/profile.ts";

const PROFILE_ID = 1;

const EMPTY_PROFILE: ProfileDto = {
  displayName: null,
  avatar: null,
  updatedAt: null,
};

export async function getProfile(): Promise<ProfileDto> {
  const [row] = await db
    .select()
    .from(adminProfile)
    .where(eq(adminProfile.id, PROFILE_ID));

  if (!row) return EMPTY_PROFILE;

  return {
    displayName: row.displayName,
    avatar: row.avatar,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<ProfileDto> {
  // undefined maydonlar tegilmaydi, null — tozalaydi.
  const changes: { displayName?: string | null; avatar?: string | null } = {};
  if (input.displayName !== undefined) {
    changes.displayName = input.displayName || null;
  }
  if (input.avatar !== undefined) changes.avatar = input.avatar;

  const [row] = await db
    .insert(adminProfile)
    .values({ id: PROFILE_ID, ...changes })
    .onConflictDoUpdate({
      target: adminProfile.id,
      set: { ...changes, updatedAt: new Date() },
    })
    .returning();

  return {
    displayName: row.displayName,
    avatar: row.avatar,
    updatedAt: row.updatedAt.toISOString(),
  };
}
