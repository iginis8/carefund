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

let expenses: Expense[] = [
  { id: '1', user_id: DEMO_USER_ID, amount: 450, category: 'medical', description: 'Monthly prescription medications', date: '2026-03-28', is_tax_deductible: true, tax_category: 'medical_expense', is_recurring: true, recurrence_interval: 'monthly', created_at: '2026-03-28T00:00:00Z' },
  { id: '2', user_id: DEMO_USER_ID, amount: 180, category: 'transportation', description: 'Gas & tolls for doctor visits', date: '2026-03-25', is_tax_deductible: true, tax_category: 'medical_expense', is_recurring: false, created_at: '2026-03-25T00:00:00Z' },
  { id: '3', user_id: DEMO_USER_ID, amount: 1200, category: 'professional_care', description: 'Part-time home health aide (weekdays)', date: '2026-03-20', is_tax_deductible: true, tax_category: 'dependent_care', is_recurring: true, recurrence_interval: 'monthly', created_at: '2026-03-20T00:00:00Z' },
  { id: '4', user_id: DEMO_USER_ID, amount: 85, category: 'supplies', description: 'Adult incontinence supplies', date: '2026-03-15', is_tax_deductible: true, tax_category: 'medical_expense', is_recurring: true, recurrence_interval: 'monthly', created_at: '2026-03-15T00:00:00Z' },
  { id: '5', user_id: DEMO_USER_ID, amount: 350, category: 'respite_care', description: 'Weekend respite caregiver', date: '2026-03-10', is_tax_deductible: false, is_recurring: false, created_at: '2026-03-10T00:00:00Z' },
  { id: '6', user_id: DEMO_USER_ID, amount: 2400, category: 'home_modification', description: 'Bathroom grab bars & walk-in shower conversion', date: '2026-02-20', is_tax_deductible: true, tax_category: 'medical_expense', is_recurring: false, created_at: '2026-02-20T00:00:00Z' },
  { id: '7', user_id: DEMO_USER_ID, amount: 450, category: 'medical', description: 'Monthly prescription medications', date: '2026-02-28', is_tax_deductible: true, tax_category: 'medical_expense', is_recurring: true, recurrence_interval: 'monthly', created_at: '2026-02-28T00:00:00Z' },
  { id: '8', user_id: DEMO_USER_ID, amount: 1200, category: 'professional_care', description: 'Part-time home health aide (weekdays)', date: '2026-02-20', is_tax_deductible: true, tax_category: 'dependent_care', is_recurring: true, recurrence_interval: 'monthly', created_at: '2026-02-20T00:00:00Z' },
  { id: '9', user_id: DEMO_USER_ID, amount: 120, category: 'transportation', description: 'Gas for specialist appointments', date: '2026-02-12', is_tax_deductible: true, tax_category: 'medical_expense', is_recurring: false, created_at: '2026-02-12T00:00:00Z' },
  { id: '10', user_id: DEMO_USER_ID, amount: 85, category: 'supplies', description: 'Adult incontinence supplies', date: '2026-02-15', is_tax_deductible: true, tax_category: 'medical_expense', is_recurring: true, recurrence_interval: 'monthly', created_at: '2026-02-15T00:00:00Z' },
  { id: '11', user_id: DEMO_USER_ID, amount: 450, category: 'medical', description: 'Monthly prescription medications', date: '2026-01-28', is_tax_deductible: true, tax_category: 'medical_expense', is_recurring: true, recurrence_interval: 'monthly', created_at: '2026-01-28T00:00:00Z' },
  { id: '12', user_id: DEMO_USER_ID, amount: 1200, category: 'professional_care', description: 'Part-time home health aide (weekdays)', date: '2026-01-20', is_tax_deductible: true, tax_category: 'dependent_care', is_recurring: true, recurrence_interval: 'monthly', created_at: '2026-01-20T00:00:00Z' },
  // April 2026 data (use T12:00 to avoid UTC date-shift issues)
  { id: '13', user_id: DEMO_USER_ID, amount: 450, category: 'medical', description: 'Monthly prescription medications', date: '2026-04-01T12:00:00', is_tax_deductible: true, tax_category: 'medical_expense', is_recurring: true, recurrence_interval: 'monthly', created_at: '2026-04-01T12:00:00Z' },
  { id: '14', user_id: DEMO_USER_ID, amount: 1200, category: 'professional_care', description: 'Part-time home health aide (weekdays)', date: '2026-04-01T12:00:00', is_tax_deductible: true, tax_category: 'dependent_care', is_recurring: true, recurrence_interval: 'monthly', created_at: '2026-04-01T12:00:00Z' },
  { id: '15', user_id: DEMO_USER_ID, amount: 85, category: 'supplies', description: 'Adult incontinence supplies', date: '2026-04-02T12:00:00', is_tax_deductible: true, tax_category: 'medical_expense', is_recurring: true, recurrence_interval: 'monthly', created_at: '2026-04-02T12:00:00Z' },
  { id: '16', user_id: DEMO_USER_ID, amount: 210, category: 'transportation', description: 'Uber to neurologist appointment', date: '2026-04-03T12:00:00', is_tax_deductible: true, tax_category: 'medical_expense', is_recurring: false, created_at: '2026-04-03T12:00:00Z' },
  { id: '17', user_id: DEMO_USER_ID, amount: 350, category: 'respite_care', description: 'Weekend respite caregiver', date: '2026-04-02T12:00:00', is_tax_deductible: false, is_recurring: false, created_at: '2026-04-02T12:00:00Z' },
];

let savingsGoals: SavingsGoal[] = [
  { id: '1', user_id: DEMO_USER_ID, goal_name: 'Caregiving Emergency Fund', goal_type: 'emergency', target_amount: 10000, current_amount: 3500, deadline: '2026-12-31', auto_save_amount: 200, auto_save_frequency: 'monthly', created_at: '2024-06-01T00:00:00Z' },
  { id: '2', user_id: DEMO_USER_ID, goal_name: 'Retirement Catch-Up', goal_type: 'retirement_catchup', target_amount: 50000, current_amount: 8200, deadline: '2030-12-31', auto_save_amount: 400, auto_save_frequency: 'monthly', created_at: '2024-01-01T00:00:00Z' },
  { id: '3', user_id: DEMO_USER_ID, goal_name: 'Mom\'s Care Reserve', goal_type: 'care_fund', target_amount: 25000, current_amount: 12000, deadline: '2027-06-30', auto_save_amount: 500, auto_save_frequency: 'monthly', created_at: '2024-03-01T00:00:00Z' },
];

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

const benefits: Benefit[] = [
  { id: '1', benefit_name: 'Family and Medical Leave Act (FMLA)', provider: 'Federal Government', type: 'fmla', description: 'Up to 12 weeks of unpaid, job-protected leave per year for family caregiving. Applies to employers with 50+ employees.', eligibility_criteria: ['Employed at company with 50+ employees', 'Worked 1,250+ hours in past 12 months', 'Employed for at least 12 months'], status: 'available' },
  { id: '2', benefit_name: 'California Paid Family Leave', provider: 'State of California', type: 'state_program', description: 'Up to 8 weeks of partial pay (60-70% of wages) to care for a seriously ill family member.', eligibility_criteria: ['Work in California', 'Pay into State Disability Insurance (SDI)', 'Care recipient has serious health condition'], status: 'available', state: 'CA' },
  { id: '3', benefit_name: 'National Family Caregiver Support Program', provider: 'Administration on Aging', type: 'federal_program', description: 'Provides respite care, counseling, training, and supplemental services for family caregivers of older adults.', eligibility_criteria: ['Care recipient is 60+', 'Caregiver provides informal care'], application_url: 'https://eldercare.acl.gov/', status: 'available' },
  { id: '4', benefit_name: 'Employee Assistance Program (EAP)', provider: 'Employer', type: 'eap', description: 'Free, confidential counseling and referral services for employees dealing with personal issues including caregiving stress.', eligibility_criteria: ['Employer offers EAP benefit'], status: 'active' },
  { id: '5', benefit_name: 'AARP Caregiving Resources', provider: 'AARP', type: 'nonprofit', description: 'Free caregiving guides, legal resources, care provider directories, and community support for family caregivers.', eligibility_criteria: ['No specific requirements'], application_url: 'https://www.aarp.org/caregiving/', status: 'available' },
  { id: '6', benefit_name: 'Medicaid Home & Community-Based Services', provider: 'Federal/State Government', type: 'federal_program', description: 'Waiver programs that may cover home care services, allowing care recipients to remain at home rather than in a facility.', eligibility_criteria: ['Care recipient meets Medicaid income limits', 'State offers HCBS waiver', 'Medical need for institutional-level care'], status: 'available', state: 'CA' },
];

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

  // Benefits
  getBenefits: () => benefits,
  getBenefitsByType: (type: string) => benefits.filter(b => b.type === type),
  updateBenefitStatus: (id: string, status: Benefit['status']) => {
    const b = benefits.find(b => b.id === id);
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
    const eligibleCredits = taxCredits.filter(tc => tc.status === 'eligible');
    const totalSavingsTarget = savingsGoals.reduce((sum, g) => sum + g.target_amount, 0);
    const totalSavingsCurrent = savingsGoals.reduce((sum, g) => sum + g.current_amount, 0);

    return {
      total_expenses_this_month: thisMonth.reduce((sum, e) => sum + e.amount, 0),
      total_expenses_this_year: thisYear.reduce((sum, e) => sum + e.amount, 0),
      estimated_tax_savings: eligibleCredits.reduce((sum, tc) => sum + tc.estimated_value, 0),
      savings_goal_progress: totalSavingsTarget > 0 ? (totalSavingsCurrent / totalSavingsTarget) * 100 : 0,
      active_benefits: benefits.filter(b => b.status === 'active').length,
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
