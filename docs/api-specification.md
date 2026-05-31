# Learnova API Specification

This document details the major backend REST API routes exposed by the Learnova application.

## 🔐 Authentication & Session Headers

All endpoints under `/api/` (except public endpoints) require session verification.

- **Header Requirement**: Authentication headers should supply the Firebase Bearer token:
  ```http
  Authorization: Bearer <firebase-id-token>
  ```

---

## 📌 Authentication Endpoints

### `GET /api/auth/me`
Retrieves details of the currently authenticated user session.

- **Response Body (`200 OK`)**:
  ```json
  {
    "success": true,
    "user": {
      "uid": "user_id_xyz",
      "email": "student@learnova.edu",
      "name": "Jane Doe",
      "role": "student"
    }
  }
  ```
- **Response (`401 Unauthorized`)**: Missing or expired auth token.

---

## 📌 Notices Endpoints

### `GET /api/notices`
Retrieves public and target department/group notice boards.

- **Query Parameters**:
  - `department` (optional): Filter notices by department (e.g. `CS`, `EE`).
  - `limit` (optional): Number of records (default `20`).
- **Response Body (`200 OK`)**:
  ```json
  {
    "success": true,
    "notices": [
      {
        "id": "notice_1",
        "title": "Midterm Examination Schedule",
        "content": "Schedules have been updated...",
        "department": "CS",
        "createdAt": "2026-05-30T12:00:00Z"
      }
    ]
  }
  ```

---

## 📌 Flashcards Endpoints

### `GET /api/flashcards`
Retrieves student-specific study flashcard decks.

- **Response Body (`200 OK`)**:
  ```json
  {
    "success": true,
    "decks": [
      {
        "id": "deck_1",
        "title": "Systems Architecture",
        "cardsCount": 15,
        "lastStudied": "2026-05-29T10:00:00Z"
      }
    ]
  }
  ```
