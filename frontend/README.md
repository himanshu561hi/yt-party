# YouTube Watch Party - Frontend

A modular, component-driven React Single Page Application (SPA) built with Vite and Tailwind CSS for the YouTube Watch Party System.

## Stack

- React 19
- Vite 6
- Tailwind CSS v4
- Socket.IO Client
- YouTube IFrame Player API

## Project Structure

```text
frontend/src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx         # Login form with client validation
│   │   └── SignupForm.jsx        # Signup form with confirmation check
│   ├── room/
│   │   ├── RoomHeader.jsx        # Room info, code copy, role badge, leave button
│   │   ├── ParticipantList.jsx   # Live roster with Host role management & removal
│   │   ├── PlaybackControls.jsx  # Authoritative scrubber, play/pause, change video
│   │   ├── ControlRequestForm.jsx# Participant play/pause/seek/video request inputs
│   │   └── PendingRequests.jsx   # Host/Moderator request approval queue
│   └── YouTubePlayer.jsx         # YouTube IFrame API integration with click interception
├── pages/
│   ├── HomePage.jsx              # Welcome greeting, room creation, and room join forms
│   ├── LoginPage.jsx             # User sign-in page
│   ├── SignupPage.jsx            # User registration page
│   └── RoomPage.jsx              # Watch party stage, controls, and participant roster
├── hooks/
│   ├── useAuth.jsx               # AuthContext and useAuth hook for session management
│   └── useRoomSocket.js          # Socket.IO connection and room lifecycle hook
├── services/
│   └── authService.js            # REST client for /api/auth endpoints
├── utils/
│   └── youtube.js                # URL and 11-char video ID parser
├── socket.js                     # Socket.IO client instance with auth token handshake
├── App.jsx                       # Application routing and error handling shell
├── main.jsx                      # Vite React root mounting
└── index.css                     # Tailwind CSS styling
```

## Features

- User Authentication: Secure Login and Signup flows connected to the backend auth API. Sessions persist across reloads.
- Authenticated WebSockets: Automatically attaches JWT tokens to the Socket.IO connection handshake.
- YouTube Synchronization: Official YouTube IFrame Player integration with synchronized play, pause, seek, and video changes.
- Built-In Control Restriction: Native YouTube controls and pointer events are disabled on the iframe to prevent participants from bypassing the room's shared playback state.
- Role-Based Controls:
  - Host: Full room control, role management (promote/demote), participant removal.
  - Moderator: Direct playback controls and request approval/rejection.
  - Participant: Synchronized viewing only, with dedicated request controls.
- Approval Workflow: Real-time request approval queue for Host and Moderator with instant result notifications for participants.
- Single Source of Truth: All shared playback commands are validated on the backend and broadcast via `sync_state`.

## Setup and Installation

1. Install dependencies:
```bash
npm install
```

2. Environment configuration:
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configuration variables:
```text
VITE_SERVER_URL=http://localhost:5001
```

3. Development server:
```bash
npm run dev
```

4. Production build:
```bash
npm run build
```

5. Preview production build:
```bash
npm run preview
```
