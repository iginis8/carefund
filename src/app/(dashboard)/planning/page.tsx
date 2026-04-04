'use client';

import { useState } from 'react';
import { store } from '@/lib/store';
import { CARE_TYPES } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { LineChart, Calculator, Home, Building2, DollarSign, TrendingDown, Clock, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export default function PlanningPage() {
  const profile = store.getProfile();

  // Care Cost Calculator state
  const [selectedCareType, setSelectedCareType] = useState(CARE_TYPES[0].value);
  const [durationYears, setDurationYears] = useState(3);
  const [hoursPerWeek, setHoursPerWeek] = useState(40);

  const selectedCare = CARE_TYPES.find(c => c.value === selectedCareType)!;
  const adjustedMonthlyCost = selectedCare.avg_monthly_cost * (hoursPerWeek / 40);
  const totalCost = adjustedMonthlyCost * durationYears * 12;

  // Medicaid estimator state
  const [totalAssets, setTotalAssets] = useState(150000);
  const [monthlyIncome, setMonthlyIncome] = useState(2500);
  const medicaidAssetLimit = 2000; // Individual limit in most states
  const spouseAssetLimit = 154140; // 2024 CSRA max
  const spendDown = Math.max(0, totalAssets - spouseAssetLimit);
  const monthsToSpendDown = spendDown > 0 ? Math.ceil(spendDown / (selectedCare.avg_monthly_cost - monthlyIncome)) : 0;

  // Budget builder state
  const [monthlyTakeHome, setMonthlyTakeHome] = useState(Math.round(profile.annual_income / 12 * 0.75));
  const budgetItems = [
    { category: 'Housing', amount: Math.round(monthlyTakeHome * 0.3), color: '#0d9488' },
    { category: 'Care Costs', amount: Math.round(adjustedMonthlyCost * 0.5), color: '#f59e0b' },
    { category: 'Groceries & Essentials', amount: Math.round(monthlyTakeHome * 0.15), color: '#6366f1' },
    { category: 'Transportation', amount: Math.round(monthlyTakeHome * 0.1), color: '#ec4899' },
    { category: 'Insurance & Health', amount: Math.round(monthlyTakeHome * 0.08), color: '#8b5cf6' },
    { category: 'Savings', amount: Math.round(monthlyTakeHome * 0.1), color: '#10b981' },
    { category: 'Other', amount: Math.round(monthlyTakeHome * 0.07), color: '#94a3b8' },
  ];
  const totalBudget = budgetItems.reduce((s, i) => s + i.amount, 0);
  const budgetSurplus = monthlyTakeHome - totalBudget;

  // Care comparison data
  const comparisonData = CARE_TYPES.map(ct => ({
    name: ct.label.split(' ')[0],
    fullName: ct.label,
    monthly: ct.avg_monthly_cost,
    yearly: ct.avg_monthly_cost * 12,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financial Planning</h1>
        <p className="text-muted-foreground">Compare care options, estimate costs, and plan your budget</p>
      </div>

      <Tabs defaultValue="calculator">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculator">Care Costs</TabsTrigger>
          <TabsTrigger value="medicaid">Medicaid</TabsTrigger>
          <TabsTrigger value="retirement">Retirement</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
        </TabsList>

        {/* Care Cost Calculator */}
        <TabsContent value="calculator" className="space-y-6 mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" /> Care Cost Calculator
                </CardTitle>
                <CardDescription>Estimate the cost of different care options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Type of Care</Label>
                  <Select value={selectedCareType} onValueChange={(v) => { if (v) setSelectedCareType(v as typeof selectedCareType); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CARE_TYPES.map(ct => (
                        <SelectItem key={ct.value} value={ct.value}>
                          {ct.label} (avg {fmt(ct.avg_monthly_cost)}/mo)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration (years)</Label>
                  <Input type="number" min={1} max={20} value={durationYears} onChange={e => setDurationYears(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Hours per Week</Label>
                  <Input type="number" min={1} max={168} value={hoursPerWeek} onChange={e => setHoursPerWeek(Number(e.target.value))} />
                </div>

                <Separator />

                <div className="rounded-lg bg-primary/5 p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Monthly Cost</span>
                    <span className="font-bold text-lg">{fmt(adjustedMonthlyCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Annual Cost</span>
                    <span className="font-bold">{fmt(adjustedMonthlyCost * 12)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total ({durationYears} years)</span>
                    <span className="font-bold text-xl text-primary">{fmt(totalCost)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Care Cost Comparison</CardTitle>
                <CardDescription>Average monthly costs by care type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData} layout="vertical">
                    <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={((value: number) => fmt(value)) as any} labelFormatter={(label: any) => comparisonData.find(d => d.name === label)?.fullName || label} />
                    <Bar dataKey="monthly" radius={[0, 4, 4, 0]}>
                      {comparisonData.map((entry, i) => (
                        <Cell key={i} fill={entry.fullName === selectedCare.label ? '#0d9488' : '#d1d5db'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>What-If Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: 'Home Care (20 hrs/wk)', cost: CARE_TYPES[0].avg_monthly_cost * 0.5, icon: Home },
                  { label: 'Assisted Living (full)', cost: CARE_TYPES[2].avg_monthly_cost, icon: Building2 },
                  { label: 'Home + Adult Day Care', cost: CARE_TYPES[0].avg_monthly_cost * 0.3 + CARE_TYPES[1].avg_monthly_cost, icon: Clock },
                ].map((scenario, i) => (
                  <div key={i} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <scenario.icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{scenario.label}</span>
                    </div>
                    <p className="text-2xl font-bold">{fmt(scenario.cost)}<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
                    <p className="text-xs text-muted-foreground">{fmt(scenario.cost * 12)}/year &middot; {fmt(scenario.cost * 12 * durationYears)} over {durationYears} years</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medicaid Estimator */}
        <TabsContent value="medicaid" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5" /> Medicaid Spend-Down Estimator
              </CardTitle>
              <CardDescription>Estimate when your care recipient may qualify for Medicaid assistance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Total Countable Assets ($)</Label>
                  <Input type="number" value={totalAssets} onChange={e => setTotalAssets(Number(e.target.value))} />
                  <p className="text-xs text-muted-foreground">Include savings, investments, property (excluding primary home up to $713K)</p>
                </div>
                <div className="space-y-2">
                  <Label>Care Recipient Monthly Income ($)</Label>
                  <Input type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(Number(e.target.value))} />
                  <p className="text-xs text-muted-foreground">Social Security, pension, etc.</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm text-amber-800 font-medium">Spend-Down Required</p>
                  <p className="text-2xl font-bold text-amber-700">{fmt(spendDown)}</p>
                  <p className="text-xs text-amber-600 mt-1">Assets above {fmt(spouseAssetLimit)} (spouse protection)</p>
                </div>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <p className="text-sm text-blue-800 font-medium">Estimated Time to Qualify</p>
                  <p className="text-2xl font-bold text-blue-700">{monthsToSpendDown > 0 ? `${monthsToSpendDown} months` : 'Already eligible'}</p>
                  <p className="text-xs text-blue-600 mt-1">At current care costs minus income</p>
                </div>
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                  <p className="text-sm text-green-800 font-medium">Spouse Protected Amount</p>
                  <p className="text-2xl font-bold text-green-700">{fmt(Math.min(totalAssets, spouseAssetLimit))}</p>
                  <p className="text-xs text-green-600 mt-1">Community Spouse Resource Allowance</p>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-2">Important Notes</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>&bull; Medicaid rules vary significantly by state. This is a general estimate.</li>
                  <li>&bull; A 5-year look-back period applies to asset transfers.</li>
                  <li>&bull; Consult an elder law attorney for personalized guidance.</li>
                  <li>&bull; Some assets (primary home, one vehicle, personal property) are typically exempt.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retirement Impact */}
        <TabsContent value="retirement" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" /> Retirement Impact Projector
              </CardTitle>
              <CardDescription>See how caregiving affects your retirement savings trajectory</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-medium">Your Situation</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Annual Income</span>
                      <span className="font-medium">{fmt(profile.annual_income)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Care Hours / Week</span>
                      <span className="font-medium">{profile.care_hours_per_week} hrs</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Estimated Work Impact</span>
                      <span className="font-medium text-amber-600">-{Math.round(profile.care_hours_per_week / 40 * 30)}% productivity</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Projected Impact (Over 10 Years)</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Lost 401(k) contributions', value: profile.annual_income * 0.06 * 10, note: 'At 6% contribution rate' },
                      { label: 'Lost employer match', value: profile.annual_income * 0.03 * 10, note: 'At 3% match' },
                      { label: 'Lost compound growth', value: profile.annual_income * 0.06 * 10 * 0.4, note: 'Estimated 7% annual return' },
                      { label: 'Social Security reduction', value: profile.annual_income * 0.02 * 10, note: 'From reduced work years' },
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <div>
                          <span className="text-muted-foreground">{item.label}</span>
                          <p className="text-xs text-muted-foreground">{item.note}</p>
                        </div>
                        <span className="font-medium text-destructive">-{fmt(item.value)}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total Estimated Impact</span>
                      <span className="text-destructive">-{fmt(profile.annual_income * 0.06 * 10 + profile.annual_income * 0.03 * 10 + profile.annual_income * 0.06 * 10 * 0.4 + profile.annual_income * 0.02 * 10)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-primary/5 p-4 space-y-2">
                <p className="text-sm font-medium text-primary">Recovery Strategies</p>
                <div className="grid gap-3 md:grid-cols-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>Maximize IRA catch-up contributions ($7,500/year if 50+)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>Spousal IRA contributions even if not working</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>Negotiate flexible work arrangements to maintain employment</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>Explore caregiver tax credits to reduce current tax burden</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget Builder */}
        <TabsContent value="budget" className="space-y-6 mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Caregiver Budget Builder
                </CardTitle>
                <CardDescription>Plan your monthly budget around caregiving costs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Monthly Take-Home Pay ($)</Label>
                  <Input type="number" value={monthlyTakeHome} onChange={e => setMonthlyTakeHome(Number(e.target.value))} />
                </div>

                <Separator />

                <div className="space-y-3">
                  {budgetItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.category}</span>
                      </div>
                      <span className="text-sm font-medium">{fmt(item.amount)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-center justify-between font-bold">
                    <span>Total</span>
                    <span>{fmt(totalBudget)}</span>
                  </div>
                  <div className={`flex items-center justify-between font-bold ${budgetSurplus >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    <span>{budgetSurplus >= 0 ? 'Surplus' : 'Deficit'}</span>
                    <span>{fmt(budgetSurplus)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={budgetItems}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {budgetItems.map((item, i) => (
                        <Cell key={i} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={((value: number) => fmt(value)) as any} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Landmark(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="3" x2="21" y1="22" y2="22" /><line x1="6" x2="6" y1="18" y2="11" /><line x1="10" x2="10" y1="18" y2="11" /><line x1="14" x2="14" y1="18" y2="11" /><line x1="18" x2="18" y1="18" y2="11" /><polygon points="12 2 20 7 4 7" />
    </svg>
  );
}
