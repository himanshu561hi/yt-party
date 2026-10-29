# YouTube Watch Party - Backend

A simple real-time backend service for a synchronized YouTube watch party web application. Built with Node.js, Express, and Socket.IO.

## Features

- Room management: Create and join watch rooms using short room codes.
- Role-based permissions:
  - Host: Room creator with full playback controls, ability to promote participants to Moderator, and remove users.
  - Moderator: Can control video playback and approve participant requests.
  - Participant: Synchronized viewer. Cannot directly change playback, but can request playback changes.
- Real-time video sync: Broadcasts play, pause, seek, and video changes to everyone in the room.
- Control request workflow: Participants can request an action (play, pause, seek, change video), which takes effect once approved by a Host or Moderator.
- Automatic cleanup: Empty rooms and disconnected sessions are cleaned up automatically.
- Health check: Simple GET /health endpoint for server monitoring.

## Tech Stack

- Runtime: Node.js (ES modules)
- Framework: Express.js
- Real-Time Layer: Socket.IO

## Project Structure

```
backend/
├── src/
│   ├── app.js               # Express application and CORS setup
│   ├── config/
│   │   └── db.js            # Database config helper (optional)
│   └── socket/
│       ├── roomHandler.js   # Socket.IO event listeners and dispatchers
│       └── roomManager.js   # In-memory room state, validation, and permissions
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
Copy the example environment file:
```bash
cp .env.example .env
```

Default variables:
```
PORT=5001
CLIENT_ORIGIN=http://localhost:5173
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

## Health Check

- URL: `http://localhost:5001/health`
- Method: `GET`
- Response:
```json
{
  "status": "ok"
}
```

## How It Works

### Flow
Client connects via Socket.IO -> Server validates input and role permissions -> Updates in-memory room state -> Broadcasts updates to all sockets in that room.

### Video Playback
The backend does not stream or download YouTube videos. It only tracks and synchronizes the metadata:
- `videoId` (11-character YouTube ID)
- `playState` ("playing" or "paused")
- `currentTime` (playback position in seconds)

The frontend uses the YouTube IFrame Player API to control video playback based on these events.

## Socket.IO Events

### Room Events
- `create_room` (Client to Server): `{ username: "Alice" }` -> Responds with `room_created`.
- `join_room` (Client to Server): `{ roomId: "a1b2c3", username: "Bob" }` -> Responds with `room_joined`, broadcasts `user_joined` to the room, and sends `sync_state` to the joiner.
- `leave_room` (Client to Server): Leaves current room, broadcasts `user_left`.

### Host Moderation Events
- `assign_role` (Host only): `{ userId: "user_123", role: "Moderator" }` -> Broadcasts `role_assigned`.
- `remove_participant` (Host only): `{ userId: "user_123" }` -> Removes user and broadcasts `participant_removed`.

### Playback Events (Host and Moderator)
- `play`: `{ time: 10 }` -> Updates room playState to "playing" and broadcasts `sync_state`.
- `pause`: `{ time: 25 }` -> Updates room playState to "paused" and broadcasts `sync_state`.
- `seek`: `{ time: 120 }` -> Updates currentTime and broadcasts `sync_state`.
- `change_video`: `{ videoId: "dQw4w9WgXcQ" }` -> Sets new video ID, resets currentTime to 0, and broadcasts `sync_state`.

### Participant Control Requests
- `request_control` (Participant): `{ action: "play|pause|seek|change_video", payload: { time?, videoId? } }` -> Sends `control_requested` to Host and Moderators.
- `approve_control_request` (Host or Moderator): `{ requestId: "req_123" }` -> Applies the change, broadcasts `sync_state`, and notifies requester via `control_request_result`.
- `reject_control_request` (Host or Moderator): `{ requestId: "req_123" }` -> Leaves state unchanged and notifies requester via `control_request_result`.

### Error Handling
- `action_error`: Emitted back to the sender when an invalid action, bad payload, or unauthorized request occurs.

## Notes

- Room state is stored in memory for simplicity and fast synchronization. Rooms reset if the server is restarted.
- Video IDs must be the standard 11-character YouTube video ID (the frontend should extract this from URLs before sending).
