# YouTube Watch Party — Frontend Implementation Plan

## Project Rules

- Work on the frontend only unless a phase explicitly requires testing communication with the existing backend.
- Follow the original YouTube Watch Party assignment PDF and the existing backend event contracts as the source of truth.
- Inspect the repository and current files before editing. Preserve useful existing work.
- Do not modify backend source code or backend dependencies during frontend phases.
- Implement only the phase explicitly requested. After each phase, stop and wait for the next instruction.
- Keep the UI basic and functional. Prioritize working features over visual polish.
- Use React, Vite, JavaScript, Tailwind CSS, and `socket.io-client`.
- Prefer Tailwind CSS v4 with the Vite-compatible official setup if compatible with the existing project.
- Avoid UI component libraries, animation libraries, unnecessary dependencies, and unnecessary comments.
- Do not claim that a command or test passed unless it was actually executed.
- Reuse the existing backend Socket.IO event names and payload contracts. Inspect `backend/README.md` and the actual backend handlers before integrating.

## Stack

- React + Vite
- JavaScript
- Tailwind CSS
- Socket.IO Client
- YouTube IFrame Player API for the video player in a later phase

## Environment

Frontend `.env.example` should include:

`VITE_SERVER_URL=http://localhost:5001`

Use `import.meta.env.VITE_SERVER_URL` for the backend URL. Do not hardcode the backend URL elsewhere. Local `.env` files must be ignored by Git.

## Phase 1 — Frontend Foundation

### Goal
Set up the frontend from scratch and display a minimal home screen with backend connection status.

### Tasks
- Inspect the root repository and determine whether `frontend/` already exists.
- Create or update `frontend/` without deleting useful files.
- Set up React + Vite + JavaScript.
- Configure Tailwind CSS using a compatible Vite setup.
- Install `socket.io-client`.
- Create a reusable Socket.IO client connection module using `VITE_SERVER_URL`.
- Add basic connection and disconnection status handling.
- Create a simple responsive home screen containing:
  - YouTube Watch Party title
  - Short description
  - Username input
  - Create Room button
  - Room code input
  - Join Room button
  - Backend connection status
- Buttons are visual only in this phase; do not implement room creation or joining.
- Add suitable frontend npm scripts and Git ignore rules.
- Add or update concise setup documentation without overwriting useful documentation.

### Acceptance Criteria
- Frontend dependencies install successfully.
- Tailwind is configured and styles render.
- Production build succeeds.
- Home screen renders with the required basic fields.
- Connection status is handled without crashing if backend is unavailable.
- Backend source files remain unchanged.

### Do Not Implement Yet
Room creation/joining, video player, playback controls, participants, roles, approvals, authentication, chat, deployment.

## Phase 2 — Create and Join Rooms

### Goal
Connect the home screen to the existing room lifecycle events.

### Tasks
- Inspect the actual backend event handlers and README for exact payloads and response events.
- Implement Create Room using `create_room`.
- Implement Join Room using `join_room`.
- Validate username and room code on the client for usability, while relying on backend validation for security.
- Handle `room_created`, `room_joined`, and `action_error` according to the actual backend contract.
- Store the current user's room data and role in React state.
- On success, show a minimal room view or route with the room ID and role.
- Prevent duplicate event listeners and clean up listeners appropriately.
- Show clear loading and error states.

### Acceptance Criteria
- A user can create a room and is shown as Host.
- A second browser/session can join using the room code and is shown as Participant.
- Invalid room codes show an understandable error.
- Existing backend code is not changed.
- No video player or role-management UI is implemented yet.

## Phase 3 — Watch Room and YouTube Player

### Goal
Render a basic YouTube player and connect it to synchronized backend playback state.

### Tasks
- Build a simple watch room view with the embedded YouTube IFrame Player API.
- Parse a YouTube URL or accept a valid 11-character video ID in the UI, then send only the video ID to the backend.
- Inspect the backend playback event handlers and use their actual payload contracts.
- Listen for `sync_state` and update the player/video when the server state changes.
- Host and Moderator can use play, pause, seek, and change-video controls.
- Participants must not be offered direct playback controls; they will use the request flow in Phase 4.
- Avoid infinite event loops when player state changes trigger client events and server broadcasts.
- Keep the UI basic and responsive.

### Acceptance Criteria
- A valid YouTube video is displayed.
- Accepted backend state updates are reflected in the player.
- Host/Moderator playback actions are synchronized with other clients.
- New joiners display the current video state.
- Invalid YouTube links or IDs show a clear error.
- Do not attempt to stream or download YouTube video content.

## Phase 4 — Roles, Participant List, and Control Requests

### Goal
Expose existing backend roles and participant approval functionality in a basic UI.

### Tasks
- Display the current room participant list and each user's role.
- Listen for and handle participant roster events: `user_joined`, `user_left`, `role_assigned`, and `participant_removed`, using actual backend payloads.
- Host can promote a Participant to Moderator.
- Host can remove a participant.
- Participant can request `play`, `pause`, `seek`, or `change_video` through `request_control`.
- Host and Moderator can see pending requests and approve or reject them through `approve_control_request` and `reject_control_request`.
- Handle `control_requested`, `control_request_result`, and `action_error`.
- Update the UI after role changes, removals, approvals, and rejections.
- Clear local room state if the current user is removed or leaves.

### Acceptance Criteria
- Participant roles and roster stay up to date.
- Only Host sees role assignment and removal controls.
- Host/Moderator see pending control requests.
- Participant requests do not change playback until approved.
- Approval applies the requested action through the backend.
- Removed users cannot continue using the room UI as active members.

## Phase 5 — Integration Verification

### Goal
Verify the complete frontend-backend workflow without adding extra features.

### Tasks
- Run the frontend production build.
- Start backend and frontend using documented commands.
- Test room creation and joining with at least two separate browser sessions.
- Test synchronized play, pause, seek, and video change.
- Test Host and Moderator permissions.
- Test Participant control requests, approval, and rejection.
- Test participant removal, leaving, disconnects, and invalid room codes.
- Fix reproducible frontend integration defects only.
- Document any limitations accurately.

### Acceptance Criteria
- Production build succeeds.
- Main flows work across multiple browser sessions.
- No duplicate Socket.IO listeners or repeated state updates.
- Backend is not changed unless the user explicitly authorizes a backend fix.
- Report actual tests and results.

## Out of Scope Unless Explicitly Requested

- Login/signup, JWT, or authentication
- Chat or emoji reactions
- Host transfer
- Database persistence
- Redis, scaling, analytics, dashboards, or unrelated features
- Fancy animations, complex design systems, component libraries
- Deployment until explicitly requested

## Working Method

For every phase:
1. Read this file and the original assignment PDF.
2. Inspect the current frontend and actual backend event contracts.
3. Implement only the requested phase.
4. Run the relevant checks.
5. Report files changed, commands executed, actual results, and known limitations.
6. Stop and wait for the next phase instruction.
