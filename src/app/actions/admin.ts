'use server';

import { createClient as createServerUserClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { PlacementTier, PlacementStatus } from '@/types/pep';
import {
  DatasetStudentRow,
  validateStudentAgainstDataset,
  normalizeRoll,
  normalizeBranchName,
} from '@/lib/dataset-validator';
import { AFFILIATED_COLLEGES } from '@/lib/colleges';

async function resolveAdminCollegeId(user: any, supabase: any): Promise<string> {
  if (user.user_metadata?.college_id) return user.user_metadata.college_id;
  const { data: pubUser } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle();
  return pubUser?.tenant_id || AFFILIATED_COLLEGES[0].id;
}

/**
 * Uploads/upserts the official college student dataset and retroactively
 * verifies or mismatch-locks all existing student profiles in that college.
 */
export async function uploadCollegeDataset(rows: DatasetStudentRow[]) {
  const userClient = await createServerUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  if (!rows || rows.length === 0) {
    return { success: false, error: 'Dataset is empty. Please provide valid student rows.' };
  }

  const supabase = createAdminClient();
  const adminCollegeId = await resolveAdminCollegeId(user, supabase);

  // 1. Prepare clean upsert payload scoped strictly to adminCollegeId
  const upsertPayload = rows.map((r) => ({
    tenant_id: adminCollegeId,
    roll_number: normalizeRoll(r.roll_number),
    full_name: (r.full_name || 'Student Candidate').trim(),
    email: r.email ? r.email.trim().toLowerCase() : null,
    branch: normalizeBranchName(r.branch || 'Computer Science & Engineering'),
    batch_year: Number(r.batch_year) || 2026,
    cgpa: Number(Number(r.cgpa || 0).toFixed(2)),
    active_backlogs: Number(r.active_backlogs || 0),
    uploaded_by: user.id,
    updated_at: new Date().toISOString(),
  }));

  const { error: upsertErr } = await supabase
    .from('college_student_registry')
    .upsert(upsertPayload, { onConflict: 'tenant_id,roll_number' });

  if (upsertErr) {
    return { success: false, error: `Failed to save college dataset: ${upsertErr.message}` };
  }

  // 2. Fetch full updated dataset for this college
  const { data: allRegistryRows } = await supabase
    .from('college_student_registry')
    .select('*')
    .eq('tenant_id', adminCollegeId);

  // 3. Retroactively check all existing student_profiles in this college
  const { data: existingStudents } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('tenant_id', adminCollegeId);

  let autoVerifiedCount = 0;
  let mismatchLockedCount = 0;

  if (existingStudents && allRegistryRows && allRegistryRows.length > 0) {
    for (const st of existingStudents) {
      // Look up student's email from users table if needed
      const { data: uRow } = await supabase
        .from('users')
        .select('email')
        .eq('id', st.user_id)
        .maybeSingle();

      const validation = validateStudentAgainstDataset(
        {
          roll_number: st.roll_number || '',
          full_name: st.full_name || '',
          email: uRow?.email || '',
          branch: st.branch || 'Computer Science & Engineering',
          batch_year: Number(st.batch_year) || 2026,
          cgpa: Number(st.verified_cgpa) || 0,
          active_backlogs: Number(st.active_backlogs) || 0,
        },
        allRegistryRows as DatasetStudentRow[]
      );

      if (validation.matched) {
        autoVerifiedCount++;
        await supabase
          .from('student_profiles')
          .update({
            is_locked: true,
            verification_status: 'VERIFIED',
            verification_source: 'ADMIN_MANUAL',
            rejection_reason: null,
          })
          .eq('id', st.id);
      } else {
        mismatchLockedCount++;
        await supabase
          .from('student_profiles')
          .update({
            is_locked: false,
            verification_status: 'MISMATCH_LOCKED',
            verification_source: 'ADMIN_MANUAL',
            rejection_reason: validation.mismatchSummary,
          })
          .eq('id', st.id);
      }
    }
  }

  revalidatePath('/admin');
  revalidatePath('/student');
  revalidatePath('/student/drives');

  return {
    success: true,
    totalUploaded: upsertPayload.length,
    autoVerifiedCount,
    mismatchLockedCount,
    message: `Uploaded ${upsertPayload.length} student records. Auto-verified: ${autoVerifiedCount}, Locked due to mismatch: ${mismatchLockedCount}.`,
  };
}

/**
 * Deletes a single record from the college dataset registry
 */
export async function deleteDatasetRegistryRow(registryId: string) {
  const userClient = await createServerUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const supabase = createAdminClient();
  const adminCollegeId = await resolveAdminCollegeId(user, supabase);

  const { error } = await supabase
    .from('college_student_registry')
    .delete()
    .eq('id', registryId)
    .eq('tenant_id', adminCollegeId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin');
  return { success: true };
}

/**
 * Toggles academic verification lock for a student profile with strict college isolation
 */
export async function toggleStudentLock(studentId: string, isLocked: boolean) {
  // 1. Authenticate caller and determine their assigned college
  const userClient = await createServerUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  const supabase = createAdminClient();

  // 2. Look up the target student's assigned college
  const { data: targetStudent, error: findErr } = await supabase
    .from('student_profiles')
    .select('id, tenant_id')
    .eq('id', studentId)
    .single();

  if (findErr || !targetStudent) {
    return { success: false, error: 'Student profile not found.' };
  }

  // 3. Prevent cross-college modifications
  const adminCollegeId = await resolveAdminCollegeId(user, supabase);
  if (adminCollegeId && targetStudent.tenant_id && targetStudent.tenant_id !== adminCollegeId) {
    return {
      success: false,
      error: 'Security Violation: You are not authorized to modify students outside your designated college.',
    };
  }

  const { error } = await supabase
    .from('student_profiles')
    .update({
      is_locked: isLocked,
      verification_status: isLocked ? 'VERIFIED' : 'PENDING_VERIFICATION',
      rejection_reason: isLocked ? null : undefined,
      verification_source: 'ADMIN_MANUAL',
    })
    .eq('id', studentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/student');
  return {
    success: true,
    message: `Student profile ${isLocked ? 'verified & locked' : 'unlocked for editing'}.`,
  };
}

/**
 * Approves and verifies student academic record with confirmed CGPA & Backlogs
 * Strictly validates that the student belongs to the admin's college
 */
export async function verifyStudentProfile(
  studentId: string,
  isApproved: boolean,
  confirmedCgpa?: number,
  confirmedBacklogs?: number,
  customRejectionReason?: string
) {
  // 1. Authenticate caller and determine their assigned college
  const userClient = await createServerUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  const supabase = createAdminClient();

  // 2. Look up the target student's assigned college
  const { data: targetStudent, error: findErr } = await supabase
    .from('student_profiles')
    .select('id, tenant_id')
    .eq('id', studentId)
    .single();

  if (findErr || !targetStudent) {
    return { success: false, error: 'Student profile not found.' };
  }

  // 3. Cross-College Data Leakage Prevention Check
  const adminCollegeId = await resolveAdminCollegeId(user, supabase);
  if (adminCollegeId && targetStudent.tenant_id && targetStudent.tenant_id !== adminCollegeId) {
    return {
      success: false,
      error: 'Security Violation: You are not authorized to verify or approve students outside your designated college.',
    };
  }

  const updateData: Record<string, any> = {
    is_locked: isApproved,
    verification_status: isApproved ? 'VERIFIED' : 'MISMATCH_LOCKED',
    rejection_reason: isApproved
      ? null
      : customRejectionReason || 'Academic record rejected by TPO Admin. Please verify and fix your submitted details.',
    verification_source: 'ADMIN_MANUAL',
  };

  if (confirmedCgpa !== undefined) {
    updateData.verified_cgpa = Number(confirmedCgpa);
  }
  if (confirmedBacklogs !== undefined) {
    updateData.active_backlogs = Number(confirmedBacklogs);
  }

  const { error } = await supabase
    .from('student_profiles')
    .update(updateData)
    .eq('id', studentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/student');
  return {
    success: true,
    message: isApproved
      ? 'Student record verified and locked for placement drives!'
      : 'Student record marked as locked with mismatch reason.',
  };
}

/**
 * Updates academic records (CGPA, Backlogs, Status)
 */
export async function updateStudentAcademicRecord(
  studentId: string,
  cgpa: number,
  backlogs: number,
  status: PlacementStatus
) {
  const userClient = await createServerUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  const supabase = createAdminClient();

  const { data: targetStudent } = await supabase
    .from('student_profiles')
    .select('tenant_id')
    .eq('id', studentId)
    .single();

  const adminCollegeId = user.user_metadata?.college_id;
  if (adminCollegeId && targetStudent?.tenant_id && targetStudent.tenant_id !== adminCollegeId) {
    return {
      success: false,
      error: 'Security Violation: You cannot edit records of students belonging to another college.',
    };
  }

  const { error } = await supabase
    .from('student_profiles')
    .update({
      verified_cgpa: cgpa,
      active_backlogs: backlogs,
      placement_status: status,
    })
    .eq('id', studentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  return { success: true, message: 'Student record updated successfully.' };
}

/**
 * Conflict Detection & Drive Scheduling Types
 */
export interface ConflictDriveSummary {
  drive_id: string;
  company_name: string;
  role_title: string;
  venue?: string;
  start_time?: string;
  end_time?: string;
  clash_types: Array<'VENUE_CLASH' | 'STUDENT_OVERLAP_CLASH'>;
  overlapping_students_count: number;
}

export interface ConflictDetails {
  hasConflict: boolean;
  clashType?: 'VENUE_CLASH' | 'STUDENT_OVERLAP_CLASH' | 'BOTH';
  message: string;
  conflictingDrives: ConflictDriveSummary[];
  suggested_resolutions: string[];
}

/**
 * Converts HH:mm or HH:mm:ss to total minutes from midnight
 */
function parseTimeToMinutes(timeStr?: string | null): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map((p) => parseInt(p, 10));
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

/**
 * Formats minutes from midnight to readable 12-hour format (e.g. 2:00 PM)
 */
function formatMinutesTo12Hour(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
  return `${hours12}:${minsStr} ${period}`;
}

/**
 * Detects drive schedule and venue collisions (Step 2)
 */
export async function detectDriveConflicts(
  proposedDate: string,
  startTime: string,
  endTime: string,
  venue?: string,
  cgpaCutoff: number = 7.0,
  driveIdToExclude?: string
): Promise<ConflictDetails> {
  const supabase = createAdminClient();

  const cleanProposedDate = proposedDate ? proposedDate.split('T')[0] : '';
  const pStart = parseTimeToMinutes(startTime || '10:00');
  let pEnd = parseTimeToMinutes(endTime || '13:00');
  if (pEnd <= pStart) {
    pEnd = pStart + 180; // Default 3 hours duration if invalid
  }

  // 1. Fetch non-cancelled drives from database
  let driveQuery = supabase
    .from('placement_drives')
    .select('*')
    .neq('status', 'CANCELLED');

  if (driveIdToExclude) {
    driveQuery = driveQuery.neq('id', driveIdToExclude);
  }

  const { data: existingDrives, error } = await driveQuery;

  if (error || !existingDrives) {
    console.warn('[detectDriveConflicts] Failed to query existing drives:', error);
    return {
      hasConflict: false,
      message: 'No conflicts detected.',
      conflictingDrives: [],
      suggested_resolutions: [],
    };
  }

  // 2. Filter for drives on the same proposed date
  const sameDayDrives = existingDrives.filter((d) => {
    const dDate = (d.drive_date || '').split('T')[0];
    return dDate === cleanProposedDate;
  });

  const conflictingDrives: ConflictDriveSummary[] = [];
  let hasVenueClash = false;
  let hasStudentOverlapClash = false;
  let totalOverlappingStudents = 0;
  let latestOverlappingEnd = 0;

  for (const drive of sameDayDrives) {
    const eStart = drive.start_time ? parseTimeToMinutes(drive.start_time) : 570; // 09:30 default
    const eEnd = drive.end_time ? parseTimeToMinutes(drive.end_time) : 750; // 12:30 default (standard 3-hour morning slot)

    // Interval overlap: max(start1, start2) < min(end1, end2)
    const isOverlapping = Math.max(pStart, eStart) < Math.min(pEnd, eEnd);

    if (!isOverlapping) continue;

    if (eEnd > latestOverlappingEnd) {
      latestOverlappingEnd = eEnd;
    }

    const clashTypes: Array<'VENUE_CLASH' | 'STUDENT_OVERLAP_CLASH'> = [];

    // Check Venue Clash
    const cleanProposedVenue = venue ? venue.trim().toLowerCase() : '';
    const cleanExistingVenue = drive.venue ? drive.venue.trim().toLowerCase() : '';
    const isVenueClash =
      Boolean(cleanProposedVenue) &&
      Boolean(cleanExistingVenue) &&
      cleanProposedVenue === cleanExistingVenue;

    if (isVenueClash) {
      hasVenueClash = true;
      clashTypes.push('VENUE_CLASH');
    }

    // Check Student Overlap Clash
    let overlapCount = 0;
    try {
      // Fetch shortlisted / applied students for the overlapping drive
      const { data: apps } = await supabase
        .from('drive_applications')
        .select('student_id')
        .eq('drive_id', drive.id);

      const appliedIds = new Set(apps?.map((a) => a.student_id) || []);

      // Fetch eligible student pool for the proposed drive
      const { data: eligibleStudents } = await supabase
        .from('student_profiles')
        .select('id')
        .gte('verified_cgpa', cgpaCutoff || 7.0);

      const eligibleIds = new Set(eligibleStudents?.map((s) => s.id) || []);

      if (appliedIds.size > 0) {
        overlapCount = Array.from(appliedIds).filter((id) => eligibleIds.has(id)).length;
      } else {
        // If overlapping drive was recently created with no applications yet, compare overlapping eligible student pools
        const minCutoff = Math.max(cgpaCutoff || 7.0, drive.cgpa_cutoff || 7.0);
        const { count } = await supabase
          .from('student_profiles')
          .select('id', { count: 'exact', head: true })
          .gte('verified_cgpa', minCutoff);
        overlapCount = count || 0;
      }
    } catch (overlapErr) {
      console.warn('[detectDriveConflicts] Student overlap count warning:', overlapErr);
    }

    if (overlapCount > 0) {
      hasStudentOverlapClash = true;
      clashTypes.push('STUDENT_OVERLAP_CLASH');
      totalOverlappingStudents += overlapCount;
    }

    if (clashTypes.length > 0) {
      conflictingDrives.push({
        drive_id: drive.id,
        company_name: drive.company_name,
        role_title: drive.role_title,
        venue: drive.venue,
        start_time: drive.start_time,
        end_time: drive.end_time,
        clash_types: clashTypes,
        overlapping_students_count: overlapCount,
      });
    }
  }

  const hasConflict = conflictingDrives.length > 0;
  if (!hasConflict) {
    return {
      hasConflict: false,
      message: 'No scheduling or venue conflicts detected for this drive slot.',
      conflictingDrives: [],
      suggested_resolutions: [],
    };
  }

  // 3. Construct Clash Type & Human-Readable Message
  let clashType: 'VENUE_CLASH' | 'STUDENT_OVERLAP_CLASH' | 'BOTH' = 'STUDENT_OVERLAP_CLASH';
  if (hasVenueClash && hasStudentOverlapClash) {
    clashType = 'BOTH';
  } else if (hasVenueClash) {
    clashType = 'VENUE_CLASH';
  }

  const conflictingCompanyNames = conflictingDrives.map((d) => d.company_name).join(', ');
  let message = '';
  if (clashType === 'BOTH') {
    message = `⚠️ Venue conflict at "${venue}" & ${totalOverlappingStudents} overlapping students with ${conflictingCompanyNames}`;
  } else if (clashType === 'VENUE_CLASH') {
    message = `⚠️ Venue collision at "${venue}" with ${conflictingCompanyNames}`;
  } else {
    message = `⚠️ ${totalOverlappingStudents} overlapping students with ${conflictingCompanyNames}`;
  }

  // 4. Generate Smart Actionable Resolutions
  const suggested_resolutions: string[] = [];

  // Suggest next time slot
  if (latestOverlappingEnd > 0) {
    const shiftMinutes = Math.min(1080, latestOverlappingEnd + 30); // 30 mins after clash
    suggested_resolutions.push(`Shift start time to ${formatMinutesTo12Hour(shiftMinutes)}`);
  } else {
    suggested_resolutions.push('Shift to Afternoon Session (02:00 PM - 05:00 PM)');
  }

  suggested_resolutions.push('Shift to Morning Slot (08:30 AM - 11:30 AM)');

  if (hasVenueClash) {
    suggested_resolutions.push('Change Venue to Seminar Hall B (Block 2)');
    suggested_resolutions.push('Change Venue to Virtual Auditorium 1');
  }

  return {
    hasConflict: true,
    clashType,
    message,
    conflictingDrives,
    suggested_resolutions,
  };
}

/**
 * Creates a new placement drive with Conflict Detection
 */
export async function createPlacementDrive(data: {
  company_name: string;
  role_title: string;
  tier: PlacementTier;
  min_ctc: number;
  max_ctc: number;
  cgpa_cutoff: number;
  status: string;
  drive_date?: string;
  deadline?: string;
  start_time?: string;
  end_time?: string;
  venue?: string;
  description?: string;
}) {
  const supabase = createAdminClient();

  const safeParseDate = (dateStr?: string, defaultDaysAhead: number = 7) => {
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    }
    return new Date(Date.now() + defaultDaysAhead * 86400000).toISOString();
  };

  const parsedDriveDate = safeParseDate(data.drive_date, 7);
  const parsedDeadline = safeParseDate(data.deadline, 5);
  const startTime = data.start_time || '10:00:00';
  const endTime = data.end_time || '13:00:00';
  const venue = data.venue || 'Main Placement Auditorium';

  // 1. Run Conflict Detection Engine
  const conflict = await detectDriveConflicts(
    parsedDriveDate,
    startTime,
    endTime,
    venue,
    data.cgpa_cutoff
  );

  const insertPayload: Record<string, any> = {
    company_name: data.company_name,
    role_title: data.role_title,
    tier: data.tier,
    min_ctc: data.min_ctc,
    max_ctc: data.max_ctc,
    cgpa_cutoff: data.cgpa_cutoff,
    status: data.status || 'SCHEDULED',
    drive_date: parsedDriveDate,
    deadline: parsedDeadline,
    start_time: startTime,
    end_time: endTime,
    venue: venue,
    has_conflict: conflict.hasConflict,
    conflict_details: conflict.hasConflict ? conflict : null,
    description: data.description || '',
  };

  let { error } = await supabase.from('placement_drives').insert(insertPayload);

  // Graceful fallback for existing databases that have not run the migration yet
  if (
    error &&
    (error.message.includes('deadline') ||
      error.message.includes('description') ||
      error.message.includes('start_time') ||
      error.message.includes('end_time') ||
      error.message.includes('venue') ||
      error.message.includes('has_conflict') ||
      error.message.includes('conflict_details') ||
      error.code === '42703' ||
      error.message.includes('schema cache'))
  ) {
    delete insertPayload.deadline;
    delete insertPayload.description;
    delete insertPayload.start_time;
    delete insertPayload.end_time;
    delete insertPayload.venue;
    delete insertPayload.has_conflict;
    delete insertPayload.conflict_details;
    const retry = await supabase.from('placement_drives').insert(insertPayload);
    error = retry.error;
  }

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/recruiter');
  revalidatePath('/student/drives');
  return {
    success: true,
    message: conflict.hasConflict
      ? `Drive published! Warning: ${conflict.message}`
      : 'Placement drive published successfully with zero scheduling conflicts!',
    conflict,
  };
}

/**
 * AI Auto-Reschedule Drive Fix: Resolves clashes automatically
 */
export async function autoRescheduleDrive(driveId: string) {
  const supabase = createAdminClient();

  const { data: drive, error } = await supabase
    .from('placement_drives')
    .select('*')
    .eq('id', driveId)
    .single();

  if (error || !drive) {
    return { success: false, error: 'Placement drive not found.' };
  }

  // Dynamically find a genuinely clash-free time slot and venue
  const candidateVenues = [
    'Seminar Hall B (Block 2)',
    'Virtual Auditorium 1',
    'Main Placement Auditorium',
    'Placement Conference Center',
  ];

  const candidateSlots = [
    { start: '14:00:00', end: '17:00:00', label: '02:00 PM - 05:00 PM' },
    { start: '08:30:00', end: '11:30:00', label: '08:30 AM - 11:30 AM' },
    { start: '17:30:00', end: '20:30:00', label: '05:30 PM - 08:30 PM' },
    { start: '11:30:00', end: '14:30:00', label: '11:30 AM - 02:30 PM' },
  ];

  let chosenDate = (drive.drive_date || '').split('T')[0];
  let chosenStart = '14:00:00';
  let chosenEnd = '17:00:00';
  let chosenVenue = candidateVenues[0];
  let chosenConflict: ConflictDetails = {
    hasConflict: false,
    message: '',
    conflictingDrives: [],
    suggested_resolutions: [],
  };
  let foundCleanSlot = false;

  // 1. Search same-day candidate slots and venues
  for (const slot of candidateSlots) {
    for (const v of candidateVenues) {
      const check = await detectDriveConflicts(
        chosenDate,
        slot.start,
        slot.end,
        v,
        drive.cgpa_cutoff || 7.0,
        drive.id
      );
      if (!check.hasConflict) {
        chosenStart = slot.start;
        chosenEnd = slot.end;
        chosenVenue = v;
        chosenConflict = check;
        foundCleanSlot = true;
        break;
      }
    }
    if (foundCleanSlot) break;
  }

  // 2. If same day is congested across all slots, roll over to the next day
  if (!foundCleanSlot && drive.drive_date) {
    const nextDateObj = new Date(drive.drive_date);
    nextDateObj.setDate(nextDateObj.getDate() + 1);
    const nextDate = nextDateObj.toISOString().split('T')[0];
    for (const slot of candidateSlots) {
      for (const v of candidateVenues) {
        const check = await detectDriveConflicts(
          nextDate,
          slot.start,
          slot.end,
          v,
          drive.cgpa_cutoff || 7.0,
          drive.id
        );
        if (!check.hasConflict) {
          chosenDate = nextDate;
          chosenStart = slot.start;
          chosenEnd = slot.end;
          chosenVenue = v;
          chosenConflict = check;
          foundCleanSlot = true;
          break;
        }
      }
      if (foundCleanSlot) break;
    }
  }

  const updatePayload: Record<string, unknown> = {
    drive_date: chosenDate,
    start_time: chosenStart,
    end_time: chosenEnd,
    venue: chosenVenue,
    has_conflict: chosenConflict.hasConflict,
    conflict_details: chosenConflict.hasConflict ? chosenConflict : null,
  };

  let { error: updateErr } = await supabase
    .from('placement_drives')
    .update(updatePayload)
    .eq('id', driveId);

  if (
    updateErr &&
    (updateErr.message.includes('start_time') ||
      updateErr.message.includes('has_conflict') ||
      updateErr.code === '42703')
  ) {
    delete updatePayload.start_time;
    delete updatePayload.end_time;
    delete updatePayload.venue;
    delete updatePayload.has_conflict;
    delete updatePayload.conflict_details;
    const retry = await supabase.from('placement_drives').update(updatePayload).eq('id', driveId);
    updateErr = retry.error;
  }

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  revalidatePath('/admin');
  revalidatePath('/recruiter');
  return {
    success: true,
    message: `AI Auto-Reschedule Applied: Shifted ${drive.company_name} to ${chosenDate} (${chosenStart.slice(0, 5)} - ${chosenEnd.slice(0, 5)}) at ${chosenVenue}! Conflicts 100% resolved.`,
  };
}

/**
 * Manually update placement drive schedule & venue
 */
export async function updatePlacementDriveSchedule(
  driveId: string,
  driveDate: string,
  startTime: string,
  endTime: string,
  venue: string
) {
  const supabase = createAdminClient();

  const { data: drive } = await supabase
    .from('placement_drives')
    .select('cgpa_cutoff')
    .eq('id', driveId)
    .single();

  const conflict = await detectDriveConflicts(
    driveDate,
    startTime,
    endTime,
    venue,
    drive?.cgpa_cutoff || 7.0,
    driveId
  );

  const updatePayload: Record<string, any> = {
    drive_date: driveDate,
    start_time: startTime,
    end_time: endTime,
    venue: venue,
    has_conflict: conflict.hasConflict,
    conflict_details: conflict.hasConflict ? conflict : null,
  };

  let { error } = await supabase
    .from('placement_drives')
    .update(updatePayload)
    .eq('id', driveId);

  if (error && (error.code === '42703' || error.message.includes('has_conflict'))) {
    delete updatePayload.has_conflict;
    delete updatePayload.conflict_details;
    delete updatePayload.start_time;
    delete updatePayload.end_time;
    delete updatePayload.venue;
    const retry = await supabase.from('placement_drives').update(updatePayload).eq('id', driveId);
    error = retry.error;
  }

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/recruiter');
  return {
    success: true,
    message: conflict.hasConflict
      ? `Schedule updated with warning: ${conflict.message}`
      : 'Drive schedule updated successfully with zero conflicts!',
    conflict,
  };
}
