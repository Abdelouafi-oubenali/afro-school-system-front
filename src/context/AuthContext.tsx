import { createContext, useState, useContext } from "react";
import type { ReactNode } from "react";
import { authService } from "../services/user/authService";

type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USER_STORAGE_KEY = "auth_user";

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

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function pickRole(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const firstString = value.find((item) => typeof item === "string" && item.trim());
    if (typeof firstString === "string") return firstString.trim();
  }
  return undefined;
}

function pickString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}

function isUuid(value?: string): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function pickFirstUuid(candidates: Array<unknown>): string | undefined {
  for (const candidate of candidates) {
    const asString = pickString(candidate);
    if (isUuid(asString)) return asString;
  }
  return undefined;
}

function normalizeUser(raw: any, token?: string | null, emailFallback?: string): User {
  const fallbackClaims = token ? decodeJwtPayload(token) : null;
  const role =
    pickRole(raw?.role) ||
    pickRole(raw?.roles) ||
    pickRole(raw?.authority) ||
    pickRole(raw?.authorities) ||
    pickRole(raw?.type) ||
    pickRole(raw?.profil) ||
    pickRole(fallbackClaims?.role) ||
    pickRole(fallbackClaims?.roles) ||
    pickRole(fallbackClaims?.authorities);

  // Prefer a UUID identifier for API routes that require UUID path params.
  const uuidId = pickFirstUuid([
    raw?.id,
    raw?.userId,
    raw?.uuid,
    raw?.enseignantId,
    raw?.teacherId,
    fallbackClaims?.id,
    fallbackClaims?.userId,
    fallbackClaims?.user_id,
    fallbackClaims?.uid,
    fallbackClaims?.enseignantId,
    fallbackClaims?.teacherId,
    fallbackClaims?.sub,
  ]);

  const id =
    uuidId ||
    pickString(raw?.id) ||
    pickString(raw?.userId) ||
    pickString(raw?.uuid) ||
    pickString(fallbackClaims?.id) ||
    pickString(fallbackClaims?.userId) ||
    pickString(fallbackClaims?.user_id) ||
    pickString(fallbackClaims?.uid) ||
    pickString(fallbackClaims?.sub) ||
    "unknown-user";

  const email =
    pickString(raw?.email) ||
    pickString(raw?.mail) ||
    pickString(fallbackClaims?.email) ||
    pickString(fallbackClaims?.upn) ||
    pickString(fallbackClaims?.preferred_username) ||
    pickString(emailFallback) ||
    "unknown@local";

  const prenom = pickString(raw?.prenom);
  const nom = pickString(raw?.nom);
  const fullNameFromParts = prenom && nom ? `${prenom} ${nom}` : undefined;

  const name =
    pickString(raw?.name) ||
    pickString(raw?.fullName) ||
    pickString(raw?.username) ||
    fullNameFromParts ||
    pickString(fallbackClaims?.name) ||
    pickString(fallbackClaims?.preferred_username) ||
    pickString(fallbackClaims?.username) ||
    (email.includes("@") ? email.split("@")[0] : email);

  return {
    id,
    name,
    email,
    role,
  };
}

function readStoredUser(): User | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const user = normalizeUser(parsed, localStorage.getItem("token"));
    if (!user.id) return null;
    return user;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => readStoredUser());
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
      
      const rawUserData = data.user || {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role || data.type || data.profil || data.roles,
      };

      const userData = normalizeUser(rawUserData, token, email);

      if (typeof data?.tokenType === "string" && data.tokenType.trim()) {
        localStorage.setItem("tokenType", data.tokenType.trim());
      }
      if (typeof data?.refreshToken === "string" && data.refreshToken.trim()) {
        localStorage.setItem("refreshToken", data.refreshToken.trim());
      }

      console.log(" User défini:", userData);
      setUser(userData);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
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
    localStorage.removeItem(USER_STORAGE_KEY);
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