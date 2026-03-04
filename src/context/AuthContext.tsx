import { createContext, useState, ReactNode, useContext } from "react";
import { authService } from "../services/authService";

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
      
      const token = data.token;
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