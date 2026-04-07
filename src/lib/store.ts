// In-memory store with localStorage persistence for demo/development
// Replace with Supabase in production
import type { Profile, Expense, SavingsGoal, Benefit, CareScenario, TaxCredit } from '@/types';

const DEMO_USER_ID = 'demo-user-001';

const DEFAULT_PROFILE: Profile = {
  id: DEMO_USER_ID,
  email: 'demo@carefund.app',
  full_name: 'Sarah Johnson',
  caregiver_type: 'parent_care',
  employment_status: 'full_time',
  annual_income: 72000,
  care_hours_per_week: 25,
  care_recipient_relationship: 'Mother',
  care_recipient_conditions: ["Alzheimer's / Dementia", 'Diabetes'],
  state: 'CA',
  onboarding_completed: true,
  created_at: '2024-01-15T00:00:00Z',
};

function loadProfile(): Profile {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('carefund_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
  }
  return DEFAULT_PROFILE;
}

function saveProfile(p: Profile) {
  if (typeof window !== 'undefined') {
    try { localStorage.setItem('carefund_profile', JSON.stringify(p)); } catch {}
  }
}

let profile: Profile = loadProfile();

// Start empty — users add their own expenses
let expenses: Expense[] = [];

// Start empty — users create their own goals
let savingsGoals: SavingsGoal[] = [];

const taxCredits: TaxCredit[] = [
  {
    id: '1',
    credit_name: 'Child and Dependent Care Credit',
    description: 'Credit for expenses paid for the care of a qualifying dependent to allow you to work or look for work. Up to $3,000 for one dependent or $6,000 for two+.',
    max_value: 6000,
    estimated_value: 3600,
    status: 'eligible',
    eligibility_criteria: { has_dependent: true, is_employed: true },
    irs_form: 'Form 2441',
    irs_link: 'https://www.irs.gov/forms-pubs/about-form-2441',
  },
  {
    id: '2',
    credit_name: 'Medical Expense Deduction',
    description: 'Deduct unreimbursed medical expenses exceeding 7.5% of AGI. Includes costs for diagnosis, cure, treatment, or prevention of disease for dependents.',
    max_value: 15000,
    estimated_value: 4800,
    status: 'eligible',
    eligibility_criteria: { has_medical_expenses: true, expenses_exceed_threshold: true },
    irs_form: 'Schedule A',
    irs_link: 'https://www.irs.gov/taxtopics/tc502',
  },
  {
    id: '3',
    credit_name: 'Dependent Care FSA',
    description: 'Pre-tax dollars to pay for dependent care expenses. Up to $5,000 per year ($2,500 if married filing separately).',
    max_value: 5000,
    estimated_value: 5000,
    status: 'eligible',
    eligibility_criteria: { has_employer_fsa: true },
    irs_form: 'Form W-2 Box 10',
    irs_link: 'https://www.irs.gov/publications/p503',
  },
  {
    id: '3b',
    credit_name: 'Health Coverage Tax Credit (HCTC)',
    description: 'If you left a job to provide care, you may qualify for a credit covering 72.5% of health insurance premiums for yourself.',
    max_value: 4000,
    estimated_value: 0,
    status: 'not_eligible',
    eligibility_criteria: { left_job_for_caregiving: true },
    irs_form: 'Form 8885',
    irs_link: 'https://www.irs.gov/forms-pubs/about-form-8885',
  },
  {
    id: '3c',
    credit_name: 'Credit for Other Dependents',
    description: 'Non-refundable credit of up to $500 for each qualifying dependent who is not eligible for the Child Tax Credit — includes elderly parents you claim as dependents.',
    max_value: 500,
    estimated_value: 500,
    status: 'eligible',
    eligibility_criteria: { claims_dependent: true },
    irs_form: 'Form 1040',
    irs_link: 'https://www.irs.gov/credits-deductions/individuals/child-tax-credit',
  },
  {
    id: '3d',
    credit_name: 'Home Accessibility Tax Deduction',
    description: 'Costs for medically necessary home modifications (ramps, grab bars, widened doorways, stairlifts) are deductible as medical expenses.',
    max_value: 10000,
    estimated_value: 0,
    status: 'eligible',
    eligibility_criteria: { has_home_modifications: true },
    irs_form: 'Schedule A',
    irs_link: 'https://www.irs.gov/publications/p502#en_US_2024_publink1000178885',
  },
  {
    id: '3e',
    credit_name: 'Charitable Mileage Deduction for Caregiving',
    description: 'Miles driven for medical/caregiving purposes are deductible at $0.67/mile (2024 rate). Includes trips to doctors, pharmacies, and care facilities.',
    max_value: 5000,
    estimated_value: 0,
    status: 'eligible',
    eligibility_criteria: { drives_for_care: true },
    irs_form: 'Schedule A',
    irs_link: 'https://www.irs.gov/tax-professionals/standard-mileage-rates',
  },
  // State-specific credits — only shown to users in that state
  {
    id: '4',
    credit_name: 'State Caregiver Tax Credit (CA)',
    description: 'California provides additional tax credits for family caregivers who support aging or disabled relatives in their home.',
    max_value: 2500,
    estimated_value: 2500,
    status: 'eligible',
    eligibility_criteria: { lives_with_dependent: true },
    irs_form: 'CA Form 540',
    irs_link: 'https://www.ftb.ca.gov/',
    state: 'CA',
  },
  {
    id: '5a',
    credit_name: 'Paid Family Leave (NY)',
    description: 'New York provides up to 12 weeks of paid family leave at 67% of average weekly wage for caregiving.',
    max_value: 4500,
    estimated_value: 4500,
    status: 'eligible',
    eligibility_criteria: { is_employed: true },
    irs_form: 'NY PFL-1',
    irs_link: 'https://paidfamilyleave.ny.gov/',
    state: 'NY',
  },
  {
    id: '5b',
    credit_name: 'Paid Family & Medical Leave (WA)',
    description: 'Washington provides up to 12 weeks of paid leave at up to 90% of wages for family caregiving.',
    max_value: 5000,
    estimated_value: 5000,
    status: 'eligible',
    eligibility_criteria: { is_employed: true },
    irs_form: 'WA PFML',
    irs_link: 'https://paidleave.wa.gov/',
    state: 'WA',
  },
  {
    id: '5c',
    credit_name: 'Family Leave Insurance (NJ)',
    description: 'New Jersey provides up to 12 weeks of paid leave at 85% of average weekly wage for caregiving.',
    max_value: 4200,
    estimated_value: 4200,
    status: 'eligible',
    eligibility_criteria: { is_employed: true },
    irs_form: 'NJ FLI',
    irs_link: 'https://myleavebenefits.nj.gov/',
    state: 'NJ',
  },
  {
    id: '5d',
    credit_name: 'Paid Family & Medical Leave (MA)',
    description: 'Massachusetts provides up to 12 weeks of paid family leave for caregiving at up to 80% of wages.',
    max_value: 4800,
    estimated_value: 4800,
    status: 'eligible',
    eligibility_criteria: { is_employed: true },
    irs_form: 'MA PFML',
    irs_link: 'https://www.mass.gov/pfml',
    state: 'MA',
  },
  {
    id: '5e',
    credit_name: 'Paid Family Leave (CT)',
    description: 'Connecticut provides up to 12 weeks of paid leave at 95% of minimum wage up to 60x for caregiving.',
    max_value: 4000,
    estimated_value: 4000,
    status: 'eligible',
    eligibility_criteria: { is_employed: true },
    irs_form: 'CT PFMLA',
    irs_link: 'https://ctpaidleave.org/',
    state: 'CT',
  },
  {
    id: '5f',
    credit_name: 'Paid Family Leave (OR)',
    description: 'Oregon provides up to 12 weeks of paid family leave for caregiving at up to 100% of average weekly wage.',
    max_value: 4600,
    estimated_value: 4600,
    status: 'eligible',
    eligibility_criteria: { is_employed: true },
    irs_form: 'OR PFMLI',
    irs_link: 'https://paidleave.oregon.gov/',
    state: 'OR',
  },
  {
    id: '5g',
    credit_name: 'Paid Family Leave (CO)',
    description: 'Colorado provides up to 12 weeks of paid family and medical leave for caregiving.',
    max_value: 4400,
    estimated_value: 4400,
    status: 'eligible',
    eligibility_criteria: { is_employed: true },
    irs_form: 'CO FAMLI',
    irs_link: 'https://famli.colorado.gov/',
    state: 'CO',
  },
  // Federal — all states
  {
    id: '6',
    credit_name: 'Earned Income Tax Credit',
    description: 'Refundable credit for low-to-moderate income workers. Amount depends on income, filing status, and number of qualifying children.',
    max_value: 7430,
    estimated_value: 0,
    status: 'not_eligible',
    eligibility_criteria: { income_below_threshold: true },
    irs_form: 'Schedule EIC',
    irs_link: 'https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit-eitc',
  },
];

// Benefits loaded from comprehensive state database
import { getBenefitsForState } from './benefits-data';

let nextId = 20;
function generateId() {
  return String(++nextId);
}

// Premium state
export type PremiumPlan = 'free' | 'monthly' | 'annual';
export interface PremiumState {
  plan: PremiumPlan;
  activated_at: string | null;
}

function loadPremium(): PremiumState {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('carefund_premium');
      if (saved) return JSON.parse(saved);
    } catch {}
  }
  return { plan: 'free', activated_at: null };
}

function savePremium(state: PremiumState) {
  if (typeof window !== 'undefined') {
    try { localStorage.setItem('carefund_premium', JSON.stringify(state)); } catch {}
  }
}

// Store API
export const store = {
  // Profile
  getProfile: () => { profile = loadProfile(); return profile; },
  updateProfile: (updates: Partial<Profile>) => {
    profile = { ...profile, ...updates };
    saveProfile(profile);
    return profile;
  },

  // Expenses
  getExpenses: () => [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  getExpensesByMonth: (year: number, month: number) => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  addExpense: (expense: Omit<Expense, 'id' | 'user_id' | 'created_at'>) => {
    const newExpense: Expense = { ...expense, id: generateId(), user_id: DEMO_USER_ID, created_at: new Date().toISOString() };
    expenses.push(newExpense);
    return newExpense;
  },
  updateExpense: (id: string, updates: Partial<Expense>) => {
    const idx = expenses.findIndex(e => e.id === id);
    if (idx >= 0) {
      expenses[idx] = { ...expenses[idx], ...updates };
      return expenses[idx];
    }
    return null;
  },
  deleteExpense: (id: string) => {
    expenses = expenses.filter(e => e.id !== id);
  },

  // Tax Credits
  getTaxCredits: () => {
    const userState = profile.state;
    return taxCredits.filter(tc => !tc.state || tc.state === userState);
  },
  getEligibleCredits: () => {
    const userState = profile.state;
    return taxCredits.filter(tc => tc.status === 'eligible' && (!tc.state || tc.state === userState));
  },

  // Savings Goals
  getSavingsGoals: () => savingsGoals,
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'user_id' | 'created_at'>) => {
    const newGoal: SavingsGoal = { ...goal, id: generateId(), user_id: DEMO_USER_ID, created_at: new Date().toISOString() };
    savingsGoals.push(newGoal);
    return newGoal;
  },
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => {
    const idx = savingsGoals.findIndex(g => g.id === id);
    if (idx >= 0) {
      savingsGoals[idx] = { ...savingsGoals[idx], ...updates };
      return savingsGoals[idx];
    }
    return null;
  },
  deleteSavingsGoal: (id: string) => {
    savingsGoals = savingsGoals.filter(g => g.id !== id);
  },

  // Benefits — loaded from comprehensive 50-state database, filtered by user's state
  getBenefits: () => getBenefitsForState(profile.state),
  getBenefitsByType: (type: string) => getBenefitsForState(profile.state).filter(b => b.type === type),
  updateBenefitStatus: (id: string, status: Benefit['status']) => {
    // Status changes are local only for now
    const allBenefits = getBenefitsForState(profile.state);
    const b = allBenefits.find(b => b.id === id);
    if (b) b.status = status;
    return b;
  },

  // Dashboard Stats
  getDashboardStats: (): { total_expenses_this_month: number; total_expenses_this_year: number; estimated_tax_savings: number; savings_goal_progress: number; active_benefits: number; eligible_credits: number } => {
    const now = new Date();
    const thisMonth = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const thisYear = expenses.filter(e => new Date(e.date).getFullYear() === now.getFullYear());
    const userState = profile.state;
    const eligibleCredits = taxCredits.filter(tc => tc.status === 'eligible' && (!tc.state || tc.state === userState));
    const totalSavingsTarget = savingsGoals.reduce((sum, g) => sum + g.target_amount, 0);
    const totalSavingsCurrent = savingsGoals.reduce((sum, g) => sum + g.current_amount, 0);

    return {
      total_expenses_this_month: thisMonth.reduce((sum, e) => sum + e.amount, 0),
      total_expenses_this_year: thisYear.reduce((sum, e) => sum + e.amount, 0),
      estimated_tax_savings: eligibleCredits.reduce((sum, tc) => sum + tc.estimated_value, 0),
      savings_goal_progress: totalSavingsTarget > 0 ? (totalSavingsCurrent / totalSavingsTarget) * 100 : 0,
      active_benefits: getBenefitsForState(profile.state).filter(b => b.status === 'active').length,
      eligible_credits: eligibleCredits.length,
    };
  },

  // Premium
  getPremium: (): PremiumState => loadPremium(),
  isPremium: (): boolean => loadPremium().plan !== 'free',
  upgradePremium: (plan: 'monthly' | 'annual'): PremiumState => {
    const state: PremiumState = { plan, activated_at: new Date().toISOString() };
    savePremium(state);
    return state;
  },
  cancelPremium: (): PremiumState => {
    const state: PremiumState = { plan: 'free', activated_at: null };
    savePremium(state);
    return state;
  },
};
