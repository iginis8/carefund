'use client';

import { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const CODE_EXPIRY_SECONDS = 300; // 5 minutes

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(CODE_EXPIRY_SECONDS);
  const [expired, setExpired] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (expired) return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setExpired(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [expired]);

  function resetTimer() {
    setSecondsLeft(CODE_EXPIRY_SECONDS);
    setExpired(false);
  }

  function formatTime(s: number): string {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }

  function handleChange(index: number, value: string) {
    if (value.length > 1) value = value.slice(-1);
    if (!/^[0-9]*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === 5 && newCode.every(c => c)) {
      handleVerify(newCode.join(''));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  }

  const handleVerify = useCallback(async (otp: string) => {
    if (expired) {
      setError('Code expired. Please request a new one.');
      return;
    }

    setError('');
    setLoading(true);

    const supabase = createClient();

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    });

    if (verifyError) {
      setError(verifyError.message);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setLoading(false);
      return;
    }

    router.push('/onboarding');
  }, [email, expired, router]);

  async function handleResend() {
    if (!email) {
      setError('No email address found. Please go back and sign up again.');
      return;
    }

    setResent(false);
    setError('');

    try {
      const supabase = createClient();

      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (resendError) {
        // If resend fails, try signing up again which re-sends the confirmation
        const { error: signupError } = await supabase.auth.signUp({
          email,
          password: 'temp-resend-trigger', // Won't actually change anything for existing user
        });

        if (signupError && !signupError.message.includes('already registered')) {
          setError('Could not resend code. Please wait 60 seconds and try again.');
          return;
        }
      }

      setResent(true);
      setCode(['', '', '', '', '', '']);
      resetTimer();
      inputRefs.current[0]?.focus();
      setTimeout(() => setResent(false), 5000);
    } catch {
      setError('Could not resend code. Please try again.');
    }
  }

  // Timer color: green > 2min, yellow > 1min, red < 1min
  const timerColor = secondsLeft > 120 ? 'text-green-600' : secondsLeft > 60 ? 'text-amber-600' : 'text-destructive';

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-3">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>
        </div>
        <CardTitle>Check your email</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          We sent a 6-digit code to<br />
          <span className="font-medium text-foreground">{email}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive text-center">
            {error}
          </div>
        )}

        {resent && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> New code sent!
          </div>
        )}

        {/* Expired warning */}
        {expired && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-700 text-center flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Code expired — request a new one below
          </div>
        )}

        {/* Code input */}
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <Input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`w-12 h-14 text-center text-xl font-bold ${expired ? 'opacity-50' : ''}`}
              disabled={loading || expired}
            />
          ))}
        </div>

        {/* Timer */}
        {!expired && (
          <div className={`flex items-center justify-center gap-1.5 text-sm font-medium ${timerColor}`}>
            <Clock className="h-3.5 w-3.5" />
            <span>Code expires in {formatTime(secondsLeft)}</span>
          </div>
        )}

        <Button
          className="w-full"
          onClick={() => handleVerify(code.join(''))}
          disabled={loading || code.some(c => !c) || expired}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Verify Email
        </Button>

        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Didn&apos;t get the code? Check your spam folder.
          </p>
          <button
            type="button"
            onClick={handleResend}
            className="text-xs text-primary hover:underline font-medium"
          >
            Resend Code
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
