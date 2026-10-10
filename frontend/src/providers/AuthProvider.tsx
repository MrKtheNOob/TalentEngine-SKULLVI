import { useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import * as authService from "../services/authService";
import type { LoginCredentials, User } from "../types/auth";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    // Restore the session on refresh. An expired or absent cookie is normal.
    authService.getCurrentUser().then((result) => {
      if (!active) return;
      setUser(result.data);
      const unauthenticated = axios.isAxiosError(result.error) && result.error.response?.status === 401;
      setError(unauthenticated ? null : result.error);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function login(credentials: LoginCredentials) {
    setLoading(true);
    setError(null);
    const result = await authService.login(credentials);
    setUser(result.data);
    setError(result.error);
    setLoading(false);
    return result;
  }

  async function logout() {
    const result = await authService.logout();
    // Keep the session visible if the API could not delete its cookie.
    if (!result.error) {
      setUser(null);
      setError(null);
    }
    return result;
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
