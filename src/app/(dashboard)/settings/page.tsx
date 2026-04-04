'use client';

import { useState } from 'react';
import { store } from '@/lib/store';
import { CAREGIVER_TYPES, US_STATES, CONDITIONS } from '@/lib/constants';
import type { CaregiverType, EmploymentStatus } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings, User, Bell, Download, Shield, Save, Check, Sparkles, CheckCircle2, Crown } from 'lucide-react';

export default function SettingsPage() {
  const [profile, setProfile] = useState(store.getProfile());
  const [saved, setSaved] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(store.isPremium());
  const [premiumPlan, setPremiumPlan] = useState(store.getPremium().plan);
  const [notifications, setNotifications] = useState({
    expense_reminders: true,
    tax_deadlines: true,
    savings_milestones: true,
    benefit_renewals: true,
    weekly_summary: false,
  });

  function handleSave() {
    store.updateProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleExport() {
    const data = {
      profile: store.getProfile(),
      expenses: store.getExpenses(),
      savings_goals: store.getSavingsGoals(),
      tax_credits: store.getTaxCredits(),
      benefits: store.getBenefits(),
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carefund-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile</CardTitle>
          <CardDescription>Your caregiving situation and personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Caregiving Role</Label>
              <Select value={profile.caregiver_type} onValueChange={(v) => { if (v) setProfile({ ...profile, caregiver_type: v as CaregiverType }); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CAREGIVER_TYPES.map(ct => (
                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Employment Status</Label>
              <Select value={profile.employment_status} onValueChange={(v) => { if (v) setProfile({ ...profile, employment_status: v as EmploymentStatus }); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="self_employed">Self Employed</SelectItem>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Annual Income ($)</Label>
              <Input type="number" value={profile.annual_income} onChange={e => setProfile({ ...profile, annual_income: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Care Hours / Week</Label>
              <Input type="number" value={profile.care_hours_per_week} onChange={e => setProfile({ ...profile, care_hours_per_week: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Select value={profile.state} onValueChange={(v) => { if (v) setProfile({ ...profile, state: v }); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {US_STATES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Care Recipient Relationship</Label>
            <Input value={profile.care_recipient_relationship} onChange={e => setProfile({ ...profile, care_recipient_relationship: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Care Recipient Conditions</Label>
            <div className="flex flex-wrap gap-2">
              {profile.care_recipient_conditions.map(c => (
                <Badge key={c} variant="secondary" className="cursor-pointer" onClick={() => setProfile({ ...profile, care_recipient_conditions: profile.care_recipient_conditions.filter(x => x !== c) })}>
                  {c} &times;
                </Badge>
              ))}
            </div>
            <Select onValueChange={(v: string | null) => { if (typeof v === 'string' && !profile.care_recipient_conditions.includes(v)) setProfile({ ...profile, care_recipient_conditions: [...profile.care_recipient_conditions, v] }); }}>
              <SelectTrigger><SelectValue placeholder="Add condition..." /></SelectTrigger>
              <SelectContent>
                {CONDITIONS.filter(c => !profile.care_recipient_conditions.includes(c)).map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} className="gap-2">
            {saved ? <><Check className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Changes</>}
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle>
          <CardDescription>Choose what you want to be reminded about</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key} className="cursor-pointer">
                {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Label>
              <Checkbox id={key} checked={value} onCheckedChange={(checked) => setNotifications({ ...notifications, [key]: !!checked })} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" /> Data Export</CardTitle>
          <CardDescription>Download all your CareFund data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Export your profile, expenses, savings goals, and benefit information as JSON.</p>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export All Data
          </Button>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Plan</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {isPremium ? <><Crown className="h-3 w-3 text-amber-500" /> CareFund Premium ({premiumPlan === 'annual' ? '$12/mo annual' : '$15/mo'})</> : 'CareFund Free'}
              </p>
            </div>
            {!isPremium && (
              <Button variant="outline" size="sm" onClick={() => setPremiumOpen(true)}>
                <Sparkles className="mr-1 h-3 w-3" /> Upgrade to Premium
              </Button>
            )}
            {isPremium && (
              <Badge className="bg-amber-100 text-amber-800">Premium Active</Badge>
            )}
          </div>
          {isPremium && (
            <>
              <Separator />
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-sm font-medium text-green-800 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Premium features unlocked</p>
                <ul className="mt-2 space-y-1 text-xs text-green-700">
                  <li>&#10003; AI tax recommendations</li>
                  <li>&#10003; Unlimited savings goals</li>
                  <li>&#10003; PDF/CSV export</li>
                  <li>&#10003; Medicaid planning tools</li>
                  <li>&#10003; Monthly financial health report</li>
                </ul>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { store.cancelPremium(); setIsPremium(false); setPremiumPlan('free'); }}>
                Cancel Premium
              </Button>
            </>
          )}
          <Separator />
          <Button variant="ghost" className="text-destructive">Delete Account</Button>
        </CardContent>
      </Card>

      {/* Premium Upgrade Dialog */}
      <Dialog open={premiumOpen} onOpenChange={setPremiumOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" /> Upgrade to CareFund Premium
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-gradient-to-br from-primary/10 to-amber-50 p-4 text-center">
              <p className="text-3xl font-bold">$15<span className="text-base font-normal text-muted-foreground">/month</span></p>
              <p className="text-sm text-muted-foreground mt-1">or $144/year (save 20%)</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Everything in Free, plus:</p>
              {[
                'Advanced tax optimization with AI recommendations',
                'Unlimited savings goals with auto-save automation',
                'Employer benefits matching & application assistance',
                'Care cost projections with inflation modeling',
                'Monthly financial health report',
                'Priority support from caregiver finance experts',
                'CSV & PDF export of all data',
                'Medicaid planning tools with state-specific guidance',
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Button className="w-full" onClick={() => { store.upgradePremium('monthly'); setIsPremium(true); setPremiumPlan('monthly'); setPremiumOpen(false); }}>
                <Sparkles className="mr-2 h-4 w-4" /> Start Premium — $15/mo
              </Button>
              <Button variant="outline" className="w-full" onClick={() => { store.upgradePremium('annual'); setIsPremium(true); setPremiumPlan('annual'); setPremiumOpen(false); }}>
                Annual Plan — $12/mo (billed yearly)
              </Button>
              <p className="text-xs text-center text-muted-foreground">7-day free trial. Cancel anytime.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
