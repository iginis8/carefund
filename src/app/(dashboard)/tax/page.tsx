'use client';

import { useState, useMemo } from 'react';
import { store } from '@/lib/store';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import type { TaxCreditStatus, ExpenseCategory } from '@/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  DollarSign,
  FileText,
  ShieldCheck,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
  ClipboardCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const STATUS_CONFIG: Record<TaxCreditStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  eligible: { label: 'Eligible', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  claimed: { label: 'Claimed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: ShieldCheck },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  not_eligible: { label: 'Not Eligible', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', icon: XCircle },
};

const CHECKLIST_ITEMS = [
  'Gather all medical receipts and invoices',
  'Calculate total care expenses for the year',
  'Verify dependent care provider tax IDs',
  'Collect Form W-2 for dependent care benefits',
  'Document home modification costs with photos',
  'Track mileage logs for medical transportation',
  'Obtain statement of medical necessity from doctor',
  'Review FSA contributions and reimbursements',
  'Confirm state-specific caregiver credit eligibility',
  'Consult with tax professional about deductions',
];

function getCategoryLabel(value: ExpenseCategory): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export default function TaxPage() {
  const taxCredits = store.getTaxCredits();
  const eligibleCredits = store.getEligibleCredits();
  const allExpenses = store.getExpenses();
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [expandedCredit, setExpandedCredit] = useState<string | null>(null);

  const totalEstimatedSavings = useMemo(
    () => eligibleCredits.reduce((sum, c) => sum + c.estimated_value, 0),
    [eligibleCredits]
  );

  const deductibleExpenses = useMemo(
    () => allExpenses.filter((e) => e.is_tax_deductible),
    [allExpenses]
  );

  const totalDeductible = useMemo(
    () => deductibleExpenses.reduce((sum, e) => sum + e.amount, 0),
    [deductibleExpenses]
  );

  const groupedByTaxCategory = useMemo(() => {
    const groups: Record<string, { total: number; count: number }> = {};
    deductibleExpenses.forEach((e) => {
      const key = e.tax_category || 'uncategorized';
      if (!groups[key]) groups[key] = { total: 0, count: 0 };
      groups[key].total += e.amount;
      groups[key].count += 1;
    });
    return groups;
  }, [deductibleExpenses]);

  const completedChecklist = Object.values(checkedItems).filter(Boolean).length;

  function toggleChecklist(index: number) {
    setCheckedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  function toggleExpanded(id: string) {
    setExpandedCredit((prev) => (prev === id ? null : id));
  }

  const TAX_CATEGORY_LABELS: Record<string, string> = {
    medical_expense: 'Medical Expenses',
    dependent_care: 'Dependent Care',
    home_improvement: 'Home Improvement (Medical)',
    uncategorized: 'Other Deductible',
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tax Credits & Deductions</h1>
        <p className="text-sm text-muted-foreground">
          Maximize your tax savings as a family caregiver
        </p>
      </div>

      {/* Big Summary */}
      <Card className="border-green-200 dark:border-green-900/40">
        <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <DollarSign className="size-6 text-green-600" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Estimated Tax Savings This Year
          </p>
          <p className="text-4xl font-bold text-green-600">
            {fmt.format(totalEstimatedSavings)}
          </p>
          <p className="text-xs text-muted-foreground">
            Based on {eligibleCredits.length} eligible credits and deductions
          </p>
        </CardContent>
      </Card>

      {/* Tax Credit Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Available Tax Credits</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {taxCredits.map((credit) => {
            const statusConf = STATUS_CONFIG[credit.status];
            const StatusIcon = statusConf.icon;
            const isExpanded = expandedCredit === credit.id;

            return (
              <Card key={credit.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{credit.credit_name}</CardTitle>
                    <Badge
                      variant="secondary"
                      className={statusConf.color}
                    >
                      <StatusIcon className="size-3" />
                      {statusConf.label}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {credit.irs_form}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted-foreground">Estimated Value</span>
                    <span className="text-xl font-bold">
                      {credit.estimated_value > 0
                        ? fmt.format(credit.estimated_value)
                        : '--'}
                    </span>
                  </div>
                  {credit.max_value > 0 && (
                    <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                      <span>Maximum</span>
                      <span>{fmt.format(credit.max_value)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(credit.id)}
                      className="gap-1 px-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Info className="size-3" />
                      Learn More
                      {isExpanded ? (
                        <ChevronUp className="size-3" />
                      ) : (
                        <ChevronDown className="size-3" />
                      )}
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <a
                              href={credit.irs_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            />
                          }
                        >
                          <ExternalLink className="size-3" />
                          IRS Info
                        </TooltipTrigger>
                        <TooltipContent>
                          View on IRS website
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {isExpanded && (
                    <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                      {credit.description}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Tax Deduction Tracker */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Receipt className="size-5" />
          Tax Deduction Tracker
        </h2>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Deductible Expenses by Category</CardTitle>
              <span className="text-lg font-bold text-green-600">
                {fmt.format(totalDeductible)}
              </span>
            </div>
            <CardDescription>
              {deductibleExpenses.length} tax-deductible expenses tracked
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(groupedByTaxCategory).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No deductible expenses tracked yet.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedByTaxCategory).map(([category, data]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {TAX_CATEGORY_LABELS[category] ?? category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {data.count} expense{data.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="font-semibold">{fmt.format(data.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Tax Filing Checklist */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <ClipboardCheck className="size-5" />
          Tax Filing Checklist
        </h2>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Preparation Checklist</CardTitle>
              <Badge variant="secondary">
                {completedChecklist}/{CHECKLIST_ITEMS.length} done
              </Badge>
            </div>
            <CardDescription>
              Complete these steps before filing your taxes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {CHECKLIST_ITEMS.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30"
                >
                  <Checkbox
                    id={`checklist-${index}`}
                    checked={!!checkedItems[index]}
                    onCheckedChange={() => toggleChecklist(index)}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={`checklist-${index}`}
                    className={`cursor-pointer text-sm leading-relaxed ${
                      checkedItems[index] ? 'text-muted-foreground line-through' : ''
                    }`}
                  >
                    {item}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
