// Supabase-backed data store for expenses, savings goals, and benefit tracking
// Reads/writes go to Supabase, with local cache for instant UI updates

import { createClient } from '@/lib/supabase/client';
import type { Expense, SavingsGoal } from '@/types';

// --- Cache ---
let expenseCache: Expense[] | null = null;
let goalsCache: SavingsGoal[] | null = null;
let benefitStatusCache: Map<string, string> | null = null;
let userId: string | null = null;

async function getUserId(): Promise<string | null> {
  if (userId) return userId;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  userId = user?.id || null;
  return userId;
}

// --- Expenses ---

export async function fetchExpenses(): Promise<Expense[]> {
  const uid = await getUserId();
  if (!uid) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', uid)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching expenses:', error);
    return expenseCache || [];
  }

  expenseCache = (data || []).map(row => ({
    id: row.id,
    user_id: row.user_id,
    amount: Number(row.amount),
    category: row.category,
    description: row.description,
    date: row.date,
    receipt_url: row.receipt_url,
    is_tax_deductible: row.is_tax_deductible,
    tax_category: row.tax_category,
    is_recurring: row.is_recurring,
    recurrence_interval: row.recurrence_interval,
    created_at: row.created_at,
  }));

  return expenseCache;
}

export async function addExpense(expense: Omit<Expense, 'id' | 'user_id' | 'created_at'>): Promise<Expense | null> {
  const uid = await getUserId();
  if (!uid) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...expense, user_id: uid })
    .select()
    .single();

  if (error) {
    console.error('Error adding expense:', error);
    return null;
  }

  const newExpense: Expense = {
    ...data,
    amount: Number(data.amount),
  };

  // Update cache
  if (expenseCache) expenseCache.unshift(newExpense);
  else expenseCache = [newExpense];

  return newExpense;
}

export async function updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating expense:', error);
    return null;
  }

  // Update cache
  if (expenseCache) {
    const idx = expenseCache.findIndex(e => e.id === id);
    if (idx >= 0) expenseCache[idx] = { ...expenseCache[idx], ...data, amount: Number(data.amount) };
  }

  return data ? { ...data, amount: Number(data.amount) } : null;
}

export async function deleteExpense(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting expense:', error);
    return false;
  }

  // Update cache
  if (expenseCache) expenseCache = expenseCache.filter(e => e.id !== id);

  return true;
}

// --- Savings Goals ---

export async function fetchSavingsGoals(): Promise<SavingsGoal[]> {
  const uid = await getUserId();
  if (!uid) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching goals:', error);
    return goalsCache || [];
  }

  goalsCache = (data || []).map(row => ({
    id: row.id,
    user_id: row.user_id,
    goal_name: row.goal_name,
    goal_type: row.goal_type,
    target_amount: Number(row.target_amount),
    current_amount: Number(row.current_amount),
    deadline: row.deadline,
    auto_save_amount: row.auto_save_amount ? Number(row.auto_save_amount) : undefined,
    auto_save_frequency: row.auto_save_frequency,
    created_at: row.created_at,
  }));

  return goalsCache;
}

export async function addSavingsGoal(goal: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at'>): Promise<SavingsGoal | null> {
  const uid = await getUserId();
  if (!uid) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('savings_goals')
    .insert({ ...goal, user_id: uid })
    .select()
    .single();

  if (error) {
    console.error('Error adding goal:', error);
    return null;
  }

  const newGoal: SavingsGoal = {
    ...data,
    target_amount: Number(data.target_amount),
    current_amount: Number(data.current_amount),
    auto_save_amount: data.auto_save_amount ? Number(data.auto_save_amount) : undefined,
  };

  if (goalsCache) goalsCache.unshift(newGoal);
  else goalsCache = [newGoal];

  return newGoal;
}

export async function updateSavingsGoal(id: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('savings_goals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating goal:', error);
    return null;
  }

  if (goalsCache) {
    const idx = goalsCache.findIndex(g => g.id === id);
    if (idx >= 0) goalsCache[idx] = {
      ...goalsCache[idx],
      ...data,
      target_amount: Number(data.target_amount),
      current_amount: Number(data.current_amount),
      auto_save_amount: data.auto_save_amount ? Number(data.auto_save_amount) : undefined,
    };
  }

  return data ? {
    ...data,
    target_amount: Number(data.target_amount),
    current_amount: Number(data.current_amount),
    auto_save_amount: data.auto_save_amount ? Number(data.auto_save_amount) : undefined,
  } : null;
}

export async function deleteSavingsGoal(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('savings_goals')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting goal:', error);
    return false;
  }

  if (goalsCache) goalsCache = goalsCache.filter(g => g.id !== id);

  return true;
}

// --- Benefit Status Tracking ---

export async function fetchBenefitStatuses(): Promise<Map<string, string>> {
  const uid = await getUserId();
  if (!uid) return new Map();

  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_benefits')
    .select('benefit_id, status')
    .eq('user_id', uid);

  if (error) {
    console.error('Error fetching benefit statuses:', error);
    return benefitStatusCache || new Map();
  }

  benefitStatusCache = new Map((data || []).map(row => [row.benefit_id, row.status]));
  return benefitStatusCache;
}

export async function updateBenefitStatus(benefitId: string, status: string): Promise<boolean> {
  const uid = await getUserId();
  if (!uid) return false;

  const supabase = createClient();
  const { error } = await supabase
    .from('user_benefits')
    .upsert({
      user_id: uid,
      benefit_id: benefitId,
      status,
      applied_at: status === 'applied' ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,benefit_id' });

  if (error) {
    console.error('Error updating benefit status:', error);
    return false;
  }

  if (benefitStatusCache) benefitStatusCache.set(benefitId, status);
  else {
    benefitStatusCache = new Map();
    benefitStatusCache.set(benefitId, status);
  }

  return true;
}

// --- Cache management ---

export function clearCache() {
  expenseCache = null;
  goalsCache = null;
  benefitStatusCache = null;
  userId = null;
}
