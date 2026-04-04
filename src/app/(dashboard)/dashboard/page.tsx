'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  DollarSign, ArrowRight, CheckCircle2, Clock, AlertTriangle,
  Receipt, Shield, TrendingUp, ChevronRight, Sparkles, CircleDollarSign, Crown,
} from 'lucide-react';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

interface NextAction {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  value?: string;
  time: string;
  href: string;
  cta: string;
  icon: typeof DollarSign;
  done: boolean;
}

function buildActions(profile: ReturnType<typeof store.getProfile>): NextAction[] {
  const credits = store.getEligibleCredits();
  const goals = store.getSavingsGoals();
  const benefits = store.getBenefits();
  const expenses = store.getExpenses();

  const actions: NextAction[] = [];

  // High priority: Unclaimed tax credits
  const unclaimedCredits = credits.filter(c => c.status === 'eligible');
  if (unclaimedCredits.length > 0) {
    const totalValue = unclaimedCredits.reduce((s, c) => s + c.estimated_value, 0);
    actions.push({
      id: 'claim-credits',
      priority: 'high',
      title: `Claim ${fmt(totalValue)} in tax credits`,
      description: `You have ${unclaimedCredits.length} eligible credits you haven't claimed yet.`,
      value: fmt(totalValue),
      time: '10 min',
      href: '/money',
      cta: 'Claim Now',
      icon: DollarSign,
      done: false,
    });
  }

  // High priority: Available benefits not applied
  const availableBenefits = benefits.filter(b => b.status === 'available');
  if (availableBenefits.length > 0) {
    actions.push({
      id: 'apply-benefits',
      priority: 'high',
      title: `Apply for ${availableBenefits.length} programs you qualify for`,
      description: `Including ${availableBenefits[0].benefit_name}${availableBenefits.length > 1 ? ` and ${availableBenefits.length - 1} more` : ''}.`,
      time: '15 min',
      href: '/benefits',
      cta: 'See Programs',
      icon: Shield,
      done: false,
    });
  }

  // Medium: No recent expenses tracked
  const thisMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  if (thisMonthExpenses.length < 3) {
    actions.push({
      id: 'track-expenses',
      priority: 'medium',
      title: 'Log this month\'s care expenses',
      description: 'Every tracked expense is a potential deduction. You have ' + thisMonthExpenses.length + ' logged this month.',
      time: '5 min',
      href: '/expenses',
      cta: 'Add Expenses',
      icon: Receipt,
      done: false,
    });
  }

  // Medium: Emergency fund under target
  const emergencyGoal = goals.find(g => g.goal_type === 'emergency');
  if (emergencyGoal && emergencyGoal.current_amount < emergencyGoal.target_amount * 0.5) {
    actions.push({
      id: 'build-emergency',
      priority: 'medium',
      title: 'Your emergency fund is below 50%',
      description: `${fmt(emergencyGoal.current_amount)} of ${fmt(emergencyGoal.target_amount)} saved. Add ${fmt(emergencyGoal.auto_save_amount || 200)} this month.`,
      time: '2 min',
      href: '/money',
      cta: 'Add Savings',
      icon: TrendingUp,
      done: false,
    });
  }

  return actions;
}

export default function DashboardPage() {
  const profile = store.getProfile();
  const stats = store.getDashboardStats();
  const credits = store.getEligibleCredits();
  const goals = store.getSavingsGoals();
  const expenses = store.getExpenses();
  const recentExpenses = expenses.slice(0, 4);
  const actions = useMemo(() => buildActions(profile), [profile]);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

  const totalRecoverable = credits.reduce((s, c) => s + c.estimated_value, 0);
  const firstName = profile.full_name.split(' ')[0] || 'there';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Hero — Money you're missing */}
      <div className="rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Hey {firstName}, you could be claiming</p>
            <p className="text-4xl font-black text-primary mt-1">{fmt(totalRecoverable)}<span className="text-lg font-medium text-muted-foreground">/year</span></p>
            <p className="text-sm text-muted-foreground mt-1">in tax credits, deductions, and benefits</p>
          </div>
          <Link href="/money">
            <Button size="lg">
              <DollarSign className="mr-2 h-5 w-5" /> Claim My Money <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Next Best Actions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Your Next Actions</h2>
          </div>
          <Badge variant="secondary">{actions.filter(a => !completedActions.has(a.id)).length} remaining</Badge>
        </div>

        <div className="space-y-3">
          {actions.filter(a => !completedActions.has(a.id)).map((action) => {
            const Icon = action.icon;
            const isHigh = action.priority === 'high';
            return (
              <Card key={action.id} className={isHigh ? 'border-primary/30 bg-primary/[0.02]' : ''}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-full ${isHigh ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`h-5 w-5 ${isHigh ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{action.title}</p>
                      {isHigh && <Badge className="bg-primary/10 text-primary text-[10px] px-1.5 py-0">High impact</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {action.value && (
                        <span className="text-xs font-bold text-green-700">{action.value}</span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {action.time}
                      </span>
                    </div>
                  </div>
                  <Link href={action.href}>
                    <Button size="sm" variant={isHigh ? 'default' : 'outline'}>
                      {action.cta} <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}

          {actions.filter(a => !completedActions.has(a.id)).length === 0 && (
            <Card className="p-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
              <p className="font-semibold">You&apos;re caught up!</p>
              <p className="text-sm text-muted-foreground">No pending actions. Check back soon.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Tax Savings</p>
            <p className="text-xl font-bold text-green-700">{fmt(stats.estimated_tax_savings)}</p>
            <p className="text-[10px] text-muted-foreground">{stats.eligible_credits} credits eligible</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Monthly Expenses</p>
            <p className="text-xl font-bold">{fmt(stats.total_expenses_this_month)}</p>
            <p className="text-[10px] text-muted-foreground">{expenses.filter(e => e.is_tax_deductible && new Date(e.date).getMonth() === new Date().getMonth()).length} deductible</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Savings Progress</p>
            <p className="text-xl font-bold">{stats.savings_goal_progress.toFixed(0)}%</p>
            <Progress value={stats.savings_goal_progress} className="mt-1 h-1" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Active Benefits</p>
            <p className="text-xl font-bold">{stats.active_benefits}</p>
            <p className="text-[10px] text-muted-foreground">{store.getBenefits().filter(b => b.status === 'available').length} more available</p>
          </CardContent>
        </Card>
      </div>

      {/* Premium upsell */}
      {!store.isPremium() && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
              <Crown className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Unlock AI recommendations & care planning</p>
              <p className="text-xs text-muted-foreground">Premium members find an extra $2,400/year on average</p>
            </div>
            <Link href="/settings">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                <Sparkles className="mr-1 h-3 w-3" /> Upgrade
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent Expenses — compact */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-sm">Recent Expenses</CardTitle>
          <Link href="/expenses">
            <Button variant="ghost" size="xs">View All <ChevronRight className="ml-1 h-3 w-3" /></Button>
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          {recentExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No expenses tracked yet.</p>
          ) : (
            <div className="space-y-2">
              {recentExpenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Receipt className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{exp.description}</span>
                    {exp.is_tax_deductible && <CircleDollarSign className="h-3 w-3 text-green-600 shrink-0" />}
                  </div>
                  <span className="font-medium shrink-0 ml-2">{fmt(exp.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
