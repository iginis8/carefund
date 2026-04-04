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
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import {
  DollarSign, CheckCircle2, ExternalLink, AlertCircle, ChevronRight,
  PiggyBank, Plus, Target, TrendingUp, AlertTriangle, Clock, Trash2, Edit2,
  Calculator, ArrowRight, Lock, Sparkles, Crown,
} from 'lucide-react';
import { CARE_TYPES } from '@/lib/constants';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

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
      <div className="pointer-events-none opacity-40 blur-[1px] select-none">{children}</div>
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
  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);

  // Tax checklist
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const checklistItems = [
    'Gather all medical receipts',
    'Total care-related transportation costs',
    'Document home modification expenses',
    'Check dependent care FSA enrollment',
    'File Form 2441 (Dependent Care Credit)',
    'Calculate medical expenses above 7.5% AGI',
    'Check state caregiver credit eligibility',
  ];

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
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
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

          {/* AI Recommendations — Premium */}
          <PremiumGate feature="AI Tax Recommendations">
            <Card className="border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" /> AI Tax Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                  <p className="text-sm font-medium">You may be double-dipping on deductions</p>
                  <p className="text-xs text-muted-foreground mt-1">Your medical expenses ($4,800) and dependent care credit ($3,600) overlap. Consider shifting $1,200 to your FSA for maximum benefit.</p>
                </div>
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                  <p className="text-sm font-medium">State credit expiring soon</p>
                  <p className="text-xs text-muted-foreground mt-1">California&apos;s caregiver credit application deadline is October 15. Based on your profile, you qualify for up to $2,500.</p>
                </div>
                <div className="rounded-lg bg-green-50 border border-green-100 p-3">
                  <p className="text-sm font-medium">Increase your deductions by $1,800</p>
                  <p className="text-xs text-muted-foreground mt-1">You&apos;re not tracking mileage for care-related trips. At $0.67/mile, your estimated 15 trips/month could add $1,800/year in deductions.</p>
                </div>
              </CardContent>
            </Card>
          </PremiumGate>
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
              <CardTitle className="text-sm flex items-center gap-2"><Calculator className="h-4 w-4" /> Care Cost Calculator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type of Care</Label>
                  <Select value={selectedCareType} onValueChange={(v) => { if (v) setSelectedCareType(v as typeof selectedCareType); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CARE_TYPES.map(ct => <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>)}
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

        {/* CHECKLIST TAB */}
        <TabsContent value="checklist" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Tax Filing Preparation</CardTitle>
                <Badge variant="secondary">{Object.values(checklist).filter(Boolean).length}/{checklistItems.length} done</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklistItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Checkbox
                    checked={!!checklist[item]}
                    onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, [item]: !!checked }))}
                  />
                  <span className={`text-sm ${checklist[item] ? 'line-through text-muted-foreground' : ''}`}>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
