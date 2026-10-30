const API_URL = (import.meta.env.VITE_SERVER_URL || "http://localhost:5001").replace(/\/+$/, "");

let token = null;
try {
  token = localStorage.getItem("jwt_token") || sessionStorage.getItem("jwt_token");
} catch {

}

async function apiRequest(endpoint, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const res = await fetch(`${API_URL}/api/auth/${endpoint}`, {
    credentials: "include",
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Request failed. Please try again.");
  }
  return data;
}

export const authService = {
  getToken: () => token,

  setToken(newToken) {
    token = newToken;
    try {
      if (newToken) {
        localStorage.setItem("jwt_token", newToken);
        sessionStorage.setItem("jwt_token", newToken);
      } else {
        localStorage.removeItem("jwt_token");
        sessionStorage.removeItem("jwt_token");
      }
    } catch {
      // Ignore storage errors
    }
  },

  async authenticate(endpoint, payload) {
    const data = await apiRequest(endpoint, {
      method: "POST",
      body: payload
    });
    if (data.token) this.setToken(data.token);
    return data;
  },

  signup(payload) {
    return this.authenticate("signup", payload);
  },

  login(credentials) {
    return this.authenticate("login", credentials);
  },

  async getCurrentUser() {
    if (!token) {
      return null;
    }
    try {
      const data = await apiRequest("me");
      return data.user;
    } catch {
      this.setToken(null);
      return null;
    }
  },

  async logout() {
    try {
      await apiRequest("logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    } finally {
      this.setToken(null);
    }
  }
};
