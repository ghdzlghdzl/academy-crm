export type CustomerStatus = '미컨택' | '1차통화완료' | '상담예약' | '상담완료' | '등록' | '보류';

export const STATUSES: CustomerStatus[] = ['미컨택', '1차통화완료', '상담예약', '상담완료', '등록', '보류'];

export const STATUS_COLORS: Record<CustomerStatus, { bg: string; text: string; dot: string }> = {
  '미컨택': { bg: 'bg-status-new-bg', text: 'text-status-new', dot: 'bg-status-new' },
  '1차통화완료': { bg: 'bg-status-called-bg', text: 'text-status-called', dot: 'bg-status-called' },
  '상담예약': { bg: 'bg-status-booked-bg', text: 'text-status-booked', dot: 'bg-status-booked' },
  '상담완료': { bg: 'bg-status-done-bg', text: 'text-status-done', dot: 'bg-status-done' },
  '등록': { bg: 'bg-status-registered-bg', text: 'text-status-registered', dot: 'bg-status-registered' },
  '보류': { bg: 'bg-status-hold-bg', text: 'text-status-hold', dot: 'bg-status-hold' },
};

export interface Customer {
  id: string;
  name: string;
  phone: string;
  channel: string;
  createdAt: string;
  assignee: string;
  status: CustomerStatus;
  grade: string | null;
  subject: string | null;
  preferredTime: string | null;
  needs: string | null;
  currentSituation: string | null;
  followUpDate: string | null;
  consultationBooked: boolean;
  consultationDate: string | null;
  nextAction: string | null;
  notes: string | null;
}

export interface Contact {
  id: string;
  customerId: string;
  date: string;
  type: 'call' | 'visit' | 'message';
  transcript: string | null;
  memo: string;
  aiGenerated: boolean;
}

export interface AnalysisResult {
  customerName: string | null;
  needs: string | null;
  grade: string | null;
  subject: string | null;
  preferredTime: string | null;
  currentSituation: string | null;
  consultationBooked: boolean;
  consultationDate: string | null;
  followUpDate: string;
  nextAction: string | null;
  notes: string | null;
  status: CustomerStatus;
}
