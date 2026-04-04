export type CaregiverType = 'parent_care' | 'spouse_care' | 'child_care' | 'sandwich' | 'other';
export type EmploymentStatus = 'full_time' | 'part_time' | 'self_employed' | 'unemployed' | 'retired';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  caregiver_type: CaregiverType;
  employment_status: EmploymentStatus;
  annual_income: number;
  care_hours_per_week: number;
  care_recipient_relationship: string;
  care_recipient_conditions: string[];
  state: string;
  onboarding_completed: boolean;
  created_at: string;
}

export type ExpenseCategory =
  | 'medical'
  | 'transportation'
  | 'supplies'
  | 'home_modification'
  | 'respite_care'
  | 'professional_care'
  | 'legal'
  | 'other';

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
  receipt_url?: string;
  is_tax_deductible: boolean;
  tax_category?: string;
  is_recurring: boolean;
  recurrence_interval?: 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  created_at: string;
}

export type TaxCreditStatus = 'eligible' | 'claimed' | 'pending' | 'not_eligible';

export interface TaxCredit {
  id: string;
  credit_name: string;
  description: string;
  max_value: number;
  estimated_value: number;
  status: TaxCreditStatus;
  eligibility_criteria: Record<string, unknown>;
  irs_form: string;
  irs_link: string;
}

export type SavingsGoalType = 'emergency' | 'retirement_catchup' | 'care_fund' | 'general';

export interface SavingsGoal {
  id: string;
  user_id: string;
  goal_name: string;
  goal_type: SavingsGoalType;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  auto_save_amount?: number;
  auto_save_frequency?: 'weekly' | 'biweekly' | 'monthly';
  created_at: string;
}

export type BenefitType = 'fmla' | 'eap' | 'state_program' | 'federal_program' | 'employer' | 'nonprofit';
export type BenefitStatus = 'available' | 'applied' | 'active' | 'expired' | 'denied';

export interface Benefit {
  id: string;
  benefit_name: string;
  provider: string;
  type: BenefitType;
  description: string;
  eligibility_criteria: string[];
  application_url?: string;
  status: BenefitStatus;
  deadline?: string;
  state?: string;
}

export type CareType = 'home_care' | 'assisted_living' | 'nursing_home' | 'adult_day_care' | 'hybrid';

export interface CareScenario {
  id: string;
  user_id: string;
  scenario_name: string;
  care_type: CareType;
  monthly_cost: number;
  duration_months: number;
  funding_sources: {
    source: string;
    monthly_amount: number;
  }[];
  created_at: string;
}

export interface DashboardStats {
  total_expenses_this_month: number;
  total_expenses_this_year: number;
  estimated_tax_savings: number;
  savings_goal_progress: number;
  active_benefits: number;
  eligible_credits: number;
}
