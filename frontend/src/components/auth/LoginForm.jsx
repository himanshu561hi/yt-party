import { useState } from "react";

export default function LoginForm({ onSubmit, error, onNavigateToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await onSubmit(email.trim(), password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-2.5 bg-rose-950/80 border border-rose-800 rounded text-rose-300 text-xs">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-medium transition cursor-pointer disabled:opacity-50"
      >
        {loading ? "Logging in..." : "Log In"}
      </button>

      <p className="text-center text-xs text-slate-400 pt-2">
        Do not have an account?{" "}
        <button
          type="button"
          onClick={onNavigateToSignup}
          className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
        >
          Sign Up
        </button>
      </p>
    </form>
  );
}
