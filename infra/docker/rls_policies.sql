-- ====================================================================
-- STUDENTCENTER RLS POLICIES FOR SUPABASE PROJECT ryskvrqcrytmdsorviie
-- ====================================================================

-- 1. Enable Row Level Security on all 16 application tables
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Announcements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Materials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CalendarEvents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnnouncementComments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnnouncementReactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Facilities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FacilityBookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Proposals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Extracurriculars" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExtracurricularMembers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attendances" ENABLE ROW LEVEL SECURITY;

-- 2. Service Role Policy (EF Core Npgsql Direct Pooled Connection - Full Access)
CREATE POLICY "ServiceRole_Users_Access" ON "Users" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "ServiceRole_Announcements_Access" ON "Announcements" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "ServiceRole_Materials_Access" ON "Materials" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "ServiceRole_Assignments_Access" ON "Assignments" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "ServiceRole_Submissions_Access" ON "Submissions" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "ServiceRole_Facilities_Access" ON "Facilities" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "ServiceRole_Proposals_Access" ON "Proposals" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Authenticated Student Policy (Read Own Submissions & Notifications)
CREATE POLICY "Student_Read_Own_Submissions" ON "Submissions" FOR SELECT TO authenticated 
USING ("StudentId" = (SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid));

-- 4. Teacher Policy (Manage Academic Materials)
CREATE POLICY "Teacher_Manage_Materials" ON "Materials" FOR ALL TO authenticated 
USING ((SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'role', '')) IN ('Teacher', 'Admin', '1', '0'));

-- 5. Admin Policy (Full Access for Admin Role)
CREATE POLICY "Admin_Users_Management" ON "Users" FOR ALL TO authenticated 
USING ((SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'role', '')) IN ('Admin', '0'));
