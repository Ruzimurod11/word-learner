import { handleError, http, unwrap } from "@/api/http";
import type { Profile, UpdateProfileInput } from "@/types/profile";
import type { ApiResponse } from "@/types/word";

export const getProfile = async (): Promise<Profile> => {
  try {
    const res = await http.get<ApiResponse<Profile>>("/profile");
    return unwrap(res.data);
  } catch (err) {
    return handleError(err);
  }
};

export const updateProfile = async (
  input: UpdateProfileInput,
): Promise<Profile> => {
  try {
    const res = await http.put<ApiResponse<Profile>>("/profile", input);
    return unwrap(res.data);
  } catch (err) {
    return handleError(err);
  }
};
