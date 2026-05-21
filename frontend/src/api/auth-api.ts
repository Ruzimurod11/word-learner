import { handleError, http, unwrap } from "@/api/http";
import type { ApiResponse } from "@/types/word";

export const login = async (password: string): Promise<string> => {
  try {
    const res = await http.post<ApiResponse<{ token: string }>>("/auth/login", {
      password,
    });
    return unwrap(res.data).token;
  } catch (err) {
    return handleError(err);
  }
};
