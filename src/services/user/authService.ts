import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/users-service/api";

export const authService = {
  login: async (email: string, password: string) => {
    const url = `${API_URL}/auth/login`;
    console.log("[authService.login] request", {
      url,
      email,
      passwordLength: password.length,
    });

    try {
      const response = await axios.post(url, { email, password });
      console.log("[authService.login] success", {
        status: response.status,
        hasAccessToken: Boolean(response.data?.accessToken || response.data?.token || response.data?.jwt),
        keys: response.data && typeof response.data === "object" ? Object.keys(response.data) : null,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("[authService.login] axios error", {
          url,
          status: error.response?.status,
          code: error.code,
          responseData: error.response?.data,
        });

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
