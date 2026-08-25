export interface Profile {
  displayName: string | null;
  avatar: string | null;
  updatedAt: string | null;
}

export type UpdateProfileInput = Partial<Pick<Profile, "displayName" | "avatar">>;
