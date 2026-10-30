import { useState } from "react";

export default function SignupForm({ onSubmit, error, onNavigateToLogin }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [localError, setLocalError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (formData.password !== formData.confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
    } finally {
      setLoading(false);
    }
  };

  const activeError = localError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {activeError && (
        <div className="p-2.5 bg-rose-950/80 border border-rose-800 rounded text-rose-300 text-xs">
          {activeError}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
        <input
          name="name"
          type="text"
          required
          value={formData.name}
          onChange={handleChange}
          placeholder="Your Name"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
        <input
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          value={formData.password}
          onChange={handleChange}
          placeholder="At least 6 characters"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
        <input
          name="confirmPassword"
          type="password"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm password"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-medium transition cursor-pointer disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Sign Up"}
      </button>

      <p className="text-center text-xs text-slate-400 pt-2">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
        >
          Log In
        </button>
      </p>
    </form>
  );
}
