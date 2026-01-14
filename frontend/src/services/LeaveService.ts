import { ApiService } from './ApiService';

export interface LeaveRequest {
  id?: string;
  userId?: string;
  leaveType: 'SICK' | 'CASUAL' | 'ANNUAL' | 'UNPAID';
  startDate: string;
  endDate: string;
  reason: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedDate?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

class LeaveServiceClass {
  async applyLeave(leaveData: Omit<LeaveRequest, 'id' | 'status' | 'appliedDate' | 'userId'>): Promise<LeaveRequest> {
    try {
      const response = await ApiService.applyLeave(leaveData);
      return response;
    } catch (error: any) {
      console.error('Error applying for leave:', error);
      throw new Error(error.message || 'Failed to apply for leave');
    }
  }

  async getMyLeaves(): Promise<LeaveRequest[]> {
    try {
      const response = await ApiService.getLeaveHistory();
      return response;
    } catch (error: any) {
      console.error('Error fetching leave history:', error);
      throw new Error(error.message || 'Failed to fetch leave history');
    }
  }

  async getAllLeaves(): Promise<LeaveRequest[]> {
    try {
      const response = await ApiService.get('/leaves');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching all leaves:', error);
      throw new Error(error.message || 'Failed to fetch all leaves');
    }
  }

  async approveLeave(leaveId: string): Promise<LeaveRequest> {
    try {
      const response = await ApiService.approveLeave(leaveId);
      return response;
    } catch (error: any) {
      console.error('Error approving leave:', error);
      throw new Error(error.message || 'Failed to approve leave');
    }
  }

  async rejectLeave(leaveId: string): Promise<LeaveRequest> {
    try {
      const response = await ApiService.rejectLeave(leaveId);
      return response;
    } catch (error: any) {
      console.error('Error rejecting leave:', error);
      throw new Error(error.message || 'Failed to reject leave');
    }
  }

  getLeaveTypeColor(type: string): string {
    switch (type) {
      case 'SICK':
        return '#f44336';
      case 'CASUAL':
        return '#2196F3';
      case 'ANNUAL':
        return '#4CAF50';
      case 'UNPAID':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'APPROVED':
        return '#4CAF50';
      case 'REJECTED':
        return '#f44336';
      case 'PENDING':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end date
  }
}

export const LeaveService = new LeaveServiceClass();
