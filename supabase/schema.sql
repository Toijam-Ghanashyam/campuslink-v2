-- ====================================================================
-- CampusLink v2 Enterprise: Complete Universal Database Schema
-- Paste this script into your Supabase SQL Editor on a fresh project.
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 1. USERS TABLE (Application Profile Mirror)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID DEFAULT 'e9ad5cc3-f368-401f-9363-d478c4b433cc'::uuid,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('STUDENT', 'RECRUITER', 'TPO_ADMIN')),
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 2. STUDENT PROFILES TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tenant_id UUID DEFAULT 'e9ad5cc3-f368-401f-9363-d478c4b433cc'::uuid,
  full_name TEXT,
  roll_number TEXT,
  branch TEXT DEFAULT 'Computer Science & Engineering',
  batch_year INTEGER DEFAULT 2026,
  verified_cgpa NUMERIC(4, 2) NOT NULL DEFAULT 7.50,
  active_backlogs INTEGER NOT NULL DEFAULT 0,
  placement_status TEXT NOT NULL DEFAULT 'UNPLACED' 
    CHECK (placement_status IN ('UNPLACED', 'PLACED_TIER_3', 'PLACED_TIER_2', 'PLACED_TIER_1', 'DEBARRED')),
  current_highest_ctc NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  verification_source TEXT DEFAULT 'ADMIN_MANUAL',
  is_locked BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist if adapting an existing table
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT 'e9ad5cc3-f368-401f-9363-d478c4b433cc'::uuid;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'Computer Science & Engineering';
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS batch_year INTEGER DEFAULT 2026;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS verified_cgpa NUMERIC(4, 2) DEFAULT 7.50;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS active_backlogs INTEGER DEFAULT 0;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS placement_status TEXT DEFAULT 'UNPLACED';
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS current_highest_ctc NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS verification_source TEXT DEFAULT 'ADMIN_MANUAL';
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT TRUE;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ====================================================================
-- 3. PLACEMENT DRIVES TABLE (With Calendar Scheduling & Approval)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.placement_drives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('TIER_1', 'TIER_2', 'TIER_3')),
  min_ctc NUMERIC(10, 2) NOT NULL,
  max_ctc NUMERIC(10, 2) NOT NULL,
  cgpa_cutoff NUMERIC(4, 2) NOT NULL DEFAULT 6.00,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' 
    CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  approval_status TEXT NOT NULL DEFAULT 'APPROVED'
    CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  rejection_reason TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  description TEXT,
  drive_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all calendar columns exist if adapting an existing table
ALTER TABLE public.placement_drives ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'APPROVED';
ALTER TABLE public.placement_drives ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.placement_drives ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.placement_drives ADD COLUMN IF NOT EXISTS drive_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days');
ALTER TABLE public.placement_drives ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

-- ====================================================================
-- 4. DRIVE APPLICATIONS TABLE (War Room & Dispatch Tracking)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.drive_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID NOT NULL REFERENCES public.placement_drives(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'APPLIED' 
    CHECK (stage IN ('APPLIED', 'OA_CLEARED', 'GD_CLEARED', 'INTERVIEW_R1', 'INTERVIEW_R2', 'HR_ROUND', 'OFFERED', 'REJECTED')),
  offer_status TEXT NOT NULL DEFAULT 'PENDING' 
    CHECK (offer_status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'AUTO_REVOKED')),
  offer_ctc NUMERIC(10, 2),
  ai_fit_score NUMERIC(5, 2),
  ai_feedback_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_student_drive_application UNIQUE (drive_id, student_id)
);

-- ====================================================================
-- 5. CANDIDATE ROADMAPS TABLE (AI Skill Remediation Studio)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.candidate_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.drive_applications(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  target_role TEXT NOT NULL,
  total_duration_weeks INT NOT NULL DEFAULT 8,
  missing_skills TEXT[] NOT NULL DEFAULT '{}',
  milestones JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 6. AUTOMATIC USER CREATION & ONBOARDING TRIGGER
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role TEXT;
  first_name TEXT;
  last_name TEXT;
  user_full_name TEXT;
BEGIN
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'STUDENT');
  first_name := COALESCE(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1));
  last_name := COALESCE(new.raw_user_meta_data->>'last_name', 'User');
  user_full_name := trim(first_name || ' ' || last_name);

  -- 1. Upsert into public.users
  INSERT INTO public.users (id, email, role, first_name, last_name)
  VALUES (new.id, new.email, user_role, first_name, last_name)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role = EXCLUDED.role,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = NOW();

  -- 2. If the user is a student, automatically provision their student profile
  IF user_role = 'STUDENT' THEN
    INSERT INTO public.student_profiles (
      user_id,
      full_name,
      roll_number,
      branch,
      batch_year,
      verified_cgpa,
      active_backlogs,
      placement_status,
      current_highest_ctc,
      is_locked
    )
    VALUES (
      new.id,
      user_full_name,
      '220101' || floor(100 + random() * 900)::text,
      'Computer Science & Engineering',
      2026,
      7.50,
      0,
      'UNPLACED',
      0.00,
      TRUE
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- 7. SUPABASE STORAGE BUCKET (Resumes)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 8. SUPABASE REALTIME CONFIGURATION (War Room & Live Pager)
-- ====================================================================
ALTER TABLE public.drive_applications REPLICA IDENTITY FULL;
ALTER TABLE public.placement_drives REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.drive_applications;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.placement_drives;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- ====================================================================
-- 9. ROW-LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_roadmaps ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 9A. USERS POLICIES
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read their own profile or staff can read all" ON public.users;
CREATE POLICY "Users can read their own profile or staff can read all"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') IN ('TPO_ADMIN', 'RECRUITER')
  );

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- --------------------------------------------------------------------
-- 9B. STUDENT PROFILES POLICIES
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Students can read their own profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Students and Staff can read student profiles" ON public.student_profiles;
CREATE POLICY "Students and Staff can read student profiles"
  ON public.student_profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') IN ('TPO_ADMIN', 'RECRUITER')
  );

DROP POLICY IF EXISTS "Students can update their own profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Students and Admins can update student profiles" ON public.student_profiles;
CREATE POLICY "Students and Admins can update student profiles"
  ON public.student_profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'TPO_ADMIN'
  );

DROP POLICY IF EXISTS "Students can insert their own profile" ON public.student_profiles;
CREATE POLICY "Students can insert their own profile"
  ON public.student_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'TPO_ADMIN'
  );

-- --------------------------------------------------------------------
-- 9C. PLACEMENT DRIVES POLICIES (Hardened Role & Approval Gates)
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read placement drives" ON public.placement_drives;
DROP POLICY IF EXISTS "Placement drives select policy" ON public.placement_drives;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.placement_drives;

-- SELECT POLICY:
-- TPO Admins see all drives
-- Recruiters see their own drives (pending/approved/rejected), legacy unassigned drives, and approved drives
-- Students see APPROVED drives ONLY
CREATE POLICY "Placement drives select policy"
  ON public.placement_drives FOR SELECT
  TO authenticated
  USING (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'TPO_ADMIN'
    OR (
      COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'RECRUITER' 
      AND (created_by = auth.uid() OR created_by IS NULL OR approval_status = 'APPROVED')
    )
    OR approval_status = 'APPROVED'
  );

DROP POLICY IF EXISTS "Admins and Recruiters can insert placement drives" ON public.placement_drives;
DROP POLICY IF EXISTS "Placement drives insert policy" ON public.placement_drives;

-- INSERT POLICY:
-- TPO Admins can insert drives directly
-- Recruiters can ONLY insert drives assigned to themselves (created_by = auth.uid()) and forced to 'PENDING'
CREATE POLICY "Placement drives insert policy"
  ON public.placement_drives FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'TPO_ADMIN'
    OR (
      COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'RECRUITER'
      AND created_by = auth.uid()
      AND approval_status = 'PENDING'
    )
  );

DROP POLICY IF EXISTS "Admins and Recruiters can update placement drives" ON public.placement_drives;
DROP POLICY IF EXISTS "Placement drives update policy" ON public.placement_drives;

-- UPDATE POLICY:
-- TPO Admins can approve, reject, or update any placement drive
-- Recruiters can only update their own drives and CANNOT elevate approval_status to 'APPROVED'
CREATE POLICY "Placement drives update policy"
  ON public.placement_drives FOR UPDATE
  TO authenticated
  USING (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'TPO_ADMIN'
    OR (
      COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'RECRUITER'
      AND created_by = auth.uid()
    )
  )
  WITH CHECK (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'TPO_ADMIN'
    OR (
      COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') = 'RECRUITER'
      AND created_by = auth.uid()
      AND approval_status = 'PENDING'
    )
  );

-- --------------------------------------------------------------------
-- 9D. DRIVE APPLICATIONS POLICIES
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Students can read their own applications" ON public.drive_applications;
DROP POLICY IF EXISTS "Users can read relevant applications" ON public.drive_applications;
CREATE POLICY "Users can read relevant applications"
  ON public.drive_applications FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
    )
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') IN ('TPO_ADMIN', 'RECRUITER')
  );

DROP POLICY IF EXISTS "Students can insert their own applications" ON public.drive_applications;
CREATE POLICY "Students can insert their own applications"
  ON public.drive_applications FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can update their own applications" ON public.drive_applications;
DROP POLICY IF EXISTS "Students and Staff can update applications" ON public.drive_applications;
CREATE POLICY "Students and Staff can update applications"
  ON public.drive_applications FOR UPDATE
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
    )
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') IN ('TPO_ADMIN', 'RECRUITER')
  );

-- --------------------------------------------------------------------
-- 9E. CANDIDATE ROADMAPS POLICIES
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Students can view their own roadmaps" ON public.candidate_roadmaps;
CREATE POLICY "Students can view their own roadmaps"
  ON public.candidate_roadmaps FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students can insert their own roadmaps" ON public.candidate_roadmaps;
CREATE POLICY "Students can insert their own roadmaps"
  ON public.candidate_roadmaps FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
    )
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') IN ('TPO_ADMIN', 'RECRUITER')
  );

DROP POLICY IF EXISTS "Students can update their own roadmaps" ON public.candidate_roadmaps;
CREATE POLICY "Students can update their own roadmaps"
  ON public.candidate_roadmaps FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
    )
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') IN ('TPO_ADMIN', 'RECRUITER')
  );

DROP POLICY IF EXISTS "Admins and Recruiters can view all roadmaps" ON public.candidate_roadmaps;
CREATE POLICY "Admins and Recruiters can view all roadmaps"
  ON public.candidate_roadmaps FOR SELECT
  TO authenticated
  USING (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') IN ('TPO_ADMIN', 'RECRUITER')
  );

-- --------------------------------------------------------------------
-- 9F. STORAGE OBJECTS POLICIES (Resumes Bucket)
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can upload resumes" ON storage.objects;
CREATE POLICY "Authenticated users can upload resumes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resumes');

DROP POLICY IF EXISTS "Authenticated users can view resumes" ON storage.objects;
CREATE POLICY "Authenticated users can view resumes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'resumes');

DROP POLICY IF EXISTS "Authenticated users can update resumes" ON storage.objects;
CREATE POLICY "Authenticated users can update resumes"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resumes');

-- ====================================================================
-- 10. SEED STARTER PLACEMENT DRIVES (Ready for Calendar & War Room)
-- ====================================================================
INSERT INTO public.placement_drives (
  company_name,
  role_title,
  tier,
  min_ctc,
  max_ctc,
  cgpa_cutoff,
  status,
  approval_status,
  description,
  drive_date,
  deadline
)
VALUES 
  (
    'Google Cloud',
    'Cloud Systems Engineer',
    'TIER_1',
    24.00,
    32.00,
    8.50,
    'SCHEDULED',
    'APPROVED',
    'Core infrastructure, distributed systems, and GCP automation.',
    NOW() + INTERVAL '14 days',
    NOW() + INTERVAL '10 days'
  ),
  (
    'Microsoft',
    'Software Development Engineer',
    'TIER_1',
    20.00,
    26.00,
    8.00,
    'SCHEDULED',
    'APPROVED',
    'Full-stack distributed services, Azure cloud platform engineering.',
    NOW() + INTERVAL '10 days',
    NOW() + INTERVAL '6 days'
  ),
  (
    'Deloitte Digital',
    'Technology Analyst',
    'TIER_2',
    9.50,
    12.00,
    7.00,
    'SCHEDULED',
    'APPROVED',
    'Enterprise solutions, microservices, and digital transformation.',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '4 days'
  ),
  (
    'TCS Digital',
    'Software Engineer',
    'TIER_2',
    7.50,
    9.00,
    7.00,
    'SCHEDULED',
    'APPROVED',
    'Next-gen applications, modern stack product development.',
    NOW() + INTERVAL '5 days',
    NOW() + INTERVAL '2 days'
  ),
  (
    'Infosys',
    'Systems Engineer Specialist',
    'TIER_3',
    4.50,
    6.00,
    6.00,
    'SCHEDULED',
    'APPROVED',
    'Core engineering, maintenance, and software delivery pipelines.',
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '1 day'
  )
ON CONFLICT DO NOTHING;
