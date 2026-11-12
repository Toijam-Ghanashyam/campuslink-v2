-- ====================================================================
-- CampusLink v2.0 Enterprise: Production Supabase Schema
-- Complete, Idempotent Database Initialization & Migration Script
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. CORE ENUMS & TYPES (Safely Created)
-- ====================================================================
-- Placement Tiers: TIER_1 (Dream >=15 LPA), TIER_2 (Core/IT 7-14.99 LPA), TIER_3 (Mass <7 LPA)
-- Placement Statuses: UNPLACED, PLACED_TIER_3, PLACED_TIER_2, PLACED_TIER_1, DEBARRED
-- Application Stages: APPLIED, OA_CLEARED, GD_CLEARED, INTERVIEW_R1, INTERVIEW_R2, HR_ROUND, OFFERED, REJECTED
-- Offer Statuses: PENDING, ACCEPTED, REJECTED, AUTO_REVOKED

-- ====================================================================
-- 3. TABLES DEFINITION
-- ====================================================================

-- TABLE 1: public.users (Synchronized with auth.users)
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

-- TABLE 2: public.student_profiles (Academic PEP Records)
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

-- TABLE 3: public.placement_drives (Corporate Recruitment Campaigns)
CREATE TABLE IF NOT EXISTS public.placement_drives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID DEFAULT 'e9ad5cc3-f368-401f-9363-d478c4b433cc'::uuid,
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('TIER_1', 'TIER_2', 'TIER_3')),
  min_ctc NUMERIC(10, 2) NOT NULL,
  max_ctc NUMERIC(10, 2) NOT NULL,
  cgpa_cutoff NUMERIC(4, 2) NOT NULL DEFAULT 6.00,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' 
    CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  description TEXT DEFAULT '',
  drive_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  deadline TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all columns exist even if table was pre-created
ALTER TABLE public.placement_drives ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT 'e9ad5cc3-f368-401f-9363-d478c4b433cc'::uuid;
ALTER TABLE public.placement_drives ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.placement_drives ADD COLUMN IF NOT EXISTS drive_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days');
ALTER TABLE public.placement_drives ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 days');

-- TABLE 4: public.drive_applications (Application Pipeline & AI Screening)
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

-- TABLE 5: public.candidate_roadmaps (Diagnostic Remediation Plans)
CREATE TABLE IF NOT EXISTS public.candidate_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.drive_applications(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  target_role TEXT NOT NULL,
  total_duration_weeks INT NOT NULL DEFAULT 8,
  missing_skills TEXT[] NOT NULL DEFAULT '{}',
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 4. PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON public.student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_drive_applications_drive_id ON public.drive_applications(drive_id);
CREATE INDEX IF NOT EXISTS idx_drive_applications_student_id ON public.drive_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_candidate_roadmaps_student_id ON public.candidate_roadmaps(student_id);
CREATE INDEX IF NOT EXISTS idx_candidate_roadmaps_application_id ON public.candidate_roadmaps(application_id);
CREATE INDEX IF NOT EXISTS idx_placement_drives_tier ON public.placement_drives(tier);
CREATE INDEX IF NOT EXISTS idx_placement_drives_status ON public.placement_drives(status);

-- ====================================================================
-- 5. AUTOMATIC TIMESTAMP TRIGGER (updated_at)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_student_profiles_updated_at ON public.student_profiles;
CREATE TRIGGER set_student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_placement_drives_updated_at ON public.placement_drives;
CREATE TRIGGER set_placement_drives_updated_at
  BEFORE UPDATE ON public.placement_drives
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_drive_applications_updated_at ON public.drive_applications;
CREATE TRIGGER set_drive_applications_updated_at
  BEFORE UPDATE ON public.drive_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_candidate_roadmaps_updated_at ON public.candidate_roadmaps;
CREATE TRIGGER set_candidate_roadmaps_updated_at
  BEFORE UPDATE ON public.candidate_roadmaps
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- 6. AUTOMATIC AUTH USER ONBOARDING TRIGGER
-- ====================================================================
-- When an account is created in auth.users, auto-create public.users
-- and auto-provision student_profiles if the role is STUDENT.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
  first_nm TEXT;
  last_nm TEXT;
  full_nm TEXT;
  rand_roll TEXT;
BEGIN
  assigned_role := UPPER(COALESCE(NEW.raw_user_meta_data->>'role', 'STUDENT'));
  first_nm := COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1));
  last_nm := COALESCE(NEW.raw_user_meta_data->>'last_name', 'User');
  full_nm := TRIM(first_nm || ' ' || last_nm);

  -- 1. Insert into public.users
  INSERT INTO public.users (id, email, role, first_name, last_name)
  VALUES (NEW.id, NEW.email, assigned_role, first_nm, last_nm)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();

  -- 2. If student, auto-create student_profiles
  IF assigned_role = 'STUDENT' THEN
    rand_roll := '220101' || floor(100 + (random() * 899))::text;
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
      verification_source,
      is_locked
    )
    VALUES (
      NEW.id,
      full_nm,
      rand_roll,
      'Computer Science & Engineering',
      2026,
      7.80,
      0,
      'UNPLACED',
      0.00,
      'ADMIN_MANUAL',
      TRUE
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ====================================================================
-- 7. SUPABASE STORAGE (Resumes Bucket)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  allowed_mime_types = ARRAY['application/pdf'];

-- ====================================================================
-- 8. REALTIME REPLICATION (For War Room & Live Dispatch)
-- ====================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'drive_applications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.drive_applications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'placement_drives'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.placement_drives;
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
-- A. USERS POLICIES
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own profile or staff can read all" ON public.users;
CREATE POLICY "Users can read own profile or staff can read all"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR UPPER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) IN ('TPO_ADMIN', 'RECRUITER')
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile or admin insert" ON public.users;
CREATE POLICY "Users can insert own profile or admin insert"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id
    OR UPPER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'TPO_ADMIN'
  );

-- --------------------------------------------------------------------
-- B. STUDENT PROFILES POLICIES
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Students can read own profile or staff read all" ON public.student_profiles;
CREATE POLICY "Students can read own profile or staff read all"
  ON public.student_profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR UPPER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) IN ('TPO_ADMIN', 'RECRUITER')
  );

DROP POLICY IF EXISTS "Students can update own profile or admins update" ON public.student_profiles;
CREATE POLICY "Students can update own profile or admins update"
  ON public.student_profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR UPPER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'TPO_ADMIN'
  );

DROP POLICY IF EXISTS "Students or Admins can insert profile" ON public.student_profiles;
CREATE POLICY "Students or Admins can insert profile"
  ON public.student_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR UPPER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'TPO_ADMIN'
  );

-- --------------------------------------------------------------------
-- C. PLACEMENT DRIVES POLICIES
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read placement drives" ON public.placement_drives;
DROP POLICY IF EXISTS "Anyone can read placement drives" ON public.placement_drives;
CREATE POLICY "Anyone can read placement drives"
  ON public.placement_drives FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins and Recruiters can insert placement drives" ON public.placement_drives;
CREATE POLICY "Admins and Recruiters can insert placement drives"
  ON public.placement_drives FOR INSERT
  TO authenticated
  WITH CHECK (
    UPPER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) IN ('TPO_ADMIN', 'RECRUITER')
  );

DROP POLICY IF EXISTS "Admins and Recruiters can update placement drives" ON public.placement_drives;
CREATE POLICY "Admins and Recruiters can update placement drives"
  ON public.placement_drives FOR UPDATE
  TO authenticated
  USING (
    UPPER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) IN ('TPO_ADMIN', 'RECRUITER')
  );

-- --------------------------------------------------------------------
-- D. DRIVE APPLICATIONS POLICIES
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Students view own applications or staff view all" ON public.drive_applications;
CREATE POLICY "Students view own applications or staff view all"
  ON public.drive_applications FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid())
    OR UPPER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) IN ('TPO_ADMIN', 'RECRUITER')
  );

DROP POLICY IF EXISTS "Students can insert own applications" ON public.drive_applications;
CREATE POLICY "Students can insert own applications"
  ON public.drive_applications FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Students update own applications or staff update" ON public.drive_applications;
CREATE POLICY "Students update own applications or staff update"
  ON public.drive_applications FOR UPDATE
  TO authenticated
  USING (
    student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid())
    OR UPPER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) IN ('TPO_ADMIN', 'RECRUITER')
  );

-- --------------------------------------------------------------------
-- E. CANDIDATE ROADMAPS POLICIES
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Students view own roadmaps or staff view all" ON public.candidate_roadmaps;
CREATE POLICY "Students view own roadmaps or staff view all"
  ON public.candidate_roadmaps FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid())
    OR UPPER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) IN ('TPO_ADMIN', 'RECRUITER')
  );

DROP POLICY IF EXISTS "Students or staff can insert roadmaps" ON public.candidate_roadmaps;
CREATE POLICY "Students or staff can insert roadmaps"
  ON public.candidate_roadmaps FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid())
    OR UPPER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) IN ('TPO_ADMIN', 'RECRUITER')
  );

DROP POLICY IF EXISTS "Students or staff can update roadmaps" ON public.candidate_roadmaps;
CREATE POLICY "Students or staff can update roadmaps"
  ON public.candidate_roadmaps FOR UPDATE
  TO authenticated
  USING (
    student_id IN (SELECT id FROM public.student_profiles WHERE user_id = auth.uid())
    OR UPPER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) IN ('TPO_ADMIN', 'RECRUITER')
  );

-- --------------------------------------------------------------------
-- F. STORAGE OBJECTS (Resumes Bucket) POLICIES
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
-- 10. STARTER RECRUITMENT DRIVES (Pre-seeded with real deadlines & specs)
-- ====================================================================
INSERT INTO public.placement_drives (
  company_name,
  role_title,
  tier,
  min_ctc,
  max_ctc,
  cgpa_cutoff,
  status,
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
    'Core distributed systems, Linux kernel fundamentals, and cloud automation at scale. Key skills: Go/Python, Distributed Systems, Kubernetes, Networking.',
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
    'Full-stack distributed services, Azure cloud platform engineering, microservices. Key skills: Data Structures & Algorithms, C#/.NET, React, System Design.',
    NOW() + INTERVAL '10 days',
    NOW() + INTERVAL '7 days'
  ),
  (
    'Deloitte Digital',
    'Technology Analyst',
    'TIER_2',
    9.50,
    12.00,
    7.00,
    'SCHEDULED',
    'Enterprise solutions, modern web architectures, API integration, and cloud transformation. Key skills: JavaScript, TypeScript, Node.js, SQL.',
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
    'Next-gen application development, modern frontend frameworks, and cloud-native databases. Key skills: Java, Spring Boot, React, PostgreSQL.',
    NOW() + INTERVAL '5 days',
    NOW() + INTERVAL '3 days'
  ),
  (
    'Infosys',
    'Systems Engineer Specialist',
    'TIER_3',
    4.50,
    6.00,
    6.00,
    'SCHEDULED',
    'Core software engineering, maintenance, test automation, and enterprise application support. Key skills: C++, Java, Python, Database Management.',
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '2 days'
  )
ON CONFLICT DO NOTHING;
