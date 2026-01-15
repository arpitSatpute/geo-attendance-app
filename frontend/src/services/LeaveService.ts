import { ApiService } from './ApiService';

export interface LeaveRequest {
  id?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  leaveType: 'SICK' | 'CASUAL' | 'ANNUAL' | 'UNPAID';
  startDate: string;
  endDate: string;
  reason: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedDate?: string;
  approvedById?: string;
  approvalDate?: string;
  createdAt?: string;
  // For backward compatibility with existing UI
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
      console.log('LeaveService.applyLeave - Sending data:', JSON.stringify(leaveData));
      const response = await ApiService.applyLeave(leaveData);
      console.log('LeaveService.applyLeave - Response:', JSON.stringify(response));
      return response;
    } catch (error: any) {
      console.error('Error applying for leave:', error);
      console.error('Error details:', error.response?.data);
      const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to apply for leave';
      throw new Error(message);
    }
  }

  async getMyLeaves(): Promise<LeaveRequest[]> {
    try {
      const response = await ApiService.getMyLeaves();
      return response;
    } catch (error: any) {
      console.error('Error fetching leave history:', error);
      throw new Error(error.message || 'Failed to fetch leave history');
    }
  }

  async getAllLeaves(): Promise<LeaveRequest[]> {
    try {
      const response = await ApiService.getAllLeaves();
      return response;
    } catch (error: any) {
      console.error('Error fetching all leaves:', error);
      throw new Error(error.message || 'Failed to fetch all leaves');
    }
  }

  async getPendingLeaves(): Promise<LeaveRequest[]> {
    try {
      const response = await ApiService.getPendingLeaves();
      return response;
    } catch (error: any) {
      console.error('Error fetching pending leaves:', error);
      throw new Error(error.message || 'Failed to fetch pending leaves');
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
