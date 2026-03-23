'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Customer, STATUS_COLORS, CustomerStatus } from '@/types';

interface ConversionRate {
  contacted: number;
  booked: number;
  registered: number;
  contactToBookRate: number;
  bookToRegisterRate: number;
  overallRate: number;
}

interface DashboardData {
  todayFollowUp: Customer[];
  upcomingFollowUp: Customer[];
  overdueFollowUp: Customer[];
  statusCounts: Record<string, number>;
  channelCounts: Record<string, number>;
  assigneeCounts: Record<string, number>;
  conversionRate: ConversionRate;
  totalCustomers: number;
}

function StatusBadge({ status }: { status: CustomerStatus }) {
  const colors = STATUS_COLORS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-pill text-[12px] font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {status}
    </span>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((err) => setError(err instanceof Error ? err.message : '대시보드 데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-apple-accent border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1280px] mx-auto px-8 py-12">
        <div className="bg-red-50 text-apple-danger p-5 rounded-apple-lg text-[15px]">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const assignees = Object.keys(data.assigneeCounts);
  const filterByAssignee = (list: Customer[]) =>
    assigneeFilter === 'all' ? list : list.filter(c => (c.assignee || '미배정') === assigneeFilter);

  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const totalFollowUp = data.todayFollowUp.length + data.overdueFollowUp.length;
  const bookedCount = data.statusCounts['상담예약'] || 0;
  const newCount = data.statusCounts['미컨택'] || 0;

  return (
    <div>
      {/* Hero Section — Dark */}
      <div className="bg-apple-dark animate-fade-up animate-fade-up-1">
        <div className="max-w-[1280px] mx-auto px-8 py-16 pb-20">
          <div className="text-label-text uppercase tracking-widest text-apple-sub mb-3">
            {dayNames[today.getDay()]}요일 · {dateStr}
          </div>
          <h1 className="text-hero text-white tracking-tight leading-tight">
            오늘의 영업 현황
          </h1>
          <p className="text-headline text-white/60 mt-2">
            {totalFollowUp > 0 ? `팔로업 ${totalFollowUp}건` : '팔로업 없음'}
            {bookedCount > 0 && ` · 상담예약 ${bookedCount}건`}
            {newCount > 0 && ` · 신규 ${newCount}건`}
          </p>

          {/* Hero Metric Cards */}
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { label: '총 고객', value: data.totalCustomers },
              { label: '오늘 팔로업', value: totalFollowUp },
              { label: '전체 전환율', value: `${data.conversionRate.overallRate}%` },
            ].map((m, i) => (
              <div
                key={m.label}
                className={`rounded-apple-xl p-6 border border-white/[0.12] bg-white/[0.08] hover:bg-white/[0.12] hover:scale-[1.02] transition-all cursor-default animate-fade-up animate-fade-up-${i + 2}`}
              >
                <div className="text-[48px] font-bold text-white leading-none animate-count-up">
                  {m.value}
                </div>
                <div className="text-label-text uppercase tracking-widest text-white/50 mt-2">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1280px] mx-auto px-8 -mt-6 pb-16 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 animate-fade-up animate-fade-up-3">
          <Link
            href="/upload"
            className="bg-white rounded-apple-xl shadow-card p-6 flex items-center gap-5 card-hover group"
          >
            <div className="w-12 h-12 rounded-xl bg-apple-accent-light flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-apple-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-apple-text group-hover:text-apple-accent transition-colors">녹취 업로드</h3>
              <p className="text-[13px] text-apple-sub mt-0.5">통화 녹취를 업로드하고 AI 분석을 실행합니다</p>
            </div>
          </Link>
          <Link
            href="/consultation"
            className="bg-white rounded-apple-xl shadow-card p-6 flex items-center gap-5 card-hover group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-apple-text group-hover:text-indigo-500 transition-colors">상담 자료 생성</h3>
              <p className="text-[13px] text-apple-sub mt-0.5">AI가 맞춤형 상담 자료를 PDF로 생성합니다</p>
            </div>
          </Link>
        </div>

        {/* Assignee Filter */}
        {assignees.length > 0 && (
          <div className="flex justify-end animate-fade-up animate-fade-up-3">
            <div className="flex items-center gap-2">
              <span className="text-caption-text text-apple-sub">담당자</span>
              <select
                value={assigneeFilter}
                onChange={e => setAssigneeFilter(e.target.value)}
                className="h-[36px] px-3 rounded-apple-md border border-apple-border bg-white text-[13px] text-apple-text focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all"
              >
                <option value="all">전체</option>
                {assignees.map(a => (
                  <option key={a} value={a}>{a} ({data.assigneeCounts[a]})</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Status Summary */}
        <div className="grid grid-cols-6 gap-3 animate-fade-up animate-fade-up-3">
          {Object.entries(data.statusCounts).map(([status, count]) => {
            const colors = STATUS_COLORS[status as CustomerStatus];
            return (
              <div key={status} className="bg-white rounded-apple-xl p-5 shadow-card card-hover cursor-default">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`w-2 h-2 rounded-full ${colors?.dot || 'bg-apple-hint'}`} />
                  <span className="text-caption-text text-apple-sub">{status}</span>
                </div>
                <div className="text-title font-semibold text-apple-text">{count}</div>
              </div>
            );
          })}
        </div>

        {/* Overdue Follow-ups */}
        {data.overdueFollowUp.length > 0 && (
          <div className="bg-white rounded-apple-xl shadow-card overflow-hidden animate-fade-up animate-fade-up-4">
            <div className="px-8 py-5 border-b border-apple-border flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-apple-danger animate-pulse" />
              <h2 className="text-headline text-apple-text">팔로업 지연</h2>
              <span className="h-[22px] px-2.5 rounded-pill bg-red-50 text-apple-danger text-[12px] font-medium flex items-center">
                {filterByAssignee(data.overdueFollowUp).length}명
              </span>
            </div>
            <div>
              {filterByAssignee(data.overdueFollowUp).map(customer => (
                <CustomerRow key={customer.id} customer={customer} isOverdue />
              ))}
            </div>
          </div>
        )}

        {/* Today Follow-ups */}
        <div className="bg-white rounded-apple-xl shadow-card overflow-hidden animate-fade-up animate-fade-up-4">
          <div className="px-8 py-5 border-b border-apple-border flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-apple-accent" />
            <h2 className="text-headline text-apple-text">오늘 연락해야 할 고객</h2>
            <span className="h-[22px] px-2.5 rounded-pill bg-apple-accent-light text-apple-accent text-[12px] font-medium flex items-center">
              {filterByAssignee(data.todayFollowUp).length}명
            </span>
          </div>
          <div>
            {filterByAssignee(data.todayFollowUp).length === 0 ? (
              <div className="px-8 py-12 text-center text-apple-hint text-[15px]">오늘 팔로업할 고객이 없습니다.</div>
            ) : (
              filterByAssignee(data.todayFollowUp).map(customer => (
                <CustomerRow key={customer.id} customer={customer} />
              ))
            )}
          </div>
        </div>

        {/* Upcoming Follow-ups */}
        <div className="bg-white rounded-apple-xl shadow-card overflow-hidden animate-fade-up animate-fade-up-5">
          <div className="px-8 py-5 border-b border-apple-border flex items-center gap-3">
            <h2 className="text-headline text-apple-text">3일 이내 팔로업 예정</h2>
            <span className="h-[22px] px-2.5 rounded-pill bg-status-new-bg text-status-new text-[12px] font-medium flex items-center">
              {filterByAssignee(data.upcomingFollowUp).length}명
            </span>
          </div>
          <div>
            {filterByAssignee(data.upcomingFollowUp).length === 0 ? (
              <div className="px-8 py-12 text-center text-apple-hint text-[15px]">3일 이내 팔로업 예정 고객이 없습니다.</div>
            ) : (
              filterByAssignee(data.upcomingFollowUp).map(customer => (
                <CustomerRow key={customer.id} customer={customer} showDate />
              ))
            )}
          </div>
        </div>

        {/* Statistics Row */}
        <div className="grid grid-cols-3 gap-6 animate-fade-up animate-fade-up-5">
          {/* Conversion Rate */}
          <div className="bg-white rounded-apple-xl shadow-card p-7">
            <h2 className="text-headline text-apple-text mb-5">상담 전환율</h2>
            <div className="space-y-5">
              <RateBar
                label="컨택 → 상담예약"
                rate={data.conversionRate.contactToBookRate}
                detail={`${data.conversionRate.contacted}명 중 ${data.conversionRate.booked}명`}
                color="bg-apple-accent"
              />
              <RateBar
                label="상담예약 → 등록"
                rate={data.conversionRate.bookToRegisterRate}
                detail={`${data.conversionRate.booked}명 중 ${data.conversionRate.registered}명`}
                color="bg-status-booked"
              />
              <div className="pt-4 border-t border-apple-border">
                <RateBar
                  label="전체 전환율"
                  rate={data.conversionRate.overallRate}
                  color="bg-status-registered"
                  bold
                />
              </div>
            </div>
          </div>

          {/* Channel Stats */}
          <div className="bg-white rounded-apple-xl shadow-card p-7">
            <h2 className="text-headline text-apple-text mb-5">유입 채널별 현황</h2>
            {Object.keys(data.channelCounts).length === 0 ? (
              <div className="text-center text-apple-hint py-8 text-[15px]">데이터가 없습니다.</div>
            ) : (
              <div className="space-y-3">
                {Object.entries(data.channelCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([channel, count]) => (
                    <div key={channel} className="flex items-center justify-between py-1">
                      <span className="text-[14px] text-apple-sub">{channel}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1.5 bg-apple-hover rounded-full overflow-hidden">
                          <div
                            className="h-full bg-apple-accent rounded-full transition-all"
                            style={{ width: `${data.totalCustomers ? (count / data.totalCustomers) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-[14px] font-semibold text-apple-text w-6 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Assignee Stats */}
          <div className="bg-white rounded-apple-xl shadow-card p-7">
            <h2 className="text-headline text-apple-text mb-5">담당자별 현황</h2>
            {Object.keys(data.assigneeCounts).length === 0 ? (
              <div className="text-center text-apple-hint py-8 text-[15px]">데이터가 없습니다.</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(data.assigneeCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([assignee, count]) => (
                    <button
                      key={assignee}
                      onClick={() => setAssigneeFilter(assigneeFilter === assignee ? 'all' : assignee)}
                      className={`w-full flex items-center justify-between p-3 rounded-apple-md transition-all ${
                        assigneeFilter === assignee
                          ? 'bg-apple-accent-light ring-1 ring-apple-accent/20'
                          : 'hover:bg-apple-hover'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-apple-hover flex items-center justify-center">
                          <span className="text-apple-sub font-medium text-[12px]">{assignee.charAt(0)}</span>
                        </div>
                        <span className="text-[14px] text-apple-text">{assignee}</span>
                      </div>
                      <span className="text-[14px] font-semibold text-apple-text">{count}명</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="text-center text-[12px] text-apple-hint space-x-6 pt-4 no-print">
          <span><kbd className="px-1.5 py-0.5 bg-apple-hover rounded text-apple-sub text-[11px]">U</kbd> 업로드</span>
          <span><kbd className="px-1.5 py-0.5 bg-apple-hover rounded text-apple-sub text-[11px]">B</kbd> 칸반 보드</span>
          <span><kbd className="px-1.5 py-0.5 bg-apple-hover rounded text-apple-sub text-[11px]">D</kbd> 대시보드</span>
        </div>
      </div>
    </div>
  );
}

function CustomerRow({ customer, isOverdue, showDate }: { customer: Customer; isOverdue?: boolean; showDate?: boolean }) {
  return (
    <Link
      href={`/customer/${customer.id}`}
      className="flex items-center justify-between px-8 py-4 border-b border-apple-border last:border-b-0 hover:bg-apple-hover transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-medium ${
          isOverdue ? 'bg-red-50 text-apple-danger' : 'bg-apple-accent-light text-apple-accent'
        }`}>
          {customer.name.charAt(0)}
        </div>
        <div>
          <div className="text-[15px] font-medium text-apple-text">{customer.name}</div>
          <div className="text-caption-text text-apple-sub">{customer.phone}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {customer.assignee && (
          <span className="text-[12px] text-apple-sub bg-apple-hover px-2 py-0.5 rounded-pill">{customer.assignee}</span>
        )}
        {(isOverdue || showDate) && customer.followUpDate && (
          <span className={`text-caption-text font-medium ${isOverdue ? 'text-apple-danger' : 'text-apple-sub'}`}>
            {customer.followUpDate}
            {isOverdue && ' (지연)'}
          </span>
        )}
        <StatusBadge status={customer.status} />
        {customer.nextAction && (
          <span className="text-caption-text text-apple-sub max-w-[180px] truncate hidden lg:inline">
            {customer.nextAction}
          </span>
        )}
        <svg className="w-4 h-4 text-apple-hint group-hover:text-apple-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

function RateBar({ label, rate, detail, color, bold }: { label: string; rate: number; detail?: string; color: string; bold?: boolean }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className={`text-[14px] ${bold ? 'font-medium text-apple-text' : 'text-apple-sub'}`}>{label}</span>
        <span className={`text-[14px] ${bold ? 'font-bold text-apple-accent' : 'font-medium text-apple-accent'}`}>{rate}%</span>
      </div>
      <div className={`w-full bg-apple-hover rounded-full ${bold ? 'h-2' : 'h-1.5'}`}>
        <div className={`${color} h-full rounded-full transition-all duration-1000`} style={{ width: `${rate}%` }} />
      </div>
      {detail && <div className="text-[12px] text-apple-hint mt-1">{detail}</div>}
    </div>
  );
}
