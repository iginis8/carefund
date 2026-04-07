'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Expense, SavingsGoal, Benefit } from '@/types';
import { store } from '@/lib/store';
import { getBenefitsForState } from '@/lib/benefits-data';
import * as db from '@/lib/supabase-store';

// Hook for expenses — fetches from Supabase, falls back to local store
export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await db.fetchExpenses();
    setExpenses(data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (expense: Omit<Expense, 'id' | 'user_id' | 'created_at'>) => {
    const result = await db.addExpense(expense);
    if (result) await refresh();
    return result;
  };

  const update = async (id: string, updates: Partial<Expense>) => {
    const result = await db.updateExpense(id, updates);
    if (result) await refresh();
    return result;
  };

  const remove = async (id: string) => {
    const success = await db.deleteExpense(id);
    if (success) await refresh();
    return success;
  };

  return { expenses, loading, refresh, add, update, remove };
}

// Hook for savings goals
export function useSavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await db.fetchSavingsGoals();
    setGoals(data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (goal: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at'>) => {
    const result = await db.addSavingsGoal(goal);
    if (result) await refresh();
    return result;
  };

  const update = async (id: string, updates: Partial<SavingsGoal>) => {
    const result = await db.updateSavingsGoal(id, updates);
    if (result) await refresh();
    return result;
  };

  const remove = async (id: string) => {
    const success = await db.deleteSavingsGoal(id);
    if (success) await refresh();
    return success;
  };

  return { goals, loading, refresh, add, update, remove };
}

// Hook for benefits with user status overlay
export function useBenefits() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const profile = store.getProfile();
    const baseBenefits = getBenefitsForState(profile.state);
    const statuses = await db.fetchBenefitStatuses();

    // Overlay user-specific statuses onto the base benefits
    const merged = baseBenefits.map(b => ({
      ...b,
      status: (statuses.get(b.id) as Benefit['status']) || b.status,
    }));

    setBenefits(merged);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const updateStatus = async (id: string, status: Benefit['status']) => {
    await db.updateBenefitStatus(id, status);
    await refresh();
  };

  return { benefits, loading, refresh, updateStatus };
}
