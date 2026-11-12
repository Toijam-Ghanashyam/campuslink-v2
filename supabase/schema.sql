-- ====================================================================
-- CampusLink v2: Universal Schema Compatibility & Migration Script
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- STEP 1: If student_profiles exists with 'student_id' (legacy v1), adapt it safely
DO $$
BEGIN
  -- If table student_profiles exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_profiles') THEN
    
    -- 1. Ensure 'id' column exists and is UNIQUE so foreign keys can reference it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_profiles' AND column_name = 'id') THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_profiles' AND column_name = 'student_id') THEN
        ALTER TABLE public.student_profiles ADD COLUMN id UUID;
        UPDATE public.student_profiles SET id = student_id;
        ALTER TABLE public.student_profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
      ELSE
        ALTER TABLE public.student_profiles ADD COLUMN id UUID DEFAULT gen_random_uuid();
      END IF;
    END IF;

    -- Ensure 'id' has a unique constraint if not already primary key
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conrelid = 'public.student_profiles'::regclass 
        AND contype IN ('p', 'u') 
        AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'public.student_profiles'::regclass AND attname = 'id')]
    ) THEN
      BEGIN
        ALTER TABLE public.student_profiles ADD CONSTRAINT student_profiles_id_unique UNIQUE (id);
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;

    -- 2. Ensure 'user_id' column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_profiles' AND column_name = 'user_id') THEN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_profiles' AND column_name = 'student_id') THEN
        ALTER TABLE public.student_profiles ADD COLUMN user_id UUID;
        UPDATE public.student_profiles SET user_id = student_id;
      ELSE
        ALTER TABLE public.student_profiles ADD COLUMN user_id UUID;
      END IF;
    END IF;

    -- 3. Copy legacy 'cgpa' to 'verified_cgpa' if applicable
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_profiles' AND column_name = 'cgpa') THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_profiles' AND column_name = 'verified_cgpa') THEN
        ALTER TABLE public.student_profiles ADD COLUMN verified_cgpa NUMERIC(4, 2) DEFAULT 0.00;
        UPDATE public.student_profiles SET verified_cgpa = cgpa WHERE cgpa IS NOT NULL;
      END IF;
    END IF;

  ELSE
    -- If student_profiles table does not exist at all, create it fresh
    CREATE TABLE public.student_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
      full_name TEXT,
      roll_number TEXT,
      branch TEXT,
      batch_year INTEGER DEFAULT 2026,
      verified_cgpa NUMERIC(4, 2) NOT NULL DEFAULT 7.50,
      active_backlogs INTEGER NOT NULL DEFAULT 0,
      placement_status TEXT NOT NULL DEFAULT 'UNPLACED',
      current_highest_ctc NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
      is_locked BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

-- STEP 2: Add all required CampusLink v2 columns to student_profiles if missing
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS batch_year INTEGER DEFAULT 2026;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS verified_cgpa NUMERIC(4, 2) DEFAULT 7.50;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS active_backlogs INTEGER DEFAULT 0;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS placement_status TEXT DEFAULT 'UNPLACED';
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS current_highest_ctc NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT TRUE;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- STEP 3: Create placement_drives table
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
  description TEXT,
  drive_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 4: Create drive_applications table (references student_profiles)
CREATE TABLE IF NOT EXISTS public.drive_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID NOT NULL REFERENCES public.placement_drives(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
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

-- Add foreign key constraint to student_profiles safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'drive_applications_student_id_fkey'
  ) THEN
    -- If 'id' is in student_profiles, reference id; otherwise reference student_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'student_profiles' AND column_name = 'id'
    ) THEN
      BEGIN
        ALTER TABLE public.drive_applications 
          ADD CONSTRAINT drive_applications_student_id_fkey 
          FOREIGN KEY (student_id) REFERENCES public.student_profiles(id) ON DELETE CASCADE;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;
  END IF;
END $$;

-- STEP 5: Create candidate_roadmaps table
CREATE TABLE IF NOT EXISTS public.candidate_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
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

-- STEP 6: Seed Starter Placement Drives (if empty)
INSERT INTO public.placement_drives (company_name, role_title, tier, min_ctc, max_ctc, cgpa_cutoff, status, description, deadline)
VALUES 
  ('Google Cloud', 'Cloud Systems Engineer', 'TIER_1', 24.00, 32.00, 8.50, 'SCHEDULED', 'Core infrastructure, distributed systems, and GCP automation.', NOW() + INTERVAL '14 days'),
  ('Microsoft', 'Software Development Engineer', 'TIER_1', 20.00, 26.00, 8.00, 'SCHEDULED', 'Full-stack distributed services, Azure cloud platform engineering.', NOW() + INTERVAL '10 days'),
  ('Deloitte Digital', 'Technology Analyst', 'TIER_2', 9.50, 12.00, 7.00, 'SCHEDULED', 'Enterprise solutions, microservices, and digital transformation.', NOW() + INTERVAL '7 days'),
  ('TCS Digital', 'Software Engineer', 'TIER_2', 7.50, 9.00, 7.00, 'SCHEDULED', 'Next-gen applications, modern stack product development.', NOW() + INTERVAL '5 days'),
  ('Infosys', 'Systems Engineer Specialist', 'TIER_3', 4.50, 6.00, 6.00, 'SCHEDULED', 'Core engineering, maintenance, and software delivery pipelines.', NOW() + INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- STEP 7: Enable Row-Level Security
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_roadmaps ENABLE ROW LEVEL SECURITY;

-- STEP 8: RLS Policies for All Tables & Roles

-- Student Profiles Policies
DROP POLICY IF EXISTS "Students can read their own profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Students and Staff can read student profiles" ON public.student_profiles;
CREATE POLICY "Students and Staff can read student profiles"
  ON public.student_profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('TPO_ADMIN', 'RECRUITER')
  );

DROP POLICY IF EXISTS "Students can update their own profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Students and Admins can update student profiles" ON public.student_profiles;
CREATE POLICY "Students and Admins can update student profiles"
  ON public.student_profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'TPO_ADMIN'
  );

-- Placement Drives Policies
DROP POLICY IF EXISTS "Authenticated users can read placement drives" ON public.placement_drives;
CREATE POLICY "Authenticated users can read placement drives"
  ON public.placement_drives FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins and Recruiters can insert placement drives" ON public.placement_drives;
CREATE POLICY "Admins and Recruiters can insert placement drives"
  ON public.placement_drives FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('TPO_ADMIN', 'RECRUITER')
  );

DROP POLICY IF EXISTS "Admins and Recruiters can update placement drives" ON public.placement_drives;
CREATE POLICY "Admins and Recruiters can update placement drives"
  ON public.placement_drives FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('TPO_ADMIN', 'RECRUITER')
  );

-- Drive Applications Policies
DROP POLICY IF EXISTS "Students can read their own applications" ON public.drive_applications;
DROP POLICY IF EXISTS "Users can read relevant applications" ON public.drive_applications;
CREATE POLICY "Users can read relevant applications"
  ON public.drive_applications FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('TPO_ADMIN', 'RECRUITER')
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
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('TPO_ADMIN', 'RECRUITER')
  );

-- Candidate Roadmaps Policies
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
  );

DROP POLICY IF EXISTS "Students can update their own roadmaps" ON public.candidate_roadmaps;
CREATE POLICY "Students can update their own roadmaps"
  ON public.candidate_roadmaps FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins and Recruiters can view all roadmaps" ON public.candidate_roadmaps;
CREATE POLICY "Admins and Recruiters can view all roadmaps"
  ON public.candidate_roadmaps FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('TPO_ADMIN', 'RECRUITER')
  );


-- ====================================================================
-- Public Users & Multi-Tenant Scoping Extensions
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id TEXT,
  college_id UUID,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'STUDENT',
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS verification_source TEXT DEFAULT 'ADMIN_MANUAL';
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS college_id UUID;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'PENDING_VERIFICATION';
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('TPO_ADMIN', 'RECRUITER'));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = auth.uid());
