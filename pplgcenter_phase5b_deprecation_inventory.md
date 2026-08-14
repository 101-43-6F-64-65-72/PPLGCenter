# PPLG CENTER — PHASE 5B DEPRECATION INVENTORY

**Date:** 2026-08-13  
**Auditor:** Principal Software Architect / Senior .NET + Next.js + PostgreSQL Engineer  
**Scope:** Application-level decoupling of out-of-scope Student Center domains while preserving database schema compatibility.

---

## Deprecation & Decoupling Matrix

| Domain | Current Dependency | Refactored in Phase 5B? | Remaining Compatibility Dependency | Future Removal Phase |
|---|---|---|---|---|
| **OSIS Recruitment** | `OsisPositions`, `OsisApplications`, `OsisRecruitmentController`, `/osis/recruitment` UI route | **YES** (Removed from primary navigation, API routes isolated) | Legacy database tables co-exist in Supabase schema without breaking EF Core model. | **Phase 6+ (DB Migration)** |
| **Pemilos / Elections** | `Elections`, `CandidatePairs`, `CandidatePairVotes`, `ElectionsController`, `CandidatePairsController`, `/pemilos` UI route | **YES** (Removed from primary navigation, API routes isolated) | Legacy database tables co-exist in Supabase schema without breaking EF Core model. | **Phase 6+ (DB Migration)** |
| **Non-PPLG Clubs** | `Extracurriculars`, `ExtracurricularMembers`, `ExtracurricularAdvisors`, `ExtracurricularsController`, `/ekstrakurikuler` UI route | **YES** (Removed from primary navigation, API routes isolated) | Legacy database tables co-exist in Supabase schema without breaking EF Core model. | **Phase 6+ (DB Migration)** |
| **Legacy Direct Messaging** | `Conversations`, `ConversationMembers`, `Messages`, `MessageAttachments`, `MessageService.cs` | **YES** (PPLG Community messaging defaults strictly to `CommunityGroups` & `GroupMessages`) | Retained as compatibility service for 1-on-1 direct user messaging. | **Phase 6+ (Optional)** |
| **Legacy Forum** | `DiscussionThreads`, `DiscussionReplies`, `DiscussionsController.cs` | **NO** (Retained as academic discussion forum compatibility layer) | Active backend EF Core `DbSet` and controller mappings intact for academic discussions. | **Phase 6+ (Optional)** |

---

## Architectural Isolation Summary

- **Database Preservation:** Zero tables dropped, zero columns modified, zero schema migrations executed (respecting Hard Safety Rules).
- **Navigation Isolation:** Primary `Navbar` and UI entry points now display pure **PPLG Center** branding and routes (`/kelas`, `/perpustakaan`, `/komunitas`, `/fasilitas`, `/profile`, `/proposal`, `/mading`, `/kalender`).
- **Build & Test Verification:** 100% pass rate maintained across all 145 backend unit tests and 28 Next.js App Router pages.
