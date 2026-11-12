-- ====================================================================
-- CampusLink v2: College Dataset Upload & Auto-Verification Migration
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Master College Student Registry Table (Admin Uploaded Dataset)
CREATE TABLE IF NOT EXISTS public.college_student_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  roll_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  branch TEXT NOT NULL DEFAULT 'Computer Science & Engineering',
  batch_year INTEGER NOT NULL DEFAULT 2026,
  cgpa NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
  active_backlogs INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_college_roll_number UNIQUE (tenant_id, roll_number)
);

-- 2. Ensure all verification columns exist on public.student_profiles
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS college_id UUID;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS verification_source TEXT DEFAULT 'ADMIN_MANUAL';
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'PENDING_VERIFICATION';
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;

-- 3. Enable RLS on college_student_registry
ALTER TABLE public.college_student_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and authenticated users can read registry" ON public.college_student_registry;
CREATE POLICY "Admins and authenticated users can read registry"
  ON public.college_student_registry FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "TPO Admins can manage college registry" ON public.college_student_registry;
CREATE POLICY "TPO Admins can manage college registry"
  ON public.college_student_registry FOR ALL
  TO authenticated
  USING (UPPER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'TPO_ADMIN')
  WITH CHECK (UPPER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'TPO_ADMIN');

-- 4. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

