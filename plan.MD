Absolutely. Here is a **focused MVP PRD in English** for your **personal GitHub portfolio project**.

---

# Product Requirements Document

## Product Name

**QuizArena MVP - Online Quiz Platform**

## 1. Product Overview

QuizArena is a web-based quiz platform where admins can create quizzes, and users can take them within a time limit. After submission, users can see their scores and a leaderboard, while admins can review basic quiz analytics.

This MVP is designed for a **portfolio-quality fullstack project** that demonstrates practical product thinking and solid engineering skills without becoming too large in scope.

---

## 2. Product Goal

The goal of this MVP is to build a functional online quiz system with the most important core features:

* Create and manage quizzes
* Take quizzes with a timer
* Show leaderboard results
* Display basic quiz analytics

This project should be polished enough to showcase on GitHub as a realistic fullstack application.

---

## 3. Target Users

### Admin

A user who creates and manages quizzes.

Main needs:

* Create quiz
* Add questions
* View quiz results
* View analytics

### Participant

A user who takes quizzes.

Main needs:

* Start a quiz
* Answer questions within the time limit
* Submit quiz
* See final score and leaderboard

---

## 4. MVP Scope

### In Scope

* Admin can create quizzes
* Admin can add multiple-choice questions
* Participant can start and take a quiz
* Quiz has a countdown timer
* Auto-submit when time runs out
* System calculates score automatically
* Leaderboard shows rankings
* Admin can view basic quiz analytics

### Out of Scope

* Real-time multiplayer
* Essay/open-ended questions
* Quiz categories/tags
* Public/private access control
* Randomized questions
* Certificates
* Email notifications
* Advanced anti-cheat mechanisms

---

## 5. Core Features

## 5.1 Create Quiz

Admin can create a quiz with:

* Title
* Description
* Time limit in minutes
* Publish status

Each quiz can contain multiple multiple-choice questions.

### Question fields

* Question text
* 4 answer options
* 1 correct answer
* Points

---

## 5.2 Take Quiz

Participants can:

* View available quizzes
* Start a quiz
* Answer multiple-choice questions
* Submit manually before time ends
* Be auto-submitted when the timer reaches zero

Rules:

* One submission per attempt
* Score is calculated immediately after submission

---

## 5.3 Timer

Each quiz has a fixed duration.

Requirements:

* Timer starts when the participant begins the quiz
* Remaining time is visible during the attempt
* Quiz is auto-submitted when time expires
* Server should validate submission timing to avoid simple client-side manipulation

### Redis usage in MVP

Redis will be used for:

* Active quiz session timer state
* Temporary attempt state caching
* Faster leaderboard retrieval

---

## 5.4 Leaderboard

Each quiz has a leaderboard showing participant rankings.

Ranking logic:

1. Higher score ranks first
2. If scores are equal, faster completion time ranks higher

Displayed fields:

* Rank
* Participant name
* Score
* Completion time

---

## 5.5 Quiz Analytics

Admin can view basic analytics per quiz.

MVP analytics:

* Total participants
* Average score
* Highest score
* Lowest score
* Completion rate
* Per-question correct answer rate

This feature helps demonstrate dashboard and reporting capability in your portfolio.

---

## 6. User Stories

### Participant

* As a participant, I want to start a quiz easily so I can answer questions right away.
* As a participant, I want to see the remaining time so I can manage my pace.
* As a participant, I want to see my final score after submission.
* As a participant, I want to view the leaderboard so I can compare my performance.

### Admin

* As an admin, I want to create a quiz so participants can take it.
* As an admin, I want to add questions and correct answers so the system can score automatically.
* As an admin, I want to view quiz analytics so I can evaluate participant performance.

---

## 7. User Flow

### Participant Flow

Home page
→ Select quiz
→ Start quiz
→ Answer questions
→ Submit or auto-submit
→ View result
→ View leaderboard

### Admin Flow

Admin login
→ Dashboard
→ Create quiz
→ Add questions
→ Publish quiz
→ View attempts
→ View analytics

---

## 8. Functional Requirements

### Quiz Management

* Admin can create a quiz
* Admin can edit quiz details
* Admin can delete a quiz
* Admin can add, edit, and delete questions
* Admin can publish or unpublish a quiz

### Quiz Attempt

* Participant can view published quizzes
* Participant can start a quiz
* Participant can submit answers
* System stores answers per attempt
* System auto-submits when time expires

### Scoring

* System calculates score based on correct answers
* System stores final score and completion time
* System updates leaderboard after submission

### Analytics

* System provides summary statistics for each quiz
* System provides per-question accuracy rate

---

## 9. Non-Functional Requirements

* Responsive UI for desktop and mobile
* Basic form validation on frontend and backend
* Reliable timer behavior
* Fast leaderboard loading
* Clean and simple user experience
* Secure handling of quiz submission and scoring
* Reasonable performance for multiple active users

---

## 10. Suggested Tech Stack

### Frontend

* React
* React Router
* Axios
* Tailwind CSS
* Chart.js or Recharts

### Backend

* Node.js
* Express.js

### Database

* MongoDB with Mongoose

### Cache / Session Layer

* Redis

---

## 11. Data Model (MVP)

### User

```json
{
  "_id": "ObjectId",
  "name": "John Doe",
  "email": "john@example.com",
  "passwordHash": "hashed_password",
  "role": "admin | participant",
  "createdAt": "Date"
}
```

### Quiz

```json
{
  "_id": "ObjectId",
  "title": "JavaScript Basics",
  "description": "A beginner quiz on JavaScript fundamentals",
  "durationMinutes": 10,
  "status": "draft | published",
  "createdBy": "ObjectId",
  "createdAt": "Date"
}
```

### Question

```json
{
  "_id": "ObjectId",
  "quizId": "ObjectId",
  "questionText": "What is the output of typeof null?",
  "options": ["null", "object", "undefined", "number"],
  "correctAnswer": "object",
  "points": 10,
  "order": 1
}
```

### Attempt

```json
{
  "_id": "ObjectId",
  "quizId": "ObjectId",
  "userId": "ObjectId",
  "startedAt": "Date",
  "submittedAt": "Date",
  "status": "in_progress | submitted | auto_submitted",
  "score": 80,
  "completionTimeSeconds": 420
}
```

### Answer

```json
{
  "_id": "ObjectId",
  "attemptId": "ObjectId",
  "questionId": "ObjectId",
  "selectedAnswer": "object",
  "isCorrect": true,
  "pointsAwarded": 10
}
```

---

## 12. API Endpoints

### Auth

```http
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

### Quizzes

```http
GET /api/quizzes
GET /api/quizzes/:id
POST /api/quizzes
PUT /api/quizzes/:id
DELETE /api/quizzes/:id
PATCH /api/quizzes/:id/publish
```

### Questions

```http
POST /api/quizzes/:id/questions
PUT /api/questions/:id
DELETE /api/questions/:id
```

### Attempts

```http
POST /api/quizzes/:id/start
POST /api/attempts/:id/answer
POST /api/attempts/:id/submit
GET /api/attempts/:id/result
```

### Leaderboard

```http
GET /api/quizzes/:id/leaderboard
```

### Analytics

```http
GET /api/quizzes/:id/analytics
```

---

## 13. Success Criteria for MVP

The MVP is successful if:

* Admin can create and publish a working quiz
* Participant can complete a quiz with a timer
* System calculates score correctly
* Leaderboard ranks users correctly
* Admin dashboard shows basic analytics
* The project is polished enough to demo in a GitHub README or portfolio

---

## 14. Portfolio Positioning

This MVP is strong for a personal GitHub portfolio because it demonstrates:

* Full CRUD operations
* Authentication and role-based access
* Timer/session logic
* Backend scoring engine
* Redis integration
* Analytics dashboard
* End-to-end fullstack architecture

---

## 15. Recommended MVP Pages

### Public / Participant

* Home / Quiz List
* Quiz Detail
* Quiz Attempt Page
* Result Page
* Leaderboard Page

### Admin

* Admin Login
* Admin Dashboard
* Create Quiz Page
* Edit Quiz Page
* Analytics Page

---

---

I can also turn this into a cleaner **one-page startup-style PRD template** or continue with **MVP features breakdown + database schema + folder structure**.
