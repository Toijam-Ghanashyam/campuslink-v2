'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PlacementDrive, DriveApprovalStatus } from '@/types/pep';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  GraduationCap,
  IndianRupee,
} from 'lucide-react';

export interface DriveCalendarProps {
  drives: PlacementDrive[];
  userRole: 'STUDENT' | 'RECRUITER' | 'TPO_ADMIN';
  currentUserId?: string;
  onApprove?: (driveId: string) => Promise<{ success: boolean; error?: string }>;
  onReject?: (driveId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  onRefresh?: () => void;
  isLoading?: boolean;
}

/**
 * Normalizes an ISO string or date into a local "YYYY-MM-DD" string key.
 * This guarantees no off-by-one shifts regardless of browser local timezone.
 */
export function getLocalDateKey(isoString?: string | null): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function DriveCalendar({
  drives,
  userRole,
  onApprove,
  onReject,
  onRefresh,
  isLoading = false,
}: DriveCalendarProps) {
  // Navigation month state (initialized deterministically for prerendering, then synced on mount)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 10, 1));
  const [todayKey, setTodayKey] = useState<string>('');

  React.useEffect(() => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setTodayKey(getLocalDateKey(now.toISOString()));
  }, []);

  // Selected drive for the detail dialog
  const [selectedDrive, setSelectedDrive] = useState<PlacementDrive | null>(null);

  // Approval/Rejection action state
  const [processingAction, setProcessingAction] = useState<boolean>(false);
  const [showRejectForm, setShowRejectForm] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Status Filter (for Admin and Recruiter)
  const [statusFilter, setStatusFilter] = useState<'ALL' | DriveApprovalStatus>('ALL');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  // Safe drive list depending on role:
  // Students ONLY see APPROVED drives regardless of what's passed in.
  const safeDrives = useMemo(() => {
    if (userRole === 'STUDENT') {
      return drives.filter((d) => d.approval_status === 'APPROVED');
    }
    if (statusFilter === 'ALL') return drives;
    return drives.filter((d) => d.approval_status === statusFilter);
  }, [drives, userRole, statusFilter]);

  // Group drives by local date string YYYY-MM-DD
  const drivesByDate = useMemo(() => {
    const map = new Map<string, PlacementDrive[]>();
    for (const drive of safeDrives) {
      const key = getLocalDateKey(drive.drive_date);
      if (!key) continue;
      const list = map.get(key) || [];
      list.push(drive);
      map.set(key, list);
    }
    return map;
  }, [safeDrives]);

  // Generate calendar grid days
  const calendarCells = useMemo(() => {
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: {
      date: Date;
      dateKey: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // 1. Previous month trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const d = new Date(year, month - 1, day);
      const key = getLocalDateKey(d.toISOString());
      cells.push({
        date: d,
        dateKey: key,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: key === todayKey,
      });
    }

    // 2. Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const d = new Date(year, month, day);
      const key = getLocalDateKey(d.toISOString());
      cells.push({
        date: d,
        dateKey: key,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: key === todayKey,
      });
    }

    // 3. Next month leading days (fill up to full weeks of 7)
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let day = 1; day <= remaining; day++) {
        const d = new Date(year, month + 1, day);
        const key = getLocalDateKey(d.toISOString());
        cells.push({
          date: d,
          dateKey: key,
          dayNumber: day,
          isCurrentMonth: false,
          isToday: key === todayKey,
        });
      }
    }

    return cells;
  }, [year, month, todayKey]);

  // Statistics for the active view
  const stats = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    for (const d of drives) {
      if (d.approval_status === 'APPROVED') approved++;
      else if (d.approval_status === 'PENDING') pending++;
      else if (d.approval_status === 'REJECTED') rejected++;
    }
    return { approved, pending, rejected, total: drives.length };
  }, [drives]);

  // Admin approval action
  const handleApprove = async () => {
    if (!selectedDrive || !onApprove) return;
    if (!confirm(`Are you sure you want to approve "${selectedDrive.company_name} - ${selectedDrive.role_title}"? This will immediately publish it to the Student Calendar.`)) {
      return;
    }

    setProcessingAction(true);
    const res = await onApprove(selectedDrive.id);
    setProcessingAction(false);

    if (res.success) {
      setSelectedDrive(null);
      if (onRefresh) onRefresh();
    } else {
      alert(`Approval error: ${res.error || 'Failed to approve drive.'}`);
    }
  };

  // Admin rejection action
  const handleReject = async () => {
    if (!selectedDrive || !onReject) return;
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejecting this placement drive.');
      return;
    }

    setProcessingAction(true);
    const res = await onReject(selectedDrive.id, rejectReason.trim());
    setProcessingAction(false);

    if (res.success) {
      setShowRejectForm(false);
      setRejectReason('');
      setSelectedDrive(null);
      if (onRefresh) onRefresh();
    } else {
      alert(`Rejection error: ${res.error || 'Failed to reject drive.'}`);
    }
  };

  const getApprovalBadge = (status: DriveApprovalStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge className="bg-emerald-950 text-emerald-300 border border-emerald-700/80 hover:bg-emerald-900 font-semibold text-xs flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Approved
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-rose-950 text-rose-300 border border-rose-700/80 hover:bg-rose-900 font-semibold text-xs flex items-center gap-1">
            <Clock className="w-3 h-3 text-rose-400" /> Pending Approval
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-slate-900 text-slate-400 border border-slate-700 hover:bg-slate-800 font-semibold text-xs flex items-center gap-1">
            <XCircle className="w-3 h-3 text-slate-400" /> Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header Card */}
      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-400">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <span>{monthNames[month]} {year}</span>
                  {isLoading && (
                    <span className="text-xs text-indigo-400 font-normal animate-pulse">Syncing...</span>
                  )}
                </CardTitle>
                <p className="text-xs text-slate-400">
                  {userRole === 'STUDENT'
                    ? 'Official Placement Cell Approved Drive Schedule'
                    : userRole === 'RECRUITER'
                    ? 'Hiring Campaign Drive-Day Calendar & Approval Dispatch'
                    : 'Institutional TPO Drive Schedule & Approval Command'}
                </p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevMonth}
                className="h-8 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="h-8 border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                className="h-8 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Role Status Legend & Quick Filter */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium mr-1">Legend:</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Approved ({stats.approved})
              </span>

              {userRole !== 'STUDENT' && (
                <>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    Pending ({stats.pending})
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                    Rejected ({stats.rejected})
                  </span>
                </>
              )}
            </div>

            {/* Quick Status Filter (Admin & Recruiter only) */}
            {userRole !== 'STUDENT' && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400 mr-1">Filter:</span>
                {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as const).map((filter) => (
                  <Button
                    key={filter}
                    size="sm"
                    variant={statusFilter === filter ? 'default' : 'ghost'}
                    onClick={() => setStatusFilter(filter)}
                    className={`h-6 text-[10px] px-2 ${
                      statusFilter === filter
                        ? filter === 'PENDING'
                          ? 'bg-rose-700 text-white hover:bg-rose-600'
                          : filter === 'APPROVED'
                          ? 'bg-emerald-700 text-white hover:bg-emerald-600'
                          : 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardHeader>

        {/* Calendar Grid Content */}
        <CardContent className="p-2 sm:p-4">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-400 pb-2 border-b border-slate-800">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 pt-2">
            {calendarCells.map((cell, idx) => {
              const dayDrives = drivesByDate.get(cell.dateKey) || [];

              return (
                <div
                  key={idx}
                  className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-lg border flex flex-col justify-between transition-colors ${
                    cell.isCurrentMonth
                      ? 'bg-slate-950/70 border-slate-800/80 text-slate-200 hover:border-slate-700'
                      : 'bg-slate-950/30 border-slate-900/60 text-slate-600'
                  } ${cell.isToday ? 'ring-1 ring-indigo-500 border-indigo-500/60' : ''}`}
                >
                  {/* Day Header */}
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                        cell.isToday
                          ? 'bg-indigo-600 text-white font-bold'
                          : cell.isCurrentMonth
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {dayDrives.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {dayDrives.length} {dayDrives.length === 1 ? 'drive' : 'drives'}
                      </span>
                    )}
                  </div>

                  {/* Day Events Container */}
                  <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[75px] scrollbar-thin">
                    {dayDrives.map((drive) => {
                      const isPending = drive.approval_status === 'PENDING';
                      const isApproved = drive.approval_status === 'APPROVED';

                      return (
                        <button
                          key={drive.id}
                          onClick={() => {
                            setSelectedDrive(drive);
                            setShowRejectForm(false);
                            setRejectReason('');
                          }}
                          className={`w-full text-left p-1 rounded text-[11px] font-medium border truncate block transition-all shadow-sm ${
                            isApproved
                              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/70 hover:bg-emerald-900 hover:border-emerald-600'
                              : isPending
                              ? 'bg-rose-950/90 text-rose-200 border-rose-700/70 hover:bg-rose-900 hover:border-rose-600'
                              : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800 line-through'
                          }`}
                          title={`${drive.company_name} - ${drive.role_title} (${drive.approval_status})`}
                        >
                          <div className="flex items-center gap-1">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isApproved ? 'bg-emerald-400' : isPending ? 'bg-rose-400' : 'bg-slate-500'
                              }`}
                            />
                            <span className="font-semibold truncate">{drive.company_name}</span>
                          </div>
                          <div className="text-[10px] opacity-80 truncate pl-2.5">
                            {drive.role_title}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Drive Detail & Approval/Rejection Dialog */}
      <Dialog open={!!selectedDrive} onOpenChange={() => setSelectedDrive(null)}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-lg">
          {selectedDrive && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={selectedDrive.tier === 'TIER_1' ? 'destructive' : selectedDrive.tier === 'TIER_2' ? 'default' : 'secondary'}>
                    {selectedDrive.tier}
                  </Badge>
                  {getApprovalBadge(selectedDrive.approval_status)}
                </div>
                <DialogTitle className="text-2xl font-bold mt-2 text-slate-100">
                  {selectedDrive.company_name}
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  {selectedDrive.role_title}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-sm">
                {/* Rejection Alert Box if Rejected */}
                {selectedDrive.approval_status === 'REJECTED' && (
                  <div className="rounded-lg border border-rose-900/60 bg-rose-950/30 p-3 text-rose-300 text-xs space-y-1">
                    <div className="font-semibold flex items-center gap-1.5 text-rose-400">
                      <AlertTriangle className="w-4 h-4" /> Drive Rejected by Administration
                    </div>
                    <p className="text-slate-300">
                      {selectedDrive.rejection_reason || 'No specific rejection reason provided.'}
                    </p>
                  </div>
                )}

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 uppercase text-[10px] font-semibold block flex items-center gap-1">
                      <IndianRupee className="w-3 h-3 text-emerald-400" /> Compensation Range
                    </span>
                    <span className="font-bold text-emerald-400 text-sm">
                      ₹{selectedDrive.min_ctc} - ₹{selectedDrive.max_ctc} LPA
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 uppercase text-[10px] font-semibold block flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-indigo-400" /> CGPA Cutoff
                    </span>
                    <span className="font-bold text-indigo-400 text-sm">
                      {selectedDrive.cgpa_cutoff} CGPA Min
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 uppercase text-[10px] font-semibold block flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3 text-slate-400" /> Drive Date
                    </span>
                    <span className="font-medium text-slate-200">
                      {selectedDrive.drive_date
                        ? new Date(selectedDrive.drive_date).toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Date not fixed'}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 uppercase text-[10px] font-semibold block flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Lifecycle Status
                    </span>
                    <span className="font-medium text-slate-200">
                      {selectedDrive.status}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                    Job Description &amp; Drive Notes
                  </label>
                  <p className="text-xs text-slate-300 bg-slate-950/80 p-3 rounded border border-slate-800 leading-relaxed">
                    {selectedDrive.description || 'No description provided.'}
                  </p>
                </div>

                {/* Rejection Form Input for TPO Admin */}
                {userRole === 'TPO_ADMIN' && selectedDrive.approval_status === 'PENDING' && showRejectForm && (
                  <div className="p-3 rounded-lg border border-rose-900 bg-rose-950/20 space-y-2">
                    <label className="text-xs font-semibold uppercase text-rose-300 block">
                      Rejection Reason (visible to corporate recruiter)
                    </label>
                    <Input
                      required
                      placeholder="e.g. Schedule clashes with university semester exams; please reschedule."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="border-slate-800 bg-slate-950 text-slate-100 text-xs"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowRejectForm(false)}
                        className="text-xs text-slate-400"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={processingAction || !rejectReason.trim()}
                        onClick={handleReject}
                        className="bg-rose-600 hover:bg-rose-500 text-xs text-white"
                      >
                        {processingAction ? 'Rejecting...' : 'Confirm Rejection'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2 border-t border-slate-800">
                {/* Admin Actions for Pending Drive */}
                {userRole === 'TPO_ADMIN' && selectedDrive.approval_status === 'PENDING' && !showRejectForm ? (
                  <div className="flex items-center gap-2 w-full justify-between sm:justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={processingAction}
                      onClick={() => setShowRejectForm(true)}
                      className="border-rose-800 text-rose-400 hover:bg-rose-950/40 text-xs"
                    >
                      Reject Drive
                    </Button>
                    <Button
                      size="sm"
                      disabled={processingAction}
                      onClick={handleApprove}
                      className="bg-emerald-600 hover:bg-emerald-500 text-xs text-white"
                    >
                      {processingAction ? 'Approving...' : 'Approve & Publish to Students'}
                    </Button>
                  </div>
                ) : userRole === 'STUDENT' ? (
                  <Link href="/student/drives" className="w-full">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-xs">
                      Apply on Drives Portal
                    </Button>
                  </Link>
                ) : userRole === 'RECRUITER' ? (
                  <Link href="/recruiter/war-room" className="w-full">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-xs">
                      Open in Drive-Day War Room
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDrive(null)}
                    className="border-slate-800 text-xs text-slate-400"
                  >
                    Close
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
