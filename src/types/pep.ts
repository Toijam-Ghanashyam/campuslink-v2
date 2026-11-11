export type PlacementTier = 'TIER_1' | 'TIER_2' | 'TIER_3';

export type PlacementStatus = 
  | 'UNPLACED' 
  | 'PLACED_TIER_3' 
  | 'PLACED_TIER_2' 
  | 'PLACED_TIER_1' 
  | 'DEBARRED';

export type DriveApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type DriveLifecycleStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface StudentEligibilityProfile {
  id: string;
  user_id?: string;
  full_name?: string | null;
  roll_number?: string | null;
  branch?: string | null;
  batch_year?: number;
  verified_cgpa: number;
  active_backlogs: number;
  placement_status: PlacementStatus;
  current_highest_ctc: number;
  is_locked: boolean;
}

export interface DriveEligibilityCriteria {
  id: string;
  company_name: string;
  role_title: string;
  tier: PlacementTier;
  min_ctc: number;
  max_ctc: number;
  cgpa_cutoff: number;
  status: string;
  approval_status?: DriveApprovalStatus;
}

export interface PlacementDrive {
  id: string;
  company_name: string;
  role_title: string;
  tier: PlacementTier;
  min_ctc: number;
  max_ctc: number;
  cgpa_cutoff: number;
  status: DriveLifecycleStatus;
  approval_status: DriveApprovalStatus;
  rejection_reason?: string | null;
  created_by?: string | null;
  description?: string | null;
  drive_date?: string | null;
  deadline?: string | null;
  created_at?: string;
  updated_at?: string;
  drive_applications?: { count: number }[];
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}


