import { useState } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import { useRoomSocket } from "./hooks/useRoomSocket.js";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import RoomPage from "./pages/RoomPage.jsx";

function AppContent() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState("login"); // "login" | "signup"
  const roomState = useRoomSocket();

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="text-sm text-slate-400">Loading session...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-xl">
        {/* Top Header: Brand & Server Status */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
          <span className="text-sm font-semibold tracking-wide text-white">
            YouTube Watch Party
          </span>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                roomState.isConnected
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  : "bg-rose-950 text-rose-400 border border-rose-800"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  roomState.isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                }`}
              />
              {roomState.isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Global Error Banner */}
        {roomState.error && (
          <div className="mb-6 p-3 bg-rose-950/80 border border-rose-800 rounded-md flex items-start justify-between text-rose-300 text-sm">
            <span>{roomState.error}</span>
            <button
              type="button"
              onClick={roomState.clearError}
              className="text-rose-400 hover:text-rose-200 font-bold ml-2 cursor-pointer"
            >
              x
            </button>
          </div>
        )}

        {/* Dynamic View Routing */}
        {roomState.currentRoom ? (
          <RoomPage roomState={roomState} />
        ) : !user ? (
          authView === "login" ? (
            <LoginPage
              onNavigateToSignup={() => setAuthView("signup")}
              onLoginSuccess={() => setAuthView("home")}
            />
          ) : (
            <SignupPage
              onNavigateToLogin={() => setAuthView("login")}
              onSignupSuccess={() => setAuthView("home")}
            />
          )
        ) : (
          <HomePage
            onCreateRoom={roomState.handleCreateRoom}
            onJoinRoom={roomState.handleJoinRoom}
            isSubmitting={roomState.isSubmitting}
          />
        )}
      </div>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
