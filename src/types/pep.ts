export type PlacementTier = 'TIER_1' | 'TIER_2' | 'TIER_3';

export type PlacementStatus = 
  | 'UNPLACED' 
  | 'PLACED_TIER_3' 
  | 'PLACED_TIER_2' 
  | 'PLACED_TIER_1' 
  | 'DEBARRED';

export interface StudentEligibilityProfile {
  id: string;
  verified_cgpa: number;
  active_backlogs: number;
  placement_status: PlacementStatus;
  current_highest_ctc: number;
  is_locked: boolean;
  verification_status?: string;
  rejection_reason?: string | null;
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
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}
