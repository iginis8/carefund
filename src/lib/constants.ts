import type { ExpenseCategory, CaregiverType, BenefitType, CareType } from '@/types';

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'medical', label: 'Medical & Health', icon: 'Heart' },
  { value: 'transportation', label: 'Transportation', icon: 'Car' },
  { value: 'supplies', label: 'Supplies & Equipment', icon: 'Package' },
  { value: 'home_modification', label: 'Home Modifications', icon: 'Home' },
  { value: 'respite_care', label: 'Respite Care', icon: 'Clock' },
  { value: 'professional_care', label: 'Professional Care', icon: 'UserCheck' },
  { value: 'legal', label: 'Legal & Admin', icon: 'FileText' },
  { value: 'other', label: 'Other', icon: 'MoreHorizontal' },
];

export const CAREGIVER_TYPES: { value: CaregiverType; label: string; description: string }[] = [
  { value: 'parent_care', label: 'Caring for a Parent', description: 'You help an aging parent with daily activities, medical needs, or supervision' },
  { value: 'spouse_care', label: 'Caring for a Spouse/Partner', description: 'Your partner has a chronic illness, disability, or needs ongoing care' },
  { value: 'child_care', label: 'Caring for a Child with Special Needs', description: 'Your child requires extra care beyond typical parenting' },
  { value: 'sandwich', label: 'Sandwich Generation', description: 'You care for both aging parents and your own children' },
  { value: 'other', label: 'Other Caregiving Role', description: 'Caring for a sibling, friend, or other loved one' },
];

export const BENEFIT_TYPES: { value: BenefitType; label: string }[] = [
  { value: 'fmla', label: 'FMLA' },
  { value: 'eap', label: 'Employee Assistance Program' },
  { value: 'state_program', label: 'State Program' },
  { value: 'federal_program', label: 'Federal Program' },
  { value: 'employer', label: 'Employer Benefit' },
  { value: 'nonprofit', label: 'Nonprofit/Charity' },
];

export const CARE_TYPES: { value: CareType; label: string; avg_monthly_cost: number }[] = [
  { value: 'home_care', label: 'Home Health Aide', avg_monthly_cost: 5148 },
  { value: 'adult_day_care', label: 'Adult Day Care', avg_monthly_cost: 1690 },
  { value: 'assisted_living', label: 'Assisted Living Facility', avg_monthly_cost: 4500 },
  { value: 'nursing_home', label: 'Nursing Home (Semi-Private)', avg_monthly_cost: 7908 },
  { value: 'hybrid', label: 'Hybrid / Mixed Care', avg_monthly_cost: 4000 },
];

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

export const CONDITIONS = [
  'Alzheimer\'s / Dementia',
  'Cancer',
  'Chronic Heart Disease',
  'COPD / Respiratory',
  'Diabetes',
  'Stroke Recovery',
  'Parkinson\'s Disease',
  'Mental Health Condition',
  'Physical Disability',
  'Developmental Disability',
  'Multiple Sclerosis',
  'ALS',
  'Arthritis / Joint Issues',
  'Vision / Hearing Loss',
  'Other',
];
