'use client';

import { useState } from 'react';
import { store } from '@/lib/store';
import type { SavingsGoal, SavingsGoalType } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PiggyBank, Plus, Target, TrendingUp, AlertTriangle, Clock, Trash2, Edit2 } from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const goalTypeLabels: Record<SavingsGoalType, { label: string; color: string }> = {
  emergency: { label: 'Emergency Fund', color: 'bg-amber-100 text-amber-800' },
  retirement_catchup: { label: 'Retirement Catch-Up', color: 'bg-blue-100 text-blue-800' },
  care_fund: { label: 'Care Reserve', color: 'bg-teal-100 text-teal-800' },
  general: { label: 'General', color: 'bg-gray-100 text-gray-800' },
};

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>(store.getSavingsGoals());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.current_amount, 0);
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
  const monthlyAutoSave = goals.reduce((s, g) => s + (g.auto_save_amount || 0), 0);

  // Retirement impact calculation
  const profile = store.getProfile();
  const yearsOfCaregiving = Math.round(profile.care_hours_per_week * 52 / 2080 * 5); // rough estimate
  const estimatedRetirementGap = profile.annual_income * 0.15 * yearsOfCaregiving;

  function handleSave(formData: FormData) {
    const data = {
      goal_name: formData.get('goal_name') as string,
      goal_type: formData.get('goal_type') as SavingsGoalType,
      target_amount: Number(formData.get('target_amount')),
      current_amount: Number(formData.get('current_amount') || 0),
      deadline: formData.get('deadline') as string || undefined,
      auto_save_amount: Number(formData.get('auto_save_amount') || 0) || undefined,
      auto_save_frequency: (formData.get('auto_save_frequency') as SavingsGoal['auto_save_frequency']) || undefined,
    };

    if (editingGoal) {
      store.updateSavingsGoal(editingGoal.id, data);
    } else {
      store.addSavingsGoal(data);
    }
    setGoals(store.getSavingsGoals());
    setDialogOpen(false);
    setEditingGoal(null);
  }

  function handleDelete(id: string) {
    store.deleteSavingsGoal(id);
    setGoals(store.getSavingsGoals());
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Savings Goals</h1>
          <p className="text-muted-foreground">Build financial resilience while caregiving</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingGoal(null); }}>
          <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> New Goal</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create Savings Goal'}</DialogTitle>
            </DialogHeader>
            <form action={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal_name">Goal Name</Label>
                <Input id="goal_name" name="goal_name" defaultValue={editingGoal?.goal_name || ''} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal_type">Goal Type</Label>
                <Select name="goal_type" defaultValue={editingGoal?.goal_type || 'general'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency">Emergency Fund</SelectItem>
                    <SelectItem value="retirement_catchup">Retirement Catch-Up</SelectItem>
                    <SelectItem value="care_fund">Care Reserve</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_amount">Target Amount ($)</Label>
                  <Input id="target_amount" name="target_amount" type="number" min="0" step="100" defaultValue={editingGoal?.target_amount || ''} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_amount">Current Amount ($)</Label>
                  <Input id="current_amount" name="current_amount" type="number" min="0" step="100" defaultValue={editingGoal?.current_amount || 0} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Target Date (optional)</Label>
                <Input id="deadline" name="deadline" type="date" defaultValue={editingGoal?.deadline || ''} />
              </div>
              <Separator />
              <p className="text-sm font-medium">Auto-Save (optional)</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="auto_save_amount">Amount ($)</Label>
                  <Input id="auto_save_amount" name="auto_save_amount" type="number" min="0" step="25" defaultValue={editingGoal?.auto_save_amount || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auto_save_frequency">Frequency</Label>
                  <Select name="auto_save_frequency" defaultValue={editingGoal?.auto_save_frequency || 'monthly'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full">{editingGoal ? 'Update Goal' : 'Create Goal'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(totalCurrent)}</div>
            <p className="text-xs text-muted-foreground">of {fmt(totalTarget)} target</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress.toFixed(0)}%</div>
            <Progress value={overallProgress} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Auto-Save</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(monthlyAutoSave)}</div>
            <p className="text-xs text-muted-foreground">across all goals</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Retirement Gap</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{fmt(estimatedRetirementGap)}</div>
            <p className="text-xs text-amber-600">estimated from ~{yearsOfCaregiving}yr caregiving impact</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your Goals</h2>
        {goals.length === 0 ? (
          <Card className="p-8 text-center">
            <PiggyBank className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No savings goals yet</h3>
            <p className="text-muted-foreground mb-4">Start building your financial safety net</p>
            <Button onClick={() => setDialogOpen(true)}>Create Your First Goal</Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => {
              const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
              const remaining = goal.target_amount - goal.current_amount;
              const typeInfo = goalTypeLabels[goal.goal_type];
              const monthsToGoal = goal.auto_save_amount && goal.auto_save_amount > 0
                ? Math.ceil(remaining / goal.auto_save_amount)
                : null;

              return (
                <Card key={goal.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{goal.goal_name}</CardTitle>
                        <Badge variant="secondary" className={`mt-1 ${typeInfo.color}`}>{typeInfo.label}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingGoal(goal); setDialogOpen(true); }}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(goal.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{fmt(goal.current_amount)}</span>
                        <span className="text-muted-foreground">{fmt(goal.target_amount)}</span>
                      </div>
                      <Progress value={Math.min(progress, 100)} />
                      <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(0)}% complete &middot; {fmt(remaining)} remaining</p>
                    </div>

                    {goal.auto_save_amount && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>{fmt(goal.auto_save_amount)}/{goal.auto_save_frequency}</span>
                      </div>
                    )}

                    {goal.deadline && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Target: {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}

                    {monthsToGoal !== null && monthsToGoal > 0 && (
                      <p className="text-xs text-primary font-medium">
                        At current rate, you&apos;ll reach this goal in ~{monthsToGoal} months
                      </p>
                    )}

                    <Button variant="outline" className="w-full" onClick={() => {
                      const addAmount = goal.auto_save_amount || 100;
                      store.updateSavingsGoal(goal.id, { current_amount: goal.current_amount + addAmount });
                      setGoals(store.getSavingsGoals());
                    }}>
                      + Add {fmt(goal.auto_save_amount || 100)}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Retirement Impact Calculator */}
      <Card>
        <CardHeader>
          <CardTitle>Retirement Impact of Caregiving</CardTitle>
          <CardDescription>How caregiving affects your long-term savings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Annual Income</p>
              <p className="text-xl font-bold">{fmt(profile.annual_income)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Care Hours / Week</p>
              <p className="text-xl font-bold">{profile.care_hours_per_week} hrs</p>
              <p className="text-xs text-muted-foreground">Equivalent to {((profile.care_hours_per_week / 40) * 100).toFixed(0)}% of a full-time job</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Estimated Lost Retirement Savings</p>
              <p className="text-xl font-bold text-amber-600">{fmt(estimatedRetirementGap)}</p>
              <p className="text-xs text-muted-foreground">Based on 15% savings rate over estimated caregiving duration</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="rounded-lg bg-primary/5 p-4">
            <p className="text-sm font-medium text-primary">Recommendation</p>
            <p className="text-sm text-muted-foreground mt-1">
              Consider maximizing IRA catch-up contributions ($7,500/year for 50+) and explore employer matching programs.
              Your current auto-save of {fmt(monthlyAutoSave)}/month will recover {fmt(monthlyAutoSave * 12 * 5)} over 5 years.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
