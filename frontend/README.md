# YouTube Watch Party - Frontend

A React Single Page Application (SPA) built with Vite and Tailwind CSS for the YouTube Watch Party System.

## Stack

- React 19
- Vite 6
- Tailwind CSS v4
- Socket.IO Client
- YouTube IFrame Player API

## Features

- Room Lifecycle: Create new watch party rooms or join existing ones using 6-character room codes.
- YouTube Synchronization: Official YouTube IFrame Player integration with synchronized play, pause, seek, and video changes.
- Role-Based Permissions:
  - Host: Controls video playback, promotes Participants to Moderator, demotes Moderators back to Participant, and removes participants.
  - Moderator: Controls playback directly and approves or rejects participant control requests.
  - Participant: Watches in sync with direct controls disabled, but can submit requests to play, pause, seek, or change video.
- Control Request Queue: Real-time request approval/rejection interface for Host and Moderator with instant feedback to the requester.
- Resilient Connection: Automatic reconnection handling with server status indicator and error notifications.

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

Default variable:
```
VITE_SERVER_URL=http://localhost:5001
```

3. Development server:
```bash
npm run dev
```
Runs the Vite development server on `http://localhost:5173`.

4. Production build:
```bash
npm run build
```
Generates production-ready static assets in the `dist/` directory.

5. Preview production build:
```bash
npm run preview
```
