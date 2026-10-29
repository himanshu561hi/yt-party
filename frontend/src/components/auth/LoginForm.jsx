import { useState } from "react";

export default function LoginForm({ onSubmit, error, onClearError, onNavigateToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (onClearError) onClearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFormError("Please enter your email.");
      return;
    }
    if (!password) {
      setFormError("Please enter your password.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(trimmedEmail, password);
    } catch {
      // Error handled by parent or hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = formError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {activeError && (
        <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-md text-rose-300 text-xs flex justify-between items-center">
          <span>{activeError}</span>
          <button
            type="button"
            onClick={() => {
              setFormError("");
              if (onClearError) onClearError();
            }}
            className="text-rose-400 hover:text-rose-200 font-bold ml-2 cursor-pointer"
          >
            x
          </button>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="login-email">
          Email Address
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={isSubmitting}
          autoComplete="email"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          disabled={isSubmitting}
          autoComplete="current-password"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-medium transition cursor-pointer disabled:opacity-50"
      >
        {isSubmitting ? "Logging in..." : "Log In"}
      </button>

      <div className="text-center pt-2">
        <span className="text-xs text-slate-400">Do not have an account? </span>
        <button
          type="button"
          onClick={onNavigateToSignup}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer underline"
        >
          Sign Up
        </button>
      </div>
    </form>
  );
}

