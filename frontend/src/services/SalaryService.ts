import { ApiService } from './ApiService';

export interface SalaryData {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  month: string;
  baseSalary: number;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  onTimeDays: number;
  earnedSalary: number;
  deductions: number;
  performanceBonus: number;
  overtimeBonus: number;
  totalBonus: number;
  netSalary: number;
  onTimePercentage: number;
  status: 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID';
  calculatedBy?: string;
  calculatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
}

export interface SalaryCalculationRequest {
  userId: string;
  year: number;
  month: number;
  remarks?: string;
}

export class SalaryService {
  
  static async calculateSalary(request: SalaryCalculationRequest): Promise<SalaryData> {
    const response = await ApiService.post<SalaryData>('/salary/calculate', request);
    return response.data;
  }

  static async getMySalary(year: number, month: number): Promise<SalaryData> {
    const response = await ApiService.get<SalaryData>('/salary/my-salary', {
      params: { year, month }
    });
    return response.data;
  }

  static async getCurrentMonthSalary(): Promise<SalaryData> {
    const response = await ApiService.get<SalaryData>('/salary/my-salary/current');
    return response.data;
  }

  static async getMySalaryHistory(): Promise<SalaryData[]> {
    const response = await ApiService.get<SalaryData[]>('/salary/my-salary/history');
    return response.data;
  }

  static async getTeamSalaries(year: number, month: number): Promise<SalaryData[]> {
    const response = await ApiService.get<SalaryData[]>('/salary/team', {
      params: { year, month }
    });
    return response.data;
  }

  static async approveSalary(salaryId: string): Promise<SalaryData> {
    const response = await ApiService.post<SalaryData>(`/salary/${salaryId}/approve`);
    return response.data;
  }

  static formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  }

  static formatMonth(yearMonth: string): string {
    // Format "2026-01" to "January 2026"
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
}
