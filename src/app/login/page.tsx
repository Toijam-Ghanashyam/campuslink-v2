'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            first_name: email.split('@')[0],
            last_name: 'User',
          },
        },
      });
      if (error) setErrorMsg(error.message);
      else alert('Account created! You can now log in.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg(error.message);
      } else {
        router.push(role === 'STUDENT' ? '/student' : role === 'RECRUITER' ? '/recruiter' : '/admin');
      }
    }
    setLoading(false);
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
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">Role</label>
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

            {errorMsg && <p className="text-xs text-rose-500">{errorMsg}</p>}

            <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500">
              {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
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

