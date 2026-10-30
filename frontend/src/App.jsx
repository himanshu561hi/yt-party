import { useState } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import { useRoomSocket } from "./hooks/useRoomSocket.js";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import RoomPage from "./pages/RoomPage.jsx";

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [authView, setAuthView] = useState("login");
  const roomState = useRoomSocket();

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-500 flex items-center justify-center p-4 text-sm font-medium">
        Loading session...
      </main>
    );
  }

  const status = !user
    ? { text: "Not Logged In", bg: "bg-slate-100 text-slate-600 border-slate-300", dot: "bg-slate-400" }
    : roomState.isConnected
    ? { text: "Connected", bg: "bg-emerald-50 text-emerald-700 border-emerald-300", dot: "bg-emerald-500 animate-pulse" }
    : { text: "Disconnected", bg: "bg-rose-50 text-rose-700 border-rose-300", dot: "bg-rose-500" };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">
      {/* Top Navbar */}
      <nav className="w-full bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
            YouTube Watch Party
          </span>

          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.bg}`}>
              <span className={`w-2 h-2 rounded-full ${status.dot}`} />
              {status.text}
            </span>

            {user && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 hidden sm:inline font-medium">
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md text-xs font-medium transition cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 flex flex-col justify-center">
        <div className="w-full max-w-7xl mx-auto">
          {roomState.error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start justify-between text-rose-700 text-sm">
              <span>{roomState.error}</span>
              <button
                type="button"
                onClick={roomState.clearError}
                className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer"
              >
                x
              </button>
            </div>
          )}

          {roomState.currentRoom ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
              <RoomPage roomState={roomState} />
            </div>
          ) : !user ? (
            authView === "login" ? (
              <LoginPage onNavigateToSignup={() => setAuthView("signup")} />
            ) : (
              <SignupPage onNavigateToLogin={() => setAuthView("login")} />
            )
          ) : (
            <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
              <HomePage
                onCreateRoom={roomState.handleCreateRoom}
                onJoinRoom={roomState.handleJoinRoom}
                isSubmitting={roomState.isSubmitting}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
