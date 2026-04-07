'use client';

import { useState } from 'react';
import { store } from '@/lib/store';
import type { SavingsGoal, SavingsGoalType } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import {
  DollarSign, CheckCircle2, ExternalLink, AlertCircle, ChevronRight,
  PiggyBank, Plus, Target, TrendingUp, AlertTriangle, Clock, Trash2, Edit2,
  Calculator, ArrowRight, Lock, Sparkles, Crown, Lightbulb, Car, Receipt, Shield,
} from 'lucide-react';
import { CARE_TYPES } from '@/lib/constants';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

// --- Smart Recommendations Engine ---
// Generates personalized, actionable recommendations based on user's actual data

interface Recommendation {
  id: string;
  title: string;
  description: string;
  value?: string;
  priority: 'high' | 'medium' | 'low';
  icon: typeof DollarSign;
  color: string;
  action?: { label: string; href: string };
}

function generateRecommendations(): Recommendation[] {
  const profile = store.getProfile();
  const expenses = store.getExpenses();
  const credits = store.getEligibleCredits();
  const goals = store.getSavingsGoals();
  const benefits = store.getBenefits();
  const recs: Recommendation[] = [];

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const deductibleTotal = expenses.filter(e => e.is_tax_deductible).reduce((s, e) => s + e.amount, 0);
  const hasTransportExpenses = expenses.some(e => e.category === 'transportation');
  const availableBenefits = benefits.filter(b => b.status === 'available');
  const emergencyGoal = goals.find(g => g.goal_type === 'emergency');
  const agiThreshold = profile.annual_income * 0.075;

  // 1. Mileage tracking
  if (!hasTransportExpenses && profile.care_hours_per_week > 10) {
    const estimatedMiles = profile.care_hours_per_week * 2 * 52; // rough: 2 miles per care hour per week
    const mileageDeduction = Math.round(estimatedMiles * 0.67);
    recs.push({
      id: 'mileage',
      title: `Track mileage to deduct ~${fmt(mileageDeduction)}/year`,
      description: `You're caregiving ${profile.care_hours_per_week} hrs/week but haven't logged any transportation expenses. At $0.67/mile, driving to appointments and errands adds up fast.`,
      value: fmt(mileageDeduction),
      priority: 'high',
      icon: Car,
      color: 'bg-green-50 border-green-200',
      action: { label: 'Add Transport Expense', href: '/expenses' },
    });
  }

  // 2. Medical expense threshold
  if (deductibleTotal > 0 && deductibleTotal < agiThreshold) {
    const gap = Math.round(agiThreshold - deductibleTotal);
    recs.push({
      id: 'agi-threshold',
      title: `You're ${fmt(gap)} away from the medical deduction threshold`,
      description: `Medical expenses are deductible above 7.5% of your AGI (${fmt(agiThreshold)}). Track every prescription, copay, supply, and care-related cost to cross this threshold.`,
      value: fmt(gap) + ' to go',
      priority: 'high',
      icon: Target,
      color: 'bg-amber-50 border-amber-200',
      action: { label: 'Log Expenses', href: '/expenses' },
    });
  } else if (deductibleTotal >= agiThreshold) {
    recs.push({
      id: 'agi-exceeded',
      title: `You've crossed the medical deduction threshold`,
      description: `Your deductible expenses (${fmt(deductibleTotal)}) exceed 7.5% of your AGI. Every additional medical expense is now directly deductible. Keep tracking!`,
      priority: 'low',
      icon: CheckCircle2,
      color: 'bg-green-50 border-green-200',
    });
  }

  // 3. No expenses tracked at all
  if (expenses.length === 0) {
    recs.push({
      id: 'no-expenses',
      title: 'Start tracking expenses to unlock deductions',
      description: `You haven't logged any care expenses yet. Every receipt is a potential deduction — medications, supplies, home modifications, transportation to appointments.`,
      priority: 'high',
      icon: Receipt,
      color: 'bg-blue-50 border-blue-200',
      action: { label: 'Add First Expense', href: '/expenses' },
    });
  }

  // 4. Unapplied benefits
  if (availableBenefits.length > 3) {
    recs.push({
      id: 'benefits-available',
      title: `You qualify for ${availableBenefits.length} programs you haven't applied to`,
      description: `Including ${availableBenefits[0].benefit_name} and ${availableBenefits.length - 1} more. These could provide paid leave, respite care, and direct financial assistance.`,
      priority: 'high',
      icon: Shield,
      color: 'bg-teal-50 border-teal-200',
      action: { label: 'See Programs', href: '/benefits' },
    });
  }

  // 5. No emergency fund
  if (!emergencyGoal) {
    const recommended = Math.round(profile.annual_income * 0.1);
    recs.push({
      id: 'no-emergency',
      title: `Set up a caregiving emergency fund (${fmt(recommended)} recommended)`,
      description: `Caregivers face unexpected costs — sudden hospital visits, emergency respite, equipment breaks. A fund covering 2-3 months of care expenses provides critical peace of mind.`,
      value: fmt(recommended),
      priority: 'medium',
      icon: PiggyBank,
      color: 'bg-purple-50 border-purple-200',
      action: { label: 'Create Goal', href: '/money' },
    });
  } else if (emergencyGoal.current_amount < emergencyGoal.target_amount * 0.25) {
    recs.push({
      id: 'low-emergency',
      title: `Emergency fund is only ${Math.round((emergencyGoal.current_amount / emergencyGoal.target_amount) * 100)}% funded`,
      description: `You have ${fmt(emergencyGoal.current_amount)} of your ${fmt(emergencyGoal.target_amount)} goal. Try to contribute ${fmt(Math.min(200, emergencyGoal.target_amount - emergencyGoal.current_amount))} this month.`,
      priority: 'medium',
      icon: AlertTriangle,
      color: 'bg-amber-50 border-amber-200',
    });
  }

  // 6. FSA opportunity
  if (profile.employment_status === 'full_time' && !credits.find(c => c.credit_name.includes('FSA'))) {
    recs.push({
      id: 'fsa',
      title: 'Enroll in a Dependent Care FSA to save up to $5,000 pre-tax',
      description: `As a full-time employee, you may be able to set aside up to $5,000 pre-tax for dependent care expenses. This reduces your taxable income and saves you ~$1,250 in taxes.`,
      value: fmt(1250) + ' savings',
      priority: 'medium',
      icon: DollarSign,
      color: 'bg-green-50 border-green-200',
    });
  }

  // 7. Retirement catch-up
  if (profile.care_hours_per_week > 20 && !goals.find(g => g.goal_type === 'retirement_catchup')) {
    const annualImpact = Math.round(profile.annual_income * 0.06);
    recs.push({
      id: 'retirement',
      title: `Caregiving may cost you ${fmt(annualImpact)}/year in retirement savings`,
      description: `At ${profile.care_hours_per_week} hrs/week of caregiving, you're likely missing 401(k) contributions and employer matches. Consider a catch-up savings goal.`,
      value: fmt(annualImpact) + '/year',
      priority: 'medium',
      icon: TrendingUp,
      color: 'bg-blue-50 border-blue-200',
      action: { label: 'Create Retirement Goal', href: '/money' },
    });
  }

  // 8. Paid leave available
  const paidLeave = availableBenefits.find(b => b.benefit_name.toLowerCase().includes('paid') && b.benefit_name.toLowerCase().includes('leave'));
  if (paidLeave) {
    recs.push({
      id: 'paid-leave',
      title: `Your state offers paid family leave — have you applied?`,
      description: `${paidLeave.benefit_name} could provide weeks of partial income while you provide care. Many caregivers don't know they're eligible.`,
      priority: 'high',
      icon: Sparkles,
      color: 'bg-teal-50 border-teal-200',
      action: { label: 'Apply Now', href: '/benefits' },
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

function SmartRecommendations() {
  const recs = generateRecommendations();

  if (recs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
        <p className="font-semibold">You're in great shape!</p>
        <p className="text-sm text-muted-foreground mt-1">No new recommendations right now. Keep tracking expenses and we'll alert you when we find opportunities.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{recs.length} personalized recommendations based on your profile</p>
      </div>
      {recs.map(rec => {
        const Icon = rec.icon;
        return (
          <Card key={rec.id} className={`${rec.color}`}>
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <Icon className="h-5 w-5 text-foreground/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{rec.title}</p>
                    {rec.priority === 'high' && (
                      <Badge className="bg-primary/10 text-primary text-[10px] shrink-0">High impact</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                  {rec.action && (
                    <Link href={rec.action.href} className="inline-block mt-2">
                      <Button size="sm" variant="outline">
                        {rec.action.label} <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

const goalTypeLabels: Record<SavingsGoalType, { label: string; color: string }> = {
  emergency: { label: 'Emergency', color: 'bg-amber-100 text-amber-800' },
  retirement_catchup: { label: 'Retirement', color: 'bg-blue-100 text-blue-800' },
  care_fund: { label: 'Care Reserve', color: 'bg-teal-100 text-teal-800' },
  general: { label: 'General', color: 'bg-gray-100 text-gray-800' },
};

function PremiumGate({ children, feature }: { children: React.ReactNode; feature: string }) {
  const isPremium = store.isPremium();
  if (isPremium) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none opacity-30 blur-[6px] select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-xl bg-background/95 border shadow-lg p-5 text-center max-w-xs">
          <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="font-semibold text-sm">{feature}</p>
          <p className="text-xs text-muted-foreground mt-1 mb-3">Upgrade to Premium to unlock</p>
          <Link href="/settings">
            <Button size="sm"><Sparkles className="mr-1 h-3 w-3" /> Upgrade</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MoneyPage() {
  const profile = store.getProfile();
  const isPremium = store.isPremium();
  const taxCredits = store.getTaxCredits();
  const eligibleCredits = taxCredits.filter(c => c.status === 'eligible');
  const totalTaxSavings = eligibleCredits.reduce((s, c) => s + c.estimated_value, 0);
  const expenses = store.getExpenses();
  const deductibleExpenses = expenses.filter(e => e.is_tax_deductible);
  const totalDeductible = deductibleExpenses.reduce((s, e) => s + e.amount, 0);

  // Savings
  const [goals, setGoals] = useState<SavingsGoal[]>(store.getSavingsGoals());
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [careCostInfoOpen, setCareCostInfoOpen] = useState(false);
  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);


  // Care calculator
  const [selectedCareType, setSelectedCareType] = useState(CARE_TYPES[0].value);
  const [durationYears, setDurationYears] = useState(3);
  const selectedCare = CARE_TYPES.find(c => c.value === selectedCareType)!;

  function handleAddGoal(formData: FormData) {
    store.addSavingsGoal({
      goal_name: formData.get('goal_name') as string,
      goal_type: (formData.get('goal_type') as SavingsGoalType) || 'general',
      target_amount: Number(formData.get('target_amount')),
      current_amount: Number(formData.get('current_amount') || 0),
      deadline: (formData.get('deadline') as string) || undefined,
      auto_save_amount: Number(formData.get('auto_save_amount') || 0) || undefined,
      auto_save_frequency: 'monthly',
    });
    setGoals(store.getSavingsGoals());
    setGoalDialogOpen(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Money You&apos;re Missing</h1>
        <p className="text-muted-foreground">Tax credits, deductions, savings & care cost planning</p>
      </div>

      {/* Hero stat */}
      <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm text-green-800 font-medium">Your estimated annual savings</p>
            <p className="text-4xl font-black text-green-800">{fmt(totalTaxSavings)}</p>
            <p className="text-sm text-green-700">{eligibleCredits.length} credits &middot; {fmt(totalDeductible)} in deductible expenses</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Clock className="h-4 w-4" />
            <span>~15 min to claim</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="credits">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="credits">Tax Credits</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
          <TabsTrigger value="planner">Care Costs</TabsTrigger>
          <TabsTrigger value="recommendations">For You</TabsTrigger>
        </TabsList>

        {/* TAX CREDITS TAB */}
        <TabsContent value="credits" className="space-y-4 mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            {taxCredits.map((credit) => {
              const isEligible = credit.status === 'eligible';
              const isClaimed = credit.status === 'claimed';
              return (
                <Card key={credit.id} className={isEligible ? 'border-green-200' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm">{credit.credit_name}</CardTitle>
                      <Badge variant={isEligible ? 'default' : isClaimed ? 'secondary' : 'outline'}
                        className={isEligible ? 'bg-green-100 text-green-800' : isClaimed ? 'bg-blue-100 text-blue-800' : 'text-muted-foreground'}>
                        {isEligible ? 'Eligible' : isClaimed ? 'Claimed' : 'Not Eligible'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">{credit.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Estimated value</p>
                        <p className={`text-lg font-bold ${isEligible ? 'text-green-700' : 'text-muted-foreground'}`}>{fmt(credit.estimated_value)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{credit.irs_form}</p>
                        <a href={credit.irs_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                          IRS Info <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Deduction tracker */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Deductible Expenses This Year</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Total deductible</span>
                <span className="text-lg font-bold text-green-700">{fmt(totalDeductible)}</span>
              </div>
              <div className="space-y-1">
                {Object.entries(
                  deductibleExpenses.reduce((acc, e) => {
                    const cat = e.tax_category || 'other';
                    acc[cat] = (acc[cat] || 0) + e.amount;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([cat, amount]) => (
                  <div key={cat} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{cat.replace('_', ' ')}</span>
                    <span className="font-medium">{fmt(amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        {/* SAVINGS TAB */}
        <TabsContent value="savings" className="space-y-4 mt-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Total Saved</p>
                <p className="text-xl font-bold">{fmt(totalSaved)}</p>
                <p className="text-[10px] text-muted-foreground">of {fmt(totalTarget)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-xl font-bold">{totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}%</p>
                <Progress value={totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0} className="mt-1 h-1" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Monthly Auto-Save</p>
                <p className="text-xl font-bold">{fmt(goals.reduce((s, g) => s + (g.auto_save_amount || 0), 0))}</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Your Goals</h3>
            <Button size="sm" onClick={() => setGoalDialogOpen(true)}><Plus className="mr-1 h-3 w-3" /> New Goal</Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {goals.map(goal => {
              const pct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
              const typeInfo = goalTypeLabels[goal.goal_type];
              return (
                <Card key={goal.id}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{goal.goal_name}</p>
                        <Badge variant="secondary" className={`text-[10px] mt-1 ${typeInfo.color}`}>{typeInfo.label}</Badge>
                      </div>
                      <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => { store.deleteSavingsGoal(goal.id); setGoals(store.getSavingsGoals()); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{fmt(goal.current_amount)}</span>
                        <span className="text-muted-foreground">{fmt(goal.target_amount)}</span>
                      </div>
                      <Progress value={Math.min(pct, 100)} />
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => {
                      store.updateSavingsGoal(goal.id, { current_amount: goal.current_amount + (goal.auto_save_amount || 100) });
                      setGoals(store.getSavingsGoals());
                    }}>
                      + Add {fmt(goal.auto_save_amount || 100)}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Add goal dialog */}
          <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>New Savings Goal</DialogTitle></DialogHeader>
              <form action={handleAddGoal} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="goal_name">Goal Name</Label>
                  <Input id="goal_name" name="goal_name" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select name="goal_type" defaultValue="general">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emergency">Emergency Fund</SelectItem>
                        <SelectItem value="retirement_catchup">Retirement</SelectItem>
                        <SelectItem value="care_fund">Care Reserve</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target ($)</Label>
                    <Input name="target_amount" type="number" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Current ($)</Label>
                    <Input name="current_amount" type="number" defaultValue="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Auto-Save/Mo ($)</Label>
                    <Input name="auto_save_amount" type="number" />
                  </div>
                </div>
                <Input name="deadline" type="date" />
                <Button type="submit" className="w-full">Create Goal</Button>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* CARE COSTS TAB */}
        <TabsContent value="planner" className="space-y-4 mt-4">
          <PremiumGate feature="Care Cost Calculator & Projections">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Calculator className="h-4 w-4" /> Care Cost Calculator</CardTitle>
                <button type="button" onClick={() => setCareCostInfoOpen(true)} className="text-xs text-primary font-medium hover:underline">
                  What is this?
                </button>
              </div>
            </CardHeader>

            {/* Info overlay */}
            {careCostInfoOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCareCostInfoOpen(false)} />
                <div className="relative bg-background rounded-xl border shadow-xl p-6 max-w-md w-full z-10">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" /> Care Cost Calculator
                  </h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      The Care Cost Calculator helps you <span className="text-foreground font-medium">compare the real costs</span> of different care options for your loved one so you can plan ahead financially.
                    </p>
                    <p>
                      It shows you the <span className="text-foreground font-medium">average monthly, annual, and multi-year costs</span> for:
                    </p>
                    <ul className="space-y-1.5 pl-4">
                      <li className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /> <span><strong>Home Health Aide</strong> — a professional caregiver coming to your home</span></li>
                      <li className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /> <span><strong>Adult Day Care</strong> — supervised daytime programs</span></li>
                      <li className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /> <span><strong>Assisted Living</strong> — residential facilities with daily support</span></li>
                      <li className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /> <span><strong>Nursing Home</strong> — 24/7 medical care facilities</span></li>
                    </ul>
                    <p>
                      Use it to decide what&apos;s affordable, when to transition care levels, and how much to save in your care fund.
                    </p>
                  </div>
                  <Button className="w-full mt-4" onClick={() => setCareCostInfoOpen(false)}>Got it</Button>
                </div>
              </div>
            )}
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type of Care</Label>
                  <Select value={selectedCareType} onValueChange={(v) => { if (v) setSelectedCareType(v as typeof selectedCareType); }}>
                    <SelectTrigger className="w-full">
                      <SelectValue>{() => selectedCare.label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CARE_TYPES.map(ct => (
                        <SelectItem key={ct.value} value={ct.value}>
                          <span className="flex items-center justify-between w-full gap-2">
                            <span>{ct.label}</span>
                            <span className="text-muted-foreground text-xs">{fmt(ct.avg_monthly_cost)}/mo</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration (years)</Label>
                  <Input type="number" min={1} max={20} value={durationYears} onChange={e => setDurationYears(Number(e.target.value))} />
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly</p>
                    <p className="text-lg font-bold">{fmt(selectedCare.avg_monthly_cost)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Annual</p>
                    <p className="text-lg font-bold">{fmt(selectedCare.avg_monthly_cost * 12)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{durationYears} Years</p>
                    <p className="text-lg font-bold text-primary">{fmt(selectedCare.avg_monthly_cost * 12 * durationYears)}</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {CARE_TYPES.filter(ct => ct.value !== selectedCareType).map(ct => (
                  <div key={ct.value} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <span>{ct.label}</span>
                    <span className="font-medium">{fmt(ct.avg_monthly_cost)}/mo</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          </PremiumGate>
        </TabsContent>

        {/* SMART RECOMMENDATIONS TAB */}
        <TabsContent value="recommendations" className="space-y-4 mt-4">
          <SmartRecommendations />
        </TabsContent>
      </Tabs>
    </div>
  );
}
