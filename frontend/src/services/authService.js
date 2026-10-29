const API_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5001";

// Cache token in memory / sessionStorage for WebSocket handshake authorization
let cachedToken = null;

try {
  cachedToken = sessionStorage.getItem("jwt_token");
} catch {
  // Ignore sessionStorage errors
}

export const authService = {
  getToken() {
    return cachedToken;
  },

  setToken(token) {
    cachedToken = token;
    try {
      if (token) {
        sessionStorage.setItem("jwt_token", token);
      } else {
        sessionStorage.removeItem("jwt_token");
      }
    } catch {
      // Ignore
    }
  },

  async signup({ name, email, password, confirmPassword }) {
    const res = await fetch(`${API_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, password, confirmPassword })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Signup failed. Please try again.");
    }

    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async login({ email, password }) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Login failed. Please try again.");
    }

    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async getCurrentUser() {
    const headers = {};
    if (cachedToken) {
      headers["Authorization"] = `Bearer ${cachedToken}`;
    }

    const res = await fetch(`${API_URL}/api/auth/me`, {
      method: "GET",
      headers,
      credentials: "include"
    });

    if (!res.ok) {
      this.setToken(null);
      return null;
    }

    const data = await res.json();
    return data.user;
  },

  async logout() {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      this.setToken(null);
    }
  }
};