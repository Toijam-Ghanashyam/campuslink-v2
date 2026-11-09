-- CampusLink Supabase Schema & Placement Eligibility Policy (PEP) setup

-- 1. Enable pgcrypto / uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Student Profiles Table
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  roll_number TEXT,
  branch TEXT,
  batch_year INTEGER DEFAULT 2026,
  verified_cgpa NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
  active_backlogs INTEGER NOT NULL DEFAULT 0,
  placement_status TEXT NOT NULL DEFAULT 'UNPLACED' 
    CHECK (placement_status IN ('UNPLACED', 'PLACED_TIER_3', 'PLACED_TIER_2', 'PLACED_TIER_1', 'DEBARRED')),
  current_highest_ctc NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Placement Drives Table
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

-- 4. Drive Applications Table
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

-- Migration support: Update stage check constraint if table already exists
ALTER TABLE public.drive_applications DROP CONSTRAINT IF EXISTS drive_applications_stage_check;
ALTER TABLE public.drive_applications ADD CONSTRAINT drive_applications_stage_check 
  CHECK (stage IN ('APPLIED', 'OA_CLEARED', 'GD_CLEARED', 'INTERVIEW_R1', 'INTERVIEW_R2', 'HR_ROUND', 'OFFERED', 'REJECTED'));

-- 5. Automatic Profile Creation Trigger for Students
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'STUDENT' THEN
    INSERT INTO public.student_profiles (
      user_id,
      full_name,
      verified_cgpa,
      active_backlogs,
      placement_status,
      current_highest_ctc,
      is_locked
    ) VALUES (
      NEW.id,
      COALESCE(
        CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name'),
        split_part(NEW.email, '@', 1)
      ),
      7.50, -- Default starter CGPA for onboarding
      0,
      'UNPLACED',
      0.00,
      TRUE -- Marked verified for demonstration/testing
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Row Level Security (RLS)
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_applications ENABLE ROW LEVEL SECURITY;

-- Student Profiles: Students read their own, service role has full access
CREATE POLICY "Students can read their own profile"
  ON public.student_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Students can update their own profile"
  ON public.student_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Placement Drives: All authenticated users can read drives
CREATE POLICY "Authenticated users can read placement drives"
  ON public.placement_drives FOR SELECT
  TO authenticated
  USING (true);

-- Applications: Students can read and insert their own applications
CREATE POLICY "Students can read their own applications"
  ON public.drive_applications FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert their own applications"
  ON public.drive_applications FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their own applications"
  ON public.drive_applications FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
    )
  );

-- Sample Placement Drives Seed Data
INSERT INTO public.placement_drives (company_name, role_title, tier, min_ctc, max_ctc, cgpa_cutoff, status, description, deadline)
VALUES 
  ('Google Cloud', 'Cloud Systems Engineer', 'TIER_1', 24.00, 32.00, 8.50, 'SCHEDULED', 'Core infrastructure, distributed systems, and GCP automation.', NOW() + INTERVAL '14 days'),
  ('Microsoft', 'Software Development Engineer', 'TIER_1', 20.00, 26.00, 8.00, 'SCHEDULED', 'Full-stack distributed services, Azure cloud platform engineering.', NOW() + INTERVAL '10 days'),
  ('Deloitte Digital', 'Technology Analyst', 'TIER_2', 9.50, 12.00, 7.00, 'SCHEDULED', 'Enterprise solutions, microservices, and digital transformation.', NOW() + INTERVAL '7 days'),
  ('TCS Digital', 'Software Engineer', 'TIER_2', 7.50, 9.00, 7.00, 'SCHEDULED', 'Next-gen applications, modern stack product development.', NOW() + INTERVAL '5 days'),
  ('Infosys', 'Systems Engineer Specialist', 'TIER_3', 4.50, 6.00, 6.00, 'SCHEDULED', 'Core engineering, maintenance, and software delivery pipelines.', NOW() + INTERVAL '3 days')
ON CONFLICT DO NOTHING;
