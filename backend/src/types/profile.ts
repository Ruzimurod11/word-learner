import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z.string().trim().max(60).nullable().optional(),
  // Faqat data URL: "data:image/webp;base64,..." (~512 KB binary'gacha)
  avatar: z
    .string()
    .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/)
    .max(700_000)
    .nullable()
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export interface ProfileDto {
  displayName: string | null;
  avatar: string | null;
  updatedAt: string | null;
}
