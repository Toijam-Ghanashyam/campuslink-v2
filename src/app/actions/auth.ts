'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { AFFILIATED_COLLEGES } from '@/lib/colleges';

export async function registerNewUser(data: {
  email: string;
  password: string;
  role: 'STUDENT' | 'RECRUITER' | 'TPO_ADMIN';
  firstName?: string;
  lastName?: string;
  collegeId?: string;
  rollNumber?: string;
  branch?: string;
  batchYear?: number;
  cgpa?: number;
  activeBacklogs?: number;
  resumeUrl?: string;
  companyName?: string;
  designation?: string;
}) {
  const supabase = createAdminClient();

  const {
    email,
    password,
    role,
    firstName,
    lastName,
    collegeId = AFFILIATED_COLLEGES[0].id,
    rollNumber,
    branch,
    batchYear = 2026,
    cgpa = 7.50,
    activeBacklogs = 0,
    companyName,
    designation,
  } = data;


  const fName = firstName || email.split('@')[0];
  const lName = lastName || (role === 'RECRUITER' ? 'Recruiter' : role === 'TPO_ADMIN' ? 'Admin' : 'User');

  const cleanEmail = email.trim().toLowerCase();

  // 1. Check if user already exists in auth.users or public.users
  const { data: userList } = await supabase.auth.admin.listUsers();
  const existingUser = userList?.users?.find(
    (u) => u.email?.toLowerCase() === cleanEmail
  );

  const { data: existingPubUser } = await supabase
    .from('users')
    .select('id, email')
    .ilike('email', cleanEmail)
    .maybeSingle();

  if (existingUser || existingPubUser) {
    return {
      success: false,
      error: 'An account with this email address already exists. Please sign in instead.',
    };
  }

  // 2. Create brand new and auto-confirm user in auth.users
  const userMetadata: Record<string, unknown> = {
    role,
    first_name: fName,
    last_name: lName,
  };

  if (role !== 'RECRUITER') {
    userMetadata.college_id = collegeId;
  }
  if (companyName) {
    userMetadata.company_name = companyName;
  }
  if (designation) {
    userMetadata.designation = designation;
  }

  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (authErr || !authData?.user) {
    if (authErr?.message?.toLowerCase().includes('already')) {
      return {
        success: false,
        error: 'An account with this email address already exists. Please sign in instead.',
      };
    }
    return { success: false, error: authErr?.message || 'Failed to create user account' };
  }

  const userId = authData.user.id;

  // 3. Ensure public.users entry exists with college_id / tenant_id
  try {
    await supabase.from('users').upsert({
      id: userId,
      tenant_id: role === 'RECRUITER' ? null : collegeId,
      email,
      role,
      first_name: fName,
      last_name: lName,
    });
  } catch (err) {
    console.warn('Users upsert warning:', err);
  }

  // 4. If student, ensure their student_profiles record exists with college_id and PENDING verification
  if (role === 'STUDENT') {
    const finalRoll = rollNumber || ('220101' + Math.floor(100 + Math.random() * 900));
    const finalBranch = branch || 'Computer Science & Engineering';

    try {
      const { data: existingSp } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      const profilePayload: Record<string, any> = {
        user_id: userId,
        tenant_id: collegeId,
        roll_number: finalRoll,
        branch: finalBranch,
        batch_year: Number(batchYear),
        verified_cgpa: Number(cgpa),
        active_backlogs: Number(activeBacklogs),
        placement_status: 'UNPLACED',
        current_highest_ctc: 0,
        verification_source: 'ADMIN_MANUAL',
        is_locked: false, // Student starts UNLOCKED and pending College TPO approval
      };

      if (existingSp) {
        await supabase
          .from('student_profiles')
          .update(profilePayload)
          .eq('id', existingSp.id);
      } else {
        await supabase.from('student_profiles').insert(profilePayload);
      }
    } catch (err) {
      console.warn('Student profile upsert warning:', err);
    }
  }

  return { success: true, userId };
}

export async function ensureStudentProfile(userId: string, email: string, collegeId?: string) {
  const supabase = createAdminClient();
  const tenantId = collegeId || AFFILIATED_COLLEGES[0].id;

  try {
    const { data: existingSp } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingSp) {
      const randomRoll = '220101' + Math.floor(100 + Math.random() * 900);
      await supabase.from('student_profiles').insert({
        user_id: userId,
        tenant_id: tenantId,
        roll_number: randomRoll,
        branch: 'Computer Science & Engineering',
        batch_year: 2026,
        verified_cgpa: 7.80,
        active_backlogs: 0,
        placement_status: 'UNPLACED',
        current_highest_ctc: 0,
        verification_source: 'ADMIN_MANUAL',
        is_locked: false,
      });
    }
  } catch (err) {
    console.warn('Student profile ensure warning:', err);
  }
}
