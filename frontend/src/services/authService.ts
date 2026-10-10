import { api } from "./api";
import type { LoginCredentials, User } from "../types/auth";
import type { Result } from "../types/result";

export async function getCurrentUser(): Promise<Result<User>> {
  try {
    const response = await api.get<User>("/auth/me");
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error("Impossible de vérifier la session.") };
  }
}

export async function login(credentials: LoginCredentials): Promise<Result<User>> {
  try {
    await api.post("/auth/login", credentials);
    // Login sets an HttpOnly cookie; /me returns the user, not the JWT.
    return await getCurrentUser();
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error("Impossible de se connecter.") };
  }
}

export async function logout(): Promise<Result<null>> {
  try {
    await api.post("/auth/logout");
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error("Impossible de se déconnecter.") };
  }
}
