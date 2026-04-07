'use client';

import { useState } from 'react';
import type { Expense, ExpenseCategory } from '@/types';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Info, CircleDollarSign } from 'lucide-react';

interface ExpenseFormProps {
  expense?: Expense;
  onSave: (data: Omit<Expense, 'id' | 'user_id' | 'created_at'>) => Promise<void> | void;
  onCancel: () => void;
}

// Auto-detection rules: category -> { deductible, taxCategory, explanation }
const TAX_RULES: Record<ExpenseCategory, { deductible: boolean; taxCategory: string; explanation: string }> = {
  medical: {
    deductible: true,
    taxCategory: 'medical_expense',
    explanation: 'Prescription medications and medical supplies are deductible as medical expenses (Schedule A).',
  },
  transportation: {
    deductible: true,
    taxCategory: 'medical_expense',
    explanation: 'Transportation to medical appointments is deductible. Track mileage at $0.67/mile (2024 rate).',
  },
  supplies: {
    deductible: true,
    taxCategory: 'medical_expense',
    explanation: 'Care supplies like incontinence products and medical equipment are deductible medical expenses.',
  },
  home_modification: {
    deductible: true,
    taxCategory: 'medical_expense',
    explanation: 'Home modifications for medical care (ramps, grab bars, widened doorways) are deductible medical expenses.',
  },
  professional_care: {
    deductible: true,
    taxCategory: 'dependent_care',
    explanation: 'Professional caregiving costs qualify for the Dependent Care Credit (Form 2441) — up to $3,000/$6,000.',
  },
  legal: {
    deductible: true,
    taxCategory: 'other',
    explanation: 'Legal fees for care-related matters (guardianship, power of attorney) may be deductible.',
  },
  respite_care: {
    deductible: false,
    taxCategory: '',
    explanation: 'Respite care is generally not tax deductible unless prescribed by a doctor as medically necessary.',
  },
  other: {
    deductible: false,
    taxCategory: '',
    explanation: 'This category isn\'t automatically deductible. If you think it qualifies, toggle the override below.',
  },
};

const RECURRENCE_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export function ExpenseForm({ expense, onSave, onCancel }: ExpenseFormProps) {
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? '');
  const [category, setCategory] = useState<ExpenseCategory | ''>(expense?.category ?? '');
  const [description, setDescription] = useState(expense?.description ?? '');
  const [date, setDate] = useState(expense?.date?.split('T')[0] ?? new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(expense?.is_recurring ?? false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<string>(
    expense?.recurrence_interval ?? 'monthly'
  );
  const [submitting, setSubmitting] = useState(false);
  // Override: let user manually toggle if they disagree with auto-detection
  const [manualOverride, setManualOverride] = useState(false);
  const [overrideDeductible, setOverrideDeductible] = useState(expense?.is_tax_deductible ?? false);

  // Auto-detect tax status from category
  const taxRule = category ? TAX_RULES[category] : null;
  const isDeductible = manualOverride ? overrideDeductible : (taxRule?.deductible ?? false);
  const taxCategory = manualOverride
    ? (overrideDeductible ? (taxRule?.taxCategory || 'other') : '')
    : (taxRule?.taxCategory ?? '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!amount || !category || !description || !date) return;

    const data = {
      amount: parseFloat(amount),
      category: category as ExpenseCategory,
      description,
      date: date + 'T12:00:00',
      is_tax_deductible: isDeductible,
      tax_category: isDeductible ? taxCategory || undefined : undefined,
      is_recurring: isRecurring,
      recurrence_interval: isRecurring
        ? (recurrenceInterval as Expense['recurrence_interval'])
        : undefined,
    };

    setSubmitting(true);
    try {
      await onSave(data);
      onCancel();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="amount">Amount ($)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={(val) => { if (val) { setCategory(val as ExpenseCategory); setManualOverride(false); } }}>
          <SelectTrigger className="w-full">
            <SelectValue>{() => category ? EXPENSE_CATEGORIES.find(c => c.value === category)?.label || 'Select category' : 'Select category'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="What was this expense for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      {/* Auto tax detection -- shows after category is selected */}
      {category && taxRule && (
        <div className={`rounded-lg p-3 text-sm ${isDeductible ? 'bg-green-50 border border-green-200' : 'bg-muted border'}`}>
          <div className="flex items-start gap-2">
            {isDeductible ? (
              <CircleDollarSign className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            ) : (
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {isDeductible ? 'Tax Deductible' : 'Not Deductible'}
                </span>
                {isDeductible && taxCategory && (
                  <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800">
                    {taxCategory === 'medical_expense' ? 'Medical' : taxCategory === 'dependent_care' ? 'Dependent Care' : 'Other'}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{taxRule.explanation}</p>

              {/* Manual override toggle */}
              <button
                type="button"
                onClick={() => {
                  if (!manualOverride) {
                    setManualOverride(true);
                    setOverrideDeductible(!taxRule.deductible);
                  } else {
                    setManualOverride(false);
                  }
                }}
                className="text-xs text-primary hover:underline mt-1.5 inline-block"
              >
                {manualOverride ? '↩ Use auto-detection' : 'Not right? Override →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recurring */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="recurring"
            checked={isRecurring}
            onCheckedChange={(checked) => setIsRecurring(checked === true)}
          />
          <Label htmlFor="recurring" className="cursor-pointer">Recurring Expense</Label>
        </div>

        {isRecurring && (
          <div className="grid gap-2 pl-6">
            <Label htmlFor="recurrence" className="text-xs text-muted-foreground">How often?</Label>
            <Select value={recurrenceInterval} onValueChange={(v) => { if (v) setRecurrenceInterval(v); }}>
              <SelectTrigger className="w-full">
                <SelectValue>{() => RECURRENCE_OPTIONS.find(o => o.value === recurrenceInterval)?.label || 'Monthly'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : expense ? 'Update Expense' : 'Add Expense'}
        </Button>
      </div>
    </form>
  );
}
