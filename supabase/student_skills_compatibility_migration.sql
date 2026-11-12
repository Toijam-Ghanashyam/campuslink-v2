-- ====================================================================
-- CampusLink: Student Skills & Job Compatibility Ranking Migration
-- ====================================================================

-- 1. Add skills array to student_profiles
ALTER TABLE public.student_profiles 
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';

-- 2. Add required_skills to placement_drives if not already present
ALTER TABLE public.placement_drives 
ADD COLUMN IF NOT EXISTS required_skills TEXT[] DEFAULT '{}';

-- 3. Index for performance
CREATE INDEX IF NOT EXISTS idx_student_profiles_skills ON public.student_profiles USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_placement_drives_required_skills ON public.placement_drives USING GIN (required_skills);

