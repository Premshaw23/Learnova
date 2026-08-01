## Description

Learnova currently has no real-time collaborative features for studying. Students cannot study together in real-time, share notes, or collaborate on problem sets. The existing chatbot (`LearnovaChatbot.jsx`) is single-user only, and the whiteboard (`VirtualWhiteboard.jsx`) has no multi-user support. Meanwhile, the platform already has Redis infrastructure (`lib/redis.js`, `lib/sessionManager.js`) and Server-Sent Events (`lib/ssePublisher.js`) that could be leveraged for real-time collaboration.

## Why This Is Important

- **Student engagement gap**: Competing platforms (Google Classroom, Notion, Miro) all offer real-time collaboration
- **Unused infrastructure**: Redis pub/sub, SSE streams, and session management are already in place but underutilized
- **Study group feature**: Parents and teachers have requested study groups (see feature request #4196 - Peer-to-Peer Tutoring)
- **Exam preparation**: Students preparing for exams need to study together, share annotations, and quiz each other in real-time

## Proposed Implementation

### 1. Real-Time Collaborative Study Room Backend
- Create `app/api/study-rooms/route.js` for room CRUD operations
- Create `app/api/study-rooms/[roomId]/route.js` for room-specific operations
- Create `app/api/study-rooms/[roomId]/participants/route.js` for participant management
- Implement Redis pub/sub for broadcasting room events to all participants
- Add room presence tracking with heartbeat-based activity detection

### 2. WebSocket/Server-Sent Events Integration
- Extend `lib/ssePublisher.js` to support bidirectional room communication
- Create `lib/studyRoomManager.js` for managing room state, participants, and messages
- Implement operational transformation for collaborative text editing
- Add cursor position sharing for real-time presence indicators

### 3. Frontend Components
- Create `components/study-rooms/StudyRoom.jsx` - Main study room container
- Create `components/study-rooms/RoomLobby.jsx` - Room creation and joining UI
- Create `components/study-rooms/CollaborativeEditor.jsx` - Shared text editor
- Create `components/study-rooms/SharedWhiteboard.jsx` - Multi-user whiteboard wrapper around Excalidraw
- Create `components/study-rooms/ParticipantList.jsx` - Real-time participant presence
- Create `components/study-rooms/ChatPanel.jsx` - In-room text chat
- Create `components/study-rooms/QuizBuzzer.jsx` - Real-time quiz buzzer game

### 4. Room Features
- **Text Collaboration**: Multiple students editing the same document with cursor presence
- **Shared Whiteboard**: Real-time drawing with Excalidraw multi-user support
- **Study Timer**: Shared Pomodoro timer with synchronized breaks
- **Quiz Mode**: Teacher creates questions, students buzz in to answer
- **Screen Sharing**: Share textbook pages or problem sets
- **Session Recording**: Save study session notes and whiteboard snapshots

### 5. Integration with Existing Features
- Link study rooms to courses (auto-create rooms per course)
- Track study room participation in the gamification system
- Generate study session reports for parent dashboard
- Export study room notes to student portfolio

### 6. Scalability & Performance
- Implement room capacity limits (max 10 participants per room)
- Add rate limiting for room messages
- Use Redis Streams for reliable message delivery
- Implement graceful degradation when Redis is unavailable

## Files to Modify/Create
- `app/api/study-rooms/route.js` - Room CRUD API
- `app/api/study-rooms/[roomId]/route.js` - Room operations
- `app/api/study-rooms/[roomId]/participants/route.js` - Participant management
- `app/api/study-rooms/[roomId]/messages/route.js` - Message history
- `lib/studyRoomManager.js` - Room state management
- `lib/studyRoomEvents.js` - Event types and handlers
- `components/study-rooms/StudyRoom.jsx` - Main container
- `components/study-rooms/RoomLobby.jsx` - Lobby UI
- `components/study-rooms/CollaborativeEditor.jsx` - Shared editor
- `components/study-rooms/SharedWhiteboard.jsx` - Multi-user whiteboard
- `components/study-rooms/ParticipantList.jsx` - Presence indicators
- `components/study-rooms/ChatPanel.jsx` - Room chat
- `components/study-rooms/QuizBuzzer.jsx` - Quiz game mode
- `app/study-rooms/page.js` - Study rooms listing page
- `app/study-rooms/[roomId]/page.js` - Individual room page
- `lib/gamification-service.js` - Add study room XP rewards
- `tests/api/study-rooms.test.js` - API tests
- `tests/e2e/study-rooms/collaboration.spec.js` - E2E tests

## Expected Impact

- **Student Engagement**: Real-time collaboration increases platform stickiness
- **Feature Parity**: Matches capabilities of Google Classroom and Notion
- **Gamification Extension**: New XP sources for study collaboration
- **Parent Visibility**: Study session reports on parent dashboard
