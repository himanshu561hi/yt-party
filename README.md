# YouTube Watch Party

A real-time, synchronized YouTube watch party web application built with the MERN stack (Node.js, Express, MongoDB, React, Tailwind CSS) and Socket.IO.

## Live Deployments

- Frontend: https://yt-party-web3task.netlify.app
- Backend: https://yt-party-backend.vercel.app

## Key Features

- Authentication: Secure registration and login using salted scrypt password hashing and JWT authentication (cookies and Bearer headers).
- Authenticated WebSockets: Real-time Socket.IO connections authenticated via handshake tokens. Identity and roles are server-enforced.
- Room Management: Create and join watch party rooms with short, unique 6-character room codes or shareable one-click invitation links.
- Authoritative Playback Synchronization: Single source of truth for video ID, play/pause state, and playback timestamp broadcast to all room members.
- Built-In Control Restriction: Native YouTube controls and click events are intercepted to prevent participants from independently altering local playback.
- Role-Based Access Control:
  - Host: Full room ownership, playback controls, participant promotion/demotion, and member removal.
  - Moderator: Direct playback controls and control request approvals.
  - Participant: Synchronized viewer with playback control request submission.
- Control Request Workflow: Approval queue allowing Host and Moderator to approve or reject participant playback requests in real time.
- Clean Component Architecture: Modular frontend organized into auth, room components, pages, custom hooks, and API services.

## System Architecture

![System Architecture](./system%20architecture.png)

The application follows an authoritative decoupled client-server architecture combining real-time event streaming with persistent document storage.

### 1. Client Layer (Frontend SPA)
- **Framework & Tooling:** React 19 bootstrapped with Vite 6 and Tailwind CSS v4.
- **Player Integration:** YouTube IFrame Player API wrapped inside a state-synchronized controller with a transparent click-interceptor overlay (`pointer-events-none`) to prevent unauthorized local overrides.
- **State Management:** Custom reactive hooks (`useAuth` for authentication lifecycle; `useRoomSocket` for Socket.IO event listeners and authoritative playback sync).
- **Communication Clients:** Standard browser Fetch API for REST endpoints; Socket.IO client configured with WebSocket transport and JWT handshake authentication.

### 2. Real-Time & API Layer (Backend Server)
- **Runtime:** Node.js (v24.x / ES Modules) running Express 5 and Socket.IO 4.
- **REST Endpoints:** Authentication (`/api/auth/signup`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`) and Room queries (`/api/rooms`).
- **Socket Gateway:** Authenticates handshake tokens using `socketAuthMiddleware`, registers room event handlers, and enforces role-based access control (RBAC) on all incoming commands.

### 3. State & Persistence Layer
- **Authoritative In-Memory Engine:** Native JavaScript `Map` collections (`rooms`, `socketToRoomMap`, `pendingRequests`) provide sub-millisecond execution for playback commands, role changes, and member ejections.
- **Database Storage:** MongoDB Atlas managed via Mongoose 9 schemas (`User` and `Room`).
- **Asynchronous Synchronization:** In-memory room mutations mirror asynchronously to MongoDB with connection readiness guards (`Room.db?.readyState`) to prevent latency spikes or blocking.

---

## Work Flow

![Work Flow](./Work-flow.png)

The end-to-end operational lifecycle spans user authentication, room orchestration, playback synchronization, and participant moderation workflows:

### 1. Authentication & Session Initiation
1. **User Registration / Login:** The client sends credentials to `POST /api/auth/signup` or `login`.
2. **Password Verification & Token Issuance:** The server hashes passwords using `bcryptjs` (10 rounds) or verifies existing hashes, creates an HMAC-SHA256 JWT, sets an `HttpOnly` cross-site cookie, and returns the session payload.
3. **Socket Handshake:** The client connects to Socket.IO; the handshake middleware extracts and verifies the JWT, attaching the authoritative identity (`userId`, `username`, `email`) directly to the socket instance.

### 2. Room Creation & Invitation Lifecycle
1. **Host Room Creation:** The host clicks "Create Room", emitting `create_room`. The server generates a collision-resistant 6-character hex code, initializes room state, assigns the creator as `Host`, and emits `room_created`.
2. **Invitation Links:** The host can click "Copy Code" or "Copy Link". The invite link format (`https://domain/?room=CODE`) is shareable with any participant.
3. **Incoming Participant Joining:**
   - If the user is unauthenticated, the invite code is safely stored in `sessionStorage` across login/signup.
   - Upon authentication, `HomePage` reads the invitation code, automatically cleans the address bar via `window.history.replaceState` to prevent repeat joins, and emits `join_room`.
   - The server validates room existence, registers the participant with default role `Participant`, and broadcasts `user_joined` to all room occupants.

### 3. Authoritative Playback Synchronization
1. **Host/Moderator Action:** When a controller presses Play, Pause, seeks the timeline, or pastes a YouTube URL/ID, the client emits the corresponding event (`play`, `pause`, `seek`, `change_video`).
2. **Server-Side Validation & Calculation:** The server verifies that the socket belongs to a Host or Moderator. For play/pause, it calculates the authoritative timestamp via `getEffectiveCurrentTime(room)` to account for elapsed streaming time.
3. **Room Broadcast:** The server emits `sync_state` to all sockets subscribed to `room.id`.
4. **Client Video Synchronization:** Each client player receives the authoritative payload and programmatically executes `player.playVideo()`, `player.pauseVideo()`, `player.seekTo()`, or `player.loadVideoById()`. Re-sync triggers only when drift exceeds 2 seconds to avoid stutter.

### 4. Role-Based Moderation & Request Approval Queue
1. **Direct Action Restriction:** If a Participant emits a raw playback event, the server rejects it with an `action_error` ("Unauthorized. Only Host and Moderator can control playback").
2. **Control Request Submission:** Participants submit requests via `request_control` (`play`, `pause`, `seek`, `change_video`).
3. **Approval Queue:** The server registers the request into `pendingRequests` and routes `control_requested` exclusively to Host and Moderator sockets.
4. **Host/Mod Decision:**
   - **Approval (`approve_control_request`):** The server mutates the authoritative playback state, broadcasts `sync_state` to the room, and notifies the requester with `control_request_result` (`approved`).
   - **Rejection (`reject_control_request`):** The server prunes the request and notifies the requester with `control_request_result` (`rejected`) without altering playback.
5. **Participant Management:** The Host can promote Participants to Moderator, demote Moderators back to Participant (`assign_role`), or forcefully eject users (`remove_participant`).

---

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
│   ├── index.js                  # HTTP and Socket.IO server entrypoint
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
