'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { CAREGIVER_TYPES, US_STATES, CONDITIONS } from '@/lib/constants';
import type { CaregiverType, EmploymentStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, ArrowRight, ArrowLeft, DollarSign, CheckCircle2, Clock, Shield } from 'lucide-react';

const TOTAL_STEPS = 4;

// What the user gets at each step — sell the value
const STEP_VALUE: Record<number, { headline: string; subtext: string }> = {
  1: { headline: 'Let\'s find your money', subtext: 'We need a few basics to estimate what you\'re missing' },
  2: { headline: 'This unlocks tax credits', subtext: 'Your caregiving role determines which credits apply' },
  3: { headline: 'Almost there — this doubles your results', subtext: 'Conditions determine medical deductions and state programs' },
  4: { headline: 'Here\'s what we found', subtext: '' },
};

function estimateSavings(data: { employment_status: string; annual_income: number; care_hours_per_week: number; state: string; care_recipient_conditions: string[] }): number {
  let total = 0;
  // Dependent care credit
  if (data.employment_status === 'full_time' || data.employment_status === 'part_time') total += 3600;
  // Medical deductions (if conditions present)
  if (data.care_recipient_conditions.length > 0) total += 4800;
  // State programs (CA, NY, NJ have good ones)
  if (['CA', 'NY', 'NJ', 'WA', 'MA', 'CT', 'OR'].includes(data.state)) total += 2500;
  // Dependent care FSA
  if (data.employment_status === 'full_time') total += 5000;
  return total;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    caregiver_type: '' as CaregiverType | '',
    employment_status: 'full_time' as EmploymentStatus,
    annual_income: 0,
    care_hours_per_week: 0,
    care_recipient_relationship: '',
    care_recipient_conditions: [] as string[],
    state: '',
  });

  function update(field: string, value: unknown) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  const estimated = estimateSavings(formData);

  async function handleFinish() {
    // Save to local store
    store.updateProfile({
      ...formData,
      caregiver_type: formData.caregiver_type as CaregiverType,
      onboarding_completed: true,
    });

    // Save to Supabase
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({
          full_name: formData.full_name,
          caregiver_type: formData.caregiver_type,
          employment_status: formData.employment_status,
          annual_income: formData.annual_income,
          care_hours_per_week: formData.care_hours_per_week,
          care_recipient_relationship: formData.care_recipient_relationship,
          care_recipient_conditions: formData.care_recipient_conditions,
          state: formData.state,
          onboarding_completed: true,
        }).eq('id', user.id);
      }
    } catch {
      // Continue even if Supabase save fails — local store has the data
    }

    router.push('/dashboard');
  }

  const stepValue = STEP_VALUE[step];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Heart className="h-7 w-7 text-primary fill-primary" />
            <span className="text-xl font-bold">CareFund</span>
          </div>
          <Progress value={(step / TOTAL_STEPS) * 100} className="h-2 mb-3" />
          <h2 className="text-lg font-bold">{stepValue.headline}</h2>
          {stepValue.subtext && <p className="text-sm text-muted-foreground">{stepValue.subtext}</p>}
        </div>

        {/* Running estimate — visible from step 2 */}
        {step >= 2 && estimated > 0 && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-center">
            <p className="text-xs text-green-700 font-medium">Estimated money you&apos;re missing</p>
            <p className="text-2xl font-bold text-green-800">${estimated.toLocaleString()}<span className="text-sm font-normal">/year</span></p>
          </div>
        )}

        {/* Step 1: Basics */}
        {step === 1 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Your Name</Label>
                <Input placeholder="Full name" value={formData.full_name} onChange={e => update('full_name', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select value={formData.state} onValueChange={v => update('state', v)}>
                    <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                    <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Employment</Label>
                  <Select value={formData.employment_status} onValueChange={v => update('employment_status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="self_employed">Self Employed</SelectItem>
                      <SelectItem value="unemployed">Not Working</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Annual Income ($)</Label>
                  <Input type="number" placeholder="0" value={formData.annual_income || ''} onChange={e => update('annual_income', Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Care Hours/Week</Label>
                  <Input type="number" placeholder="0" value={formData.care_hours_per_week || ''} onChange={e => update('care_hours_per_week', Number(e.target.value))} />
                </div>
              </div>
              <Button className="w-full" onClick={() => setStep(2)} disabled={!formData.full_name || !formData.state}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-xs text-center text-muted-foreground">Takes 2 minutes. Your data stays private.</p>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Caregiving Role */}
        {step === 2 && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              {CAREGIVER_TYPES.map(ct => (
                <button
                  key={ct.value}
                  type="button"
                  className={`w-full text-left rounded-lg border-2 p-3 transition-colors ${formData.caregiver_type === ct.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  onClick={() => update('caregiver_type', ct.value)}
                >
                  <p className="font-medium text-sm">{ct.label}</p>
                  <p className="text-xs text-muted-foreground">{ct.description}</p>
                </button>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!formData.caregiver_type} className="flex-1">
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Care Recipient */}
        {step === 3 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Who do you care for?</Label>
                <Input placeholder="e.g., Mother, Spouse, Son" value={formData.care_recipient_relationship} onChange={e => update('care_recipient_relationship', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Their conditions <span className="text-muted-foreground font-normal">(unlocks deductions)</span></Label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formData.care_recipient_conditions.map(c => (
                    <Badge key={c} variant="secondary" className="cursor-pointer text-xs" onClick={() => update('care_recipient_conditions', formData.care_recipient_conditions.filter(x => x !== c))}>
                      {c} &times;
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={(v: string | null) => { if (typeof v === 'string' && !formData.care_recipient_conditions.includes(v)) update('care_recipient_conditions', [...formData.care_recipient_conditions, v]); }}>
                  <SelectTrigger><SelectValue placeholder="Add a condition..." /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.filter(c => !formData.care_recipient_conditions.includes(c)).map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={() => setStep(4)} className="flex-1">
                  See My Results <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Results — sell the value */}
        {step === 4 && (
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
                  <DollarSign className="h-8 w-8 text-green-700" />
                </div>
                <h3 className="text-2xl font-bold">{formData.full_name.split(' ')[0]}, you may be missing</h3>
                <p className="text-4xl font-black text-green-700 mt-1">${estimated.toLocaleString()}<span className="text-lg font-medium">/year</span></p>
              </div>

              <div className="space-y-2">
                {[
                  { icon: DollarSign, label: 'Tax credits & deductions', value: `$${(estimated * 0.53).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: 'text-green-700' },
                  { icon: Shield, label: 'Benefits & programs', value: `${['CA', 'NY', 'NJ', 'WA', 'MA', 'CT', 'OR'].includes(formData.state) ? '3+' : '2+'} available`, color: 'text-blue-700' },
                  { icon: Clock, label: 'Time to claim', value: '~15 minutes', color: 'text-amber-700' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleFinish} className="flex-1">
                  Claim My Money <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
