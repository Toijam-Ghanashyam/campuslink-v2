'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { registerNewUser, ensureStudentProfile } from '@/app/actions/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'RECRUITER' | 'TPO_ADMIN'>('STUDENT');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        // Register through secure server action: bypasses Supabase email confirm lock & initializes student profile
        const res = await registerNewUser({
          email,
          password,
          role,
          firstName: firstName || email.split('@')[0],
          lastName: lastName || 'User',
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create account');
          setLoading(false);
          return;
        }

        // Immediately sign in the new user
        const { data: authData, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInErr) {
          setErrorMsg(signInErr.message);
          setLoading(false);
          return;
        }

        const destination = role === 'STUDENT' ? '/student' : role === 'RECRUITER' ? '/recruiter' : '/admin';
        window.location.href = destination;
        return;
      } else {
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setErrorMsg(error.message);
          setLoading(false);
          return;
        }

        // Sync selected role to user_metadata so switching roles in the UI takes effect immediately
        if (authData?.user) {
          const currentMetaRole = (authData.user.user_metadata?.role as string | undefined)?.toUpperCase();
          if (role && role !== currentMetaRole) {
            await supabase.auth.updateUser({
              data: { role },
            });
          }
          if (role === 'STUDENT') {
            await ensureStudentProfile(authData.user.id, email);
          }
        }

        const destination = role === 'STUDENT' ? '/student' : role === 'RECRUITER' ? '/recruiter' : '/admin';
        window.location.href = destination;
        return;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during authentication');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-100 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            {isSignUp ? 'Create CampusLink Account' : 'Sign in to CampusLink'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400">First Name</label>
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                    placeholder="Aditya"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400">Last Name</label>
                  <Input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                    placeholder="Patel"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">Email Address</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                placeholder="you@campus.edu"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">Password</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950 p-2 text-sm text-slate-100 focus:outline-none"
              >
                <option value="STUDENT">Student Candidate</option>
                <option value="RECRUITER">Corporate Recruiter</option>
                <option value="TPO_ADMIN">TPO Administrator</option>
              </select>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 font-semibold">
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
              }}
              className="text-xs text-slate-400 hover:text-slate-200 underline"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
