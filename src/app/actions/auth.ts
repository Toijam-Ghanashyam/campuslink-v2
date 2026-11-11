'use server';

import { createAdminClient } from '@/lib/supabase/server';

export async function registerNewUser(data: {
  email: string;
  password: string;
  role: 'STUDENT' | 'RECRUITER' | 'TPO_ADMIN';
  firstName?: string;
  lastName?: string;
}) {
  const supabase = createAdminClient();

  const { email, password, role, firstName, lastName } = data;
  const fName = firstName || email.split('@')[0];
  const lName = lastName || 'User';

  // 1. Check if user already exists in auth.users
  const { data: userList } = await supabase.auth.admin.listUsers();
  const existingUser = userList?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  let userId: string;

  if (existingUser) {
    // If user already exists, update password, confirm email, and set metadata role
    const { error: updateErr } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        password,
        email_confirm: true,
        user_metadata: {
          role,
          first_name: fName,
          last_name: lName,
        },
      }
    );
    if (updateErr) {
      return { success: false, error: updateErr.message };
    }
    userId = existingUser.id;
  } else {
    // 2. Create brand new and auto-confirm user in auth.users
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        first_name: fName,
        last_name: lName,
      },
    });

    if (authErr || !authData?.user) {
      return { success: false, error: authErr?.message || 'Failed to create user account' };
    }
    userId = authData.user.id;
  }

  const tenantId = 'e9ad5cc3-f368-401f-9363-d478c4b433cc';

  // 3. Ensure public.users entry exists
  try {
    await supabase.from('users').upsert({
      id: userId,
      tenant_id: tenantId,
      email,
      role,
      first_name: fName,
      last_name: lName,
    });
  } catch (err) {
    console.warn('Users upsert warning:', err);
  }

  // 4. If student, ensure their student_profiles record exists with PEP verified status
  if (role === 'STUDENT') {
    await ensureStudentProfile(userId, email);
  }

  return { success: true, userId };
}

export async function ensureStudentProfile(userId: string, email: string) {
  const supabase = createAdminClient();
  const tenantId = 'e9ad5cc3-f368-401f-9363-d478c4b433cc';

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
        is_locked: true,
      });
    }
  } catch (err) {
    console.warn('Student profile ensure warning:', err);
  }
}
