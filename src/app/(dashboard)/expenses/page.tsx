'use client';

import { useState, useMemo, useCallback } from 'react';
import { useExpenses } from '@/hooks/use-data';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import type { Expense, ExpenseCategory } from '@/types';
import { ExpenseForm } from '@/components/expenses/expense-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Plus,
  DollarSign,
  Receipt,
  ShieldCheck,
  ShieldOff,
  Pencil,
  Trash2,
  RefreshCw,
  TrendingUp,
  Loader2,
} from 'lucide-react';

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  medical: '#ef4444',
  transportation: '#f59e0b',
  supplies: '#10b981',
  home_modification: '#6366f1',
  respite_care: '#ec4899',
  professional_care: '#3b82f6',
  legal: '#8b5cf6',
  other: '#6b7280',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getCategoryLabel(value: ExpenseCategory): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export default function ExpensesPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();

  const { expenses: allExpenses, loading, add, update, remove } = useExpenses();

  // Filter expenses by selected month/year client-side
  const expenses = useMemo(() => {
    return allExpenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [allExpenses, selectedYear, selectedMonth]);

  const filteredExpenses = useMemo(() => {
    if (categoryFilter === 'all') return expenses;
    return expenses.filter((e) => e.category === categoryFilter);
  }, [expenses, categoryFilter]);

  const totalThisMonth = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );
  const taxDeductible = useMemo(
    () => expenses.filter((e) => e.is_tax_deductible).reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );
  const nonDeductible = totalThisMonth - taxDeductible;

  const chartData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).map(([category, amount]) => ({
      category: getCategoryLabel(category as ExpenseCategory),
      amount,
      fill: CATEGORY_COLORS[category as ExpenseCategory] || '#6b7280',
    }));
  }, [expenses]);

  function handleOpenAdd() {
    setEditingExpense(undefined);
    setDialogOpen(true);
  }

  function handleOpenEdit(expense: Expense) {
    setEditingExpense(expense);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    await remove(id);
  }

  const handleSave = useCallback(
    async (data: Omit<Expense, 'id' | 'user_id' | 'created_at'>) => {
      if (editingExpense) {
        await update(editingExpense.id, data);
      } else {
        await add(data);
      }
      setDialogOpen(false);
      setEditingExpense(undefined);
    },
    [editingExpense, update, add]
  );

  const yearOptions = [2024, 2025, 2026, 2027];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Care Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage your caregiving expenses
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button onClick={handleOpenAdd}>
                <Plus className="size-4" />
                Add Expense
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </DialogTitle>
            </DialogHeader>
            <ExpenseForm
              expense={editingExpense}
              onSave={handleSave}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={String(selectedMonth)}
          onValueChange={(val) => setSelectedMonth(Number(val))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue>{() => MONTHS[selectedMonth]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i} value={String(i)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(selectedYear)}
          onValueChange={(val) => setSelectedYear(Number(val))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue>{() => String(selectedYear)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(val) => { if (val) setCategoryFilter(val); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {EXPENSE_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total This Month
            </CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt.format(totalThisMonth)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tax Deductible
            </CardTitle>
            <ShieldCheck className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {fmt.format(taxDeductible)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Non-Deductible
            </CardTitle>
            <ShieldOff className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt.format(nonDeductible)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              # of Expenses
            </CardTitle>
            <Receipt className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4" />
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 60, left: 20 }}>
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 12 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `$${v}`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={((value: any) => [fmt.format(value), 'Amount']) as any}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Expense Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {MONTHS[selectedMonth]} {selectedYear} Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Receipt className="mb-3 size-10 opacity-40" />
              <p className="text-sm">No expenses found for this period.</p>
              <Button variant="outline" className="mt-4" onClick={handleOpenAdd}>
                <Plus className="size-4" />
                Add your first expense
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Tax Ded.</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {new Date(expense.date.split('T')[0] + 'T12:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {expense.description}
                        {expense.is_recurring && (
                          <RefreshCw className="size-3 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[expense.category]}15`,
                          color: CATEGORY_COLORS[expense.category],
                          borderColor: `${CATEGORY_COLORS[expense.category]}30`,
                        }}
                      >
                        {getCategoryLabel(expense.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {fmt.format(expense.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      {expense.is_tax_deductible ? (
                        <ShieldCheck className="mx-auto size-4 text-green-600" />
                      ) : (
                        <ShieldOff className="mx-auto size-4 text-muted-foreground/40" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenEdit(expense)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
