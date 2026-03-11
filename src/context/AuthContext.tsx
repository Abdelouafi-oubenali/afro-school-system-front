import { createContext, useState, useContext } from "react";
import type { ReactNode } from "react";
import { authService } from "../services/user/authService";

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractToken(data: any): string | null {
  const candidates = [
    data?.token,
    data?.accessToken,
    data?.jwt,
    data?.access_token,
    data?.data?.token,
    data?.data?.accessToken,
    data?.data?.jwt,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0 && value !== "undefined") {
      return value;
    }
  }

  return null;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginHandler = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(email, password);
      console.log("Réponse API:", data);

      const token = extractToken(data);
      if (!token) {
        throw new Error("Token JWT introuvable dans la réponse de login");
      }

      localStorage.setItem("token", token);
      
      // Vérifier si data.user existe ou si les infos sont directement dans data
      const userData = data.user || {
        id: data.id,
        name: data.name,
        email: data.email
      };
      
      console.log(" User défini:", userData);
      setUser(userData);
    } catch (err: any) {
      const errorMessage = err.message || "Erreur de connexion";
      setError(errorMessage);
      console.error(" Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login: loginHandler, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be inside AuthProvider");
  return context;
};