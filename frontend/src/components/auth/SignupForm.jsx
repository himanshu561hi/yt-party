import { useState } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupForm({ onSubmit, error, onClearError, onNavigateToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (onClearError) onClearError();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setFormError("Please enter your name (at least 2 characters).");
      return;
    }
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: trimmedName,
        email: trimmedEmail,
        password,
        confirmPassword
      });
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
        <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="signup-name">
          Full Name
        </label>
        <input
          id="signup-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alice Smith"
          disabled={isSubmitting}
          autoComplete="name"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="signup-email">
          Email Address
        </label>
        <input
          id="signup-email"
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
        <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="signup-password">
          Password (min 6 characters)
        </label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password"
          disabled={isSubmitting}
          autoComplete="new-password"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="signup-confirm-password">
          Confirm Password
        </label>
        <input
          id="signup-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat password"
          disabled={isSubmitting}
          autoComplete="new-password"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-medium transition cursor-pointer disabled:opacity-50"
      >
        {isSubmitting ? "Creating account..." : "Sign Up"}
      </button>

      <div className="text-center pt-2">
        <span className="text-xs text-slate-400">Already have an account? </span>
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer underline"
        >
          Log In
        </button>
      </div>
    </form>
  );
}

