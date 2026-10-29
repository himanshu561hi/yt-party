# YouTube Watch Party

A real-time, synchronized YouTube watch party web application built with the MERN stack (Node.js, Express, MongoDB, React, Tailwind CSS) and Socket.IO.

## Key Features

- Authentication: Secure registration and login using salted scrypt password hashing and JWT authentication (cookies and Bearer headers).
- Authenticated WebSockets: Real-time Socket.IO connections authenticated via handshake tokens. Identity and roles are server-enforced.
- Room Management: Create and join watch party rooms with short, unique 6-character room codes.
- Authoritative Playback Synchronization: Single source of truth for video ID, play/pause state, and playback timestamp broadcast to all room members.
- Built-In Control Restriction: Native YouTube controls and click events are intercepted to prevent participants from independently altering local playback.
- Role-Based Access Control:
  - Host: Full room ownership, playback controls, participant promotion/demotion, and member removal.
  - Moderator: Direct playback controls and control request approvals.
  - Participant: Synchronized viewer with playback control request submission.
- Control Request Workflow: Approval queue allowing Host and Moderator to approve or reject participant playback requests in real time.
- Clean Component Architecture: Modular frontend organized into auth, room components, pages, custom hooks, and API services.

## Project Structure

```text
YOUTUBE-STREAM/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # MongoDB connection
│   │   ├── controllers/          # Authentication controllers
│   │   ├── middleware/auth.js    # HTTP and WebSocket auth middleware
│   │   ├── models/User.js        # User model and repository
│   │   ├── routes/authRoutes.js  # /api/auth API routes
│   │   ├── socket/roomHandler.js # Authenticated Socket.IO handlers
│   │   ├── socket/roomManager.js # In-memory room state and RBAC
│   │   ├── utils/crypto.js       # Salted scrypt and JWT helpers
│   │   └── app.js                # Express app setup and CORS
│   ├── server.js                 # HTTP and Socket.IO server entrypoint
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/             # LoginForm and SignupForm
│   │   │   ├── room/             # RoomHeader, PlaybackControls, ParticipantList, etc.
│   │   │   └── YouTubePlayer.jsx # YouTube IFrame API player with click blocker
│   │   ├── pages/                # HomePage, LoginPage, SignupPage, RoomPage
│   │   ├── hooks/                # useAuth and useRoomSocket
│   │   ├── services/             # authService REST client
│   │   ├── utils/youtube.js      # YouTube URL parser
│   │   ├── socket.js             # Socket.IO client instance
│   │   ├── App.jsx               # Application shell and view routing
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
└── README.md
```

## Quick Start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Server listens on `http://localhost:5001`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Vite development server runs on `http://localhost:5173`.

For detailed documentation, see [backend/README.md](./backend/README.md) and [frontend/README.md](./frontend/README.md).
