---
tags:
  - backend
  - moc
aliases:
  - MOC - Backend
---

# MOC - Backend

Map of Content for the ASP.NET Core backend.

## Architecture

- [[Architecture]]
- [[Clean Architecture]]
- [[Dependency Rules]]
- [[Request Pipeline]]
- [[Tech Stack]]

## Entities

- [[Entity - User]]
- [[Entity - Announcement]]
- [[Entity - Material]]
- [[Entity - Assignment]]
- [[Entity - Submission]]
- [[Entity - Calendar Event]]
- [[Entity - Announcement Comment]]
- [[Entity - Announcement Reaction]]
- [[Entity - Notification]]
- [[Entity - Facility]]
- [[Entity - Facility Booking]]
- [[Entity - Proposal]]
- [[Entity - Extracurricular]]
- [[Entity - Extracurricular Member]]
- [[Entity - Attendance]]

## Services

- [[Authentication]] (UserService, JwtService, CurrentUserService)
- [[JWT]] (Token generation and validation)
- [[Announcements]] (AnnouncementService, AnnouncementCommentService, AnnouncementReactionService)
- [[Feature - Materials]] (MaterialService)
- [[Feature - Assignment]] (AssignmentService, SubmissionService)
- [[Feature - School Calendar]] (CalendarService)
- [[Feature - Digital Bulletin Board]] (AnnouncementCommentService, AnnouncementReactionService)
- [[Feature - Notification]] (NotificationService)
- [[Feature - Facility Booking]] (FacilityService, BookingService)
- [[Feature - Proposals]] (ProposalService)
- [[Feature - Extracurricular]] (ExtracurricularService)

## API

- [[API Contract]]
- [[User Roles]]

## Database

- [[Database Schema]]
- [[Database ERD]]
- [[Migrations]]

## Configuration

- [[Backend Overview]]

## Related MOCs

- [[MOC - Architecture]]
- [[MOC - Database]]
- [[Home]]
