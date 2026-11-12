-- ====================================================================
-- CampusLink v2: Multi-College Multi-Tenant Institutional Segregation Migration
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- STEP 1: Create Colleges Table
CREATE TABLE IF NOT EXISTS public.colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  district TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 2: Seed Official BPUT Affiliated Colleges
INSERT INTO public.colleges (id, code, name, district) VALUES
  ('e9ad5cc3-f368-401f-9363-d478c4b433cc', 'BPUT_CAMPUS', 'BPUT Central University Campus, Rourkela', 'Sundargarh'),
  ('11111111-1111-4111-a111-111111111111', 'OUTR', 'Odisha University of Technology and Research (OUTR / CET), Bhubaneswar', 'Khurda'),
  ('22222222-2222-4222-a222-222222222222', 'PMEC', 'Parala Maharaja Engineering College (PMEC), Berhampur', 'Ganjam'),
  ('33333333-3333-4333-a333-333333333333', 'GCEK', 'Government College of Engineering (GCEK), Kalahandi', 'Kalahandi'),
  ('44444444-4444-4444-a444-444444444444', 'VSSUT', 'Veer Surendra Sai University of Technology (VSSUT), Burla', 'Sambalpur'),
  ('55555555-5555-4555-a555-555555555555', 'SILICON', 'Silicon Institute of Technology, Bhubaneswar', 'Khurda'),
  ('66666666-6666-4666-a666-666666666666', 'CVRCE', 'C. V. Raman Global University (CVRCE), Bhubaneswar', 'Khurda'),
  ('77777777-7777-4777-a777-777777777777', 'IGIT', 'Indira Gandhi Institute of Technology (IGIT), Sarang', 'Dhenkanal')
ON CONFLICT (code) DO NOTHING;

-- STEP 3: Ensure college_id and Verification Columns Exist in student_profiles
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS college_id UUID;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'PENDING_VERIFICATION';
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Backfill college_id from tenant_id for existing records
UPDATE public.student_profiles 
SET college_id = tenant_id 
WHERE college_id IS NULL AND tenant_id IS NOT NULL;

-- STEP 4: Ensure college_id Exists in users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS college_id UUID;

UPDATE public.users 
SET college_id = tenant_id 
WHERE college_id IS NULL AND tenant_id IS NOT NULL;

-- STEP 5: Row-Level Security for Colleges
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read colleges" ON public.colleges;
CREATE POLICY "Anyone authenticated can read colleges"
  ON public.colleges FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can view colleges" ON public.colleges;
CREATE POLICY "Public can view colleges"
  ON public.colleges FOR SELECT
  TO anon
  USING (true);

