'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Check, X } from 'lucide-react';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$%...)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const allRulesPassed = PASSWORD_RULES.every(r => r.test(password));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!allRulesPassed) {
      setError('Please meet all password requirements.');
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Supabase returns empty identities array if email already exists
    if (data?.user?.identities?.length === 0) {
      setError('ACCOUNT_EXISTS');
      setLoading(false);
      return;
    }

    // Redirect to verification page
    router.push(`/verify?email=${encodeURIComponent(email)}`);
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle>Create your account</CardTitle>
        <p className="text-sm text-muted-foreground">Start finding money you&apos;re missing</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && error === 'ACCOUNT_EXISTS' ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-3 text-sm text-amber-800">
              <p className="font-medium">An account with this email already exists.</p>
              <p className="mt-1">
                <Link href="/login" className="text-primary hover:underline font-medium">Sign in instead &rarr;</Link>
              </p>
            </div>
          ) : error ? (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Sarah Johnson" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Create a strong password"
              required
            />
            {/* Live password requirements */}
            {password.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {PASSWORD_RULES.map((rule, i) => {
                  const passed = rule.test(password);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      {passed ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/40" />
                      )}
                      <span className={`text-xs ${passed ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                        {rule.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading || !allRulesPassed || !name || !email}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Account
          </Button>
        </form>
        <Separator className="my-4" />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  );
}
