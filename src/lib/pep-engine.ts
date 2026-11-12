import { StudentEligibilityProfile, DriveEligibilityCriteria, EligibilityResult } from '@/types/pep';

const UPGRADE_MULTIPLIER = 1.5;

export function evaluateEligibility(
  student: StudentEligibilityProfile,
  drive: DriveEligibilityCriteria
): EligibilityResult {
  const reasons: string[] = [];

  // 1. Profile Verification Lock Check
  if (!student.is_locked) {
    if (student.verification_status === 'MISMATCH_LOCKED' || student.rejection_reason) {
      reasons.push(
        `Profile Locked (Dataset Mismatch): ${student.rejection_reason || 'Submitted details do not match college dataset.'} Please fix your details on the Student Dashboard.`
      );
    } else {
      reasons.push('Student academic record has not been verified and locked by the Placement Cell.');
    }
  }

  // 2. Active Backlogs Gate
  if (student.active_backlogs > 0) {
    reasons.push(`Candidate has ${student.active_backlogs} standing backlog(s). Active backlogs must be 0.`);
  }

  // 3. CGPA Cutoff Gate
  if (student.verified_cgpa < drive.cgpa_cutoff) {
    reasons.push(
      `CGPA (${student.verified_cgpa.toFixed(2)}) is below the minimum required cutoff (${drive.cgpa_cutoff.toFixed(2)}).`
    );
  }

  // 4. Drive Status Check
  if (drive.status !== 'SCHEDULED' && drive.status !== 'IN_PROGRESS') {
    reasons.push(`This placement drive is not open for applications (Current status: ${drive.status}).`);
  }

  // 5. Tier & Upgrade Policy Engine
  switch (student.placement_status) {
    case 'DEBARRED':
      reasons.push('Student has been debarred from campus placement drives by institutional policy.');
      break;

    case 'PLACED_TIER_1':
      reasons.push('Institutional Cap Reached: Students with a Tier 1 offer cannot apply for further drives.');
      break;

    case 'PLACED_TIER_2':
      // Tier 2 placed can only attempt Tier 1 upgrade
      if (drive.tier !== 'TIER_1') {
        reasons.push('Students placed in Tier 2 are only eligible for Tier 1 (Dream/Super Dream) upgrade drives.');
      }
      const requiredMinCtcForTier2 = student.current_highest_ctc * UPGRADE_MULTIPLIER;
      if (drive.min_ctc < requiredMinCtcForTier2) {
        reasons.push(
          `CTC upgrade criteria not met: Drive min CTC (₹${drive.min_ctc} LPA) must be at least 1.5x your current offer (₹${requiredMinCtcForTier2.toFixed(2)} LPA).`
        );
      }
      break;

    case 'PLACED_TIER_3':
      // Tier 3 placed can attempt Tier 1 or Tier 2 upgrade
      if (drive.tier === 'TIER_3') {
        reasons.push('Horizontal applications within Tier 3 are prohibited after securing an offer.');
      }
      const requiredMinCtcForTier3 = student.current_highest_ctc * UPGRADE_MULTIPLIER;
      if (drive.min_ctc < requiredMinCtcForTier3) {
        reasons.push(
          `CTC upgrade criteria not met: Drive min CTC (₹${drive.min_ctc} LPA) must be at least 1.5x your current offer (₹${requiredMinCtcForTier3.toFixed(2)} LPA).`
        );
      }
      break;

    case 'UNPLACED':
    default:
      // Unplaced students are eligible across all tiers provided CGPA/backlog checks pass
      break;
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

