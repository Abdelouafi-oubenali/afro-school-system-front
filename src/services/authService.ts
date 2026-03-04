const API_URL = "http://localhost:8081/api"; 

export const authService = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`Erreur login: ${response.status}`);
    }

    const data = await response.json();
    return data; 
  },

  logout: () => {
    localStorage.removeItem("token");
  },
};
