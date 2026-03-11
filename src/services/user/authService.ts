import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/users-service/api";

export const authService = {
  login: async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ERR_NETWORK") {
          throw new Error("Connexion au serveur impossible. Verifie que le backend tourne sur le port 8080.");
        }

        const status = error.response?.status;
        const data = error.response?.data as
          | { message?: string; error?: string; details?: string }
          | string
          | undefined;

        const backendMessage =
          typeof data === "string"
            ? data
            : data?.message || data?.error || data?.details;

        throw new Error(
          [
            "Echec de connexion",
            `HTTP: ${status ?? "inconnu"}`,
            backendMessage ? `Backend: ${backendMessage}` : null,
          ]
            .filter(Boolean)
            .join(" | ")
        );
      }

      throw new Error("Erreur inattendue pendant le login");
    }
  },

  logout: () => {
    localStorage.removeItem("token");
  },
};
