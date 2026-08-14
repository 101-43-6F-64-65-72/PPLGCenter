# 14 — Sequence Diagrams

> **MASTER DOCUMENTATION** · StudentCenter · PHASE 022A
> Rule applied: never assume, never hallucinate. Unverifiable statements are marked **"Cannot verify from repository."**

## Table of Contents

1. [1. Login](#1-login)
2. [2. Create Announcement + Comment](#2-create-announcement--comment)
3. [3. Facility Booking with Conflict Check](#3-facility-booking-with-conflict-check)
4. [4. Assignment Submission (Past-Due & Duplicate Rules)](#4-assignment-submission-past-due--duplicate-rules)
5. [5. Proposal Review Flow](#5-proposal-review-flow)
6. [6. Notification Trigger](#6-notification-trigger)
7. [7. Extracurricular Join](#7-extracurricular-join)

---

## 1. Login

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend (LoginForm)
    participant B as Backend (AuthController)
    participant S as UserService
    participant J as JwtService
    participant DB as AppDbContext

    U->>F: submit credentials
    F->>F: zod validate (identifier>=4, password>=6)
    F->>B: POST /api/v1/auth/login {identifier, password}
    Note over B: ⚠ path+field mismatch (backend /api/auth/login + email)
    B->>S: GetByEmailAsync(email)
    S->>DB: query user
    DB-->>S: user / null
    alt not found or bad password
        S-->>B: UnauthorizedAccessException
        B-->>F: 401
        F-->>U: error message
    else ok
        S-->>J: build claims
        J-->>S: JWT (60 min)
        S-->>B: LoginResponse
        B-->>F: 200 {token, fullName, email, role}
        F->>F: persist token (localStorage + cookie)
        F-->>U: redirect to /profile
    end
```

---

## 2. Create Announcement + Comment

```mermaid
sequenceDiagram
    participant O as OSIS/Admin
    participant C as AnnouncementsController
    participant S as AnnouncementService
    participant DB as AppDbContext

    O->>C: POST /api/announcements {title, content}
    C->>C: [Authorize(Roles=Admin,OSIS)]
    C->>S: CreateAsync(dto, currentUser)
    S->>DB: Add + SaveChanges
    DB-->>S: announcement id
    S-->>C: AnnouncementResponse
    C-->>O: 201 ApiResponse

    O->>C: POST /api/announcements/{id}/comments {content}
    C->>S: AddCommentAsync(id, dto, user)
    S->>DB: validate announcement exists
    alt missing
        S-->>C: throw KeyNotFoundException -> 400
    else ok
        S->>DB: Add comment + SaveChanges
        S-->>C: CommentResponse
        C-->>O: 200/201
    end
```

---

## 3. Facility Booking with Conflict Check

```mermaid
sequenceDiagram
    participant S as Student
    participant C as BookingsController
    participant B as FacilityBookingService
    participant DB as AppDbContext

    S->>C: POST /api/bookings {facilityId, startTime, endTime}
    C->>B: CreateAsync(dto, user)
    B->>DB: query overlapping bookings (facilityId, [start,end])
    alt overlap found
        B-->>C: throw InvalidOperationException
        C-->>S: 409 Conflict
    else free
        B->>DB: Add booking (Pending) + SaveChanges
        B-->>C: BookingResponse
        C-->>S: 200/201 Pending
    end
```

---

## 4. Assignment Submission (Past-Due & Duplicate Rules)

```mermaid
sequenceDiagram
    participant S as Student
    participant C as SubmissionsController
    participant Sub as SubmissionService
    participant DB as AppDbContext

    S->>C: POST /api/assignments/{id}/submissions
    C->>Sub: SubmitAsync(assignmentId, dto, student)
    Sub->>DB: load assignment + existing submission
    alt assignment missing
        Sub-->>C: KeyNotFoundException -> 400
    else now > dueDate
        Sub-->>C: conflict/argument -> 400/409 (past-due)
    else existing submission
        Sub-->>C: duplicate -> 409
    else ok
        Sub->>DB: Add + SaveChanges
        Sub-->>C: SubmissionResponse
        C-->>S: 201
    end
```

---

## 5. Proposal Review Flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant C as ProposalsController
    participant P as ProposalService
    participant N as NotificationService
    participant DB as AppDbContext

    A->>C: PUT /api/proposals/{id}/review {status, reason}
    C->>C: [Authorize(Roles=Admin)]
    C->>P: ReviewAsync(id, dto)
    P->>DB: load proposal
    P->>P: set Status + RejectionReason
    P->>DB: SaveChanges
    P->>N: NotifyUserAsync(submitter, type=Proposal, refId)
    N->>DB: create notification
    P-->>C: ProposalResponse
    C-->>A: 200
```

---

## 6. Notification Trigger

```mermaid
sequenceDiagram
    participant Svc as Any Service (Proposal/Booking/Assignment)
    participant N as NotificationService
    participant DB as AppDbContext
    participant U as Target User

    Svc->>N: NotifyUserAsync(userId, type, title, message, refId?)
    N->>N: build Notification entity
    N->>DB: Add + SaveChanges
    N-->>Svc: ok
    U->>N: GET /api/notifications (list)
    U->>N: GET /api/notifications/unread-count
    U->>N: PUT /api/notifications/{id}/read
    N->>DB: IsRead=true + SaveChanges
```

---

## 7. Extracurricular Join

```mermaid
sequenceDiagram
    participant S as Student
    participant C as ExtracurricularsController
    participant X as ExtracurricularService
    participant DB as AppDbContext

    S->>C: POST /api/extracurriculars/{id}/join
    C->>X: JoinAsync(id, student)
    X->>DB: validate club exists
    alt already member (unique index)
        X-->>C: duplicate -> 409
    else ok
        X->>DB: Add member + SaveChanges
        X-->>C: ok
        C-->>S: 200
    end
```

---

*Cross-references: [12_Feature_Flow](12_Feature_Flow.md) · [13_Request_Response_Flow](13_Request_Response_Flow.md) · [02_System_Architecture](02_System_Architecture.md)*
