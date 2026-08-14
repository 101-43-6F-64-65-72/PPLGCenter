# StudentCenter — Admin Guide

## Accessing the Admin Panel

Login with an `Admin` role account → navigate to `/admin`

---

## Panel Super Admin

### Overview Tab
- System statistics: total users, proposals, bookings, announcements
- Quick-access action buttons

### User Management
- View all registered users
- Change user roles: Student → OSIS → Guru → Admin
- Disable/enable accounts
- Delete users

### Proposal Final Review
- View proposals that have passed OSIS + Guru review
- Approve or Reject with notes
- Approved proposals generate notification to submitter

### Facility & Booking Management
- Add, edit, delete facilities and equipment
- View all pending booking requests
- Approve or reject bookings with reason

### Mading Publication
- Publish or unpublish announcements
- Create new announcements with category, title, content, image
- Manage article visibility

---

## Panel Guru (Teacher)

Access at `/guru` with a `Guru` role account.

- **Proposal Approval**: Review OSIS-verified proposals, approve/reject
- **Facility Approval**: Approve or reject facility booking requests from students

---

## Panel OSIS

Access at `/osis` with an `OSIS` role account.

- **Proposal Verification**: First-level review of submitted proposals
- **Facility Booking**: Submit facility reservations on behalf of OSIS
- **Mading Management**: Create and submit announcements for admin publication

---

## System Administration

### User Seeding
Default admin account is seeded at startup from `DEFAULT_ADMIN_PASSWORD` env var.  
Email: `admin@studentcenter.id`

### Database
- Migrations run automatically on startup
- Manual: `dotnet ef database update`

### Health Checks
| Endpoint | Check |
|---|---|
| `/health` | Overall status |
| `/ready` | DB connectivity |
| `/live` | Process alive |

### Logs
Serilog rolling logs at: `backend/logs/app-YYYYMMDD.log`

### Monitoring
- Prometheus: `http://server:9090`
- Grafana: `http://server:3001`
- Alertmanager: `http://server:9093`

### Backup
```powershell
.\scripts\backup-retention.ps1    # Backup + prune old (7-day retention)
.\scripts\restore.ps1 -BackupFile .\backups\studentcenter_YYYYMMDD.sql
```
