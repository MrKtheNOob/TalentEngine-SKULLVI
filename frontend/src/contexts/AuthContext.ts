import { createContext } from "react";
import type { LoginCredentials, User } from "../types/auth";
import type { Result } from "../types/result";

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: Error | null;
  login: (credentials: LoginCredentials) => Promise<Result<User>>;
  logout: () => Promise<Result<null>>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
