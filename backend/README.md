# YouTube Watch Party - Backend

A real-time backend service for a synchronized YouTube watch party web application. Built with Node.js, Express, Mongoose, and Socket.IO.

## Features

- User Authentication: Secure signup, login, current session (`/api/auth/me`), and logout using salted scrypt password hashing and HMAC-SHA256 JWT tokens.
- WebSocket Authentication: Socket.IO handshake authentication verifying JWT tokens before allowing connections.
- Authoritative Identity: User identity (`userId`, `username`, `email`) is resolved directly from authenticated socket sessions, preventing identity spoofing.
- Room Management: Create and join watch party rooms using unique 6-character room codes.
- Role-Based Access Control (RBAC):
  - Host: Full room controls, video playback, promoting Participants to Moderator, demoting Moderators to Participant, and removing participants.
  - Moderator: Direct playback controls (play, pause, seek, change video) and request approval/rejection.
  - Participant: Synchronized viewing only. Cannot directly change playback; can submit requests to play, pause, seek, or change video.
- Playback Synchronization: Server is the single source of truth for `videoId`, `playState`, and `currentTime`.
- Control Request Workflow: Approval queue allowing Host and Moderator to approve or reject participant requests in real time.
- Automatic Cleanup: Empty rooms and disconnected sessions are cleaned up automatically.
- Health Check: `GET /health` endpoint for monitoring.

## Tech Stack

- Runtime: Node.js (ES modules)
- Framework: Express.js
- Database: MongoDB via Mongoose (with in-memory fallback)
- Real-Time Layer: Socket.IO
- Cryptography: Node.js built-in `crypto` (scrypt, HMAC-SHA256, timingSafeEqual)

## Project Structure

```text
backend/
├── src/
│   ├── app.js               # Express application, CORS, and middleware
│   ├── config/
│   │   └── db.js            # MongoDB / Mongoose connection
│   ├── controllers/
│   │   └── authController.js# Signup, login, me, logout handlers
│   ├── middleware/
│   │   └── auth.js          # Express and Socket.IO auth middlewares
│   ├── models/
│   │   └── User.js          # User schema and repository
│   ├── routes/
│   │   └── authRoutes.js    # /api/auth router
│   ├── socket/
│   │   ├── roomHandler.js   # Authenticated Socket.IO event handlers
│   │   └── roomManager.js   # In-memory room state, playback, and permissions
│   └── utils/
│       └── crypto.js        # Salted scrypt hashing and JWT token utility
├── server.js                # Server entry point (HTTP + Socket.IO)
├── package.json
└── .env.example
```

## Setup and Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configuration variables:
```text
PORT=5001
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/watchparty?retryWrites=true&w=majority
JWT_SECRET=your-secure-jwt-secret-key-at-least-32-chars
```

3. Run the server:
- Development mode (with auto-restart):
```bash
npm run dev
```

- Production mode:
```bash
npm start
```

## HTTP Endpoints

### Authentication
- `POST /api/auth/signup`: `{ name, email, password, confirmPassword }` -> 201 Created with `{ user, token }` and HttpOnly cookie.
- `POST /api/auth/login`: `{ email, password }` -> 200 OK with `{ user, token }` and HttpOnly cookie.
- `GET /api/auth/me`: Requires Bearer token or cookie -> 200 OK with `{ user }`.
- `POST /api/auth/logout`: Clears session cookie -> 200 OK.

### Rooms (MongoDB Persistence)
- `GET /api/rooms`: Returns active rooms stored in MongoDB.
- `GET /api/rooms/:roomId`: Returns details and playback metadata of a room by room code.

### Health
- `GET /health` -> 200 OK with `{"status": "ok"}`.

## Socket.IO Events

### Authentication Handshake
Clients must provide a valid JWT token in `auth: { token }` or in an HttpOnly cookie during handshake. Unauthenticated connections are rejected.

### Room Events
- `create_room`: Emits `room_created` with new room ID and sets authenticated user as `Host`.
- `join_room`: `{ roomId }` -> Emits `room_joined` with room metadata, broadcasts `user_joined` to room members, and sends `sync_state`.
- `leave_room`: Leaves room, broadcasts `user_left`.

### Moderation Events (Host only)
- `assign_role`: `{ userId, role: "Moderator" | "Participant" }` -> Broadcasts `role_assigned`.
- `remove_participant`: `{ userId }` -> Broadcasts `participant_removed` and ejects target socket.

### Playback Events (Host and Moderator)
- `play`: `{ time }` -> Sets room state to `playing` and broadcasts `sync_state`.
- `pause`: `{ time }` -> Sets room state to `paused` and broadcasts `sync_state`.
- `seek`: `{ time }` -> Updates `currentTime` and broadcasts `sync_state`.
- `change_video`: `{ videoId }` -> Sets new video ID, resets `currentTime` to 0, and broadcasts `sync_state`.

### Participant Control Requests
- `request_control`: `{ action, payload }` -> Sends `control_requested` to Host and Moderator.
- `approve_control_request`: `{ requestId }` -> Applies action, broadcasts `sync_state`, and sends `control_request_result` to requester.
- `reject_control_request`: `{ requestId }` -> Leaves state unchanged and sends `control_request_result` to requester.

## Deployment Guide

### Architecture Considerations: Vercel vs. Persistent Hosts

- **Vercel**: Vercel is a serverless platform designed for ephemeral, stateless HTTP functions. It automatically deploys the Express REST API (`/api/auth/*` and `/health`) using `api/index.js` and `vercel.json`. However, serverless functions terminate immediately after sending a response and do not support long-lived persistent TCP WebSocket connections or in-memory rooms.
- **Render / Railway / Fly.io (Recommended for Full Socket.IO Watch Party)**: Persistent Node.js container hosts run continuous server processes, supporting persistent Socket.IO connections, real-time room state, and authoritative playback loops.

### Option 1: Deploying Backend to Vercel (REST API)

1. Connect your repository to Vercel.
2. In Project Settings:
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
3. Add Environment Variables in Vercel:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A secure random secret string (32+ characters).
   - `CLIENT_ORIGIN`: Your frontend URL (e.g., `https://your-frontend.vercel.app`).
4. Deploy. Vercel routes all requests to `api/index.js` via `vercel.json`.

### Option 2: Deploying Full Backend to Render (Socket.IO + REST API)

1. Go to [Render Dashboard](https://dashboard.render.com/) and create a new **Web Service**.
2. Connect your `yt-party` repository.
3. Configure the service:
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5001`
   - `MONGODB_URI`: Your MongoDB connection string.
   - `JWT_SECRET`: Your secret key.
   - `CLIENT_ORIGIN`: Your Vercel frontend URL (e.g., `https://your-app.vercel.app`).

### Recommended Full Stack Setup

- **Frontend**: Deploy `frontend/` on Vercel with environment variable `VITE_SERVER_URL=https://your-backend.onrender.com`.
- **Backend**: Deploy `backend/` on Render with `CLIENT_ORIGIN=https://your-frontend.vercel.app`.
