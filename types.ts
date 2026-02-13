
export type Role = 'admin' | 'lead' | 'viewer';

export interface Profile {
  id: string;
  email: string;
  role: Role;
  area_id: string | null;
}

export interface Area {
  id: string;
  name: string;
}

export interface Objective {
  id?: string;
  area_id: string;
  year: number;
  name: string;
  annual_weight: number;
}

export interface MonthlyPlan {
  objective_id: string;
  month: number;
  planned_value: number;
}

export interface MonthlyExec {
  objective_id: string;
  month: number;
  executed_value: number;
}

export interface SummaryObjective {
  id: string;
  name: string;
  annual_weight: number;
  plan: number[]; // 12 elements
  exec: number[]; // 12 elements
  compliance: number;
  status: 'red' | 'yellow' | 'green';
}

export interface SRVSummary {
  objectives: SummaryObjective[];
}
