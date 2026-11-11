'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import DriveCalendar from '@/components/DriveCalendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlacementDrive, StudentEligibilityProfile } from '@/types/pep';

export default function StudentCalendarPage() {
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [student, setStudent] = useState<StudentEligibilityProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // 1. Fetch Student Profile
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setStudent(profile as StudentEligibilityProfile | null);

    // 2. Fetch APPROVED Placement Drives only (Enforced at query level & RLS level)
    const { data: driveList } = await supabase
      .from('placement_drives')
      .select('*')
      .eq('approval_status', 'APPROVED')
      .order('drive_date', { ascending: true });

    setDrives((driveList as PlacementDrive[]) || []);
    setLoading(false);
  }, [supabase, router]);


  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: driveList } = await supabase
        .from('placement_drives')
        .select('*')
        .eq('approval_status', 'APPROVED')
        .order('drive_date', { ascending: true });

      if (active) {
        setStudent(profile as StudentEligibilityProfile | null);
        setDrives((driveList as PlacementDrive[]) || []);
        setLoading(false);
      }
    };
    void fetchData();
    return () => {
      active = false;
    };
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-8 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/student/drives" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                &larr; Back to Placement Drives
              </Link>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
              Campus Placement Drive Schedule
            </h1>
            <p className="text-xs text-slate-400">
              Official Institutional Drive Dates &amp; Corporate Evaluation Schedule
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {student && (
              <div className="text-right text-xs text-slate-400 pr-3 border-r border-slate-800 hidden sm:block">
                <p>Roll: <span className="text-slate-200 font-medium">{student.roll_number}</span></p>
                <p>
                  Status:
                  <Badge variant="outline" className="text-indigo-400 border-indigo-400/40 ml-1">
                    {student.placement_status}
                  </Badge>
                </p>
              </div>
            )}
            <Link href="/student/drives">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-xs">
                Browse All Drives
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="border-slate-800 text-xs text-slate-300 hover:bg-slate-900"
            >
              Sign Out
            </Button>
          </div>
        </header>

        {/* Student Calendar View (Guaranteed Approved Drives Only) */}
        <DriveCalendar
          drives={drives}
          userRole="STUDENT"
          isLoading={loading}
          onRefresh={loadData}
        />
      </div>
    </div>
  );
}
