'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Customer, CustomerStatus, STATUSES, STATUS_COLORS } from '@/types';

export default function KanbanBoard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<CustomerStatus | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = useCallback(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        setCustomers(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const assignees = useMemo(() => {
    const set = new Set<string>();
    customers.forEach(c => set.add(c.assignee || '미배정'));
    return Array.from(set);
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    let result = customers;
    if (assigneeFilter !== 'all') {
      result = result.filter(c => (c.assignee || '미배정') === assigneeFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        (c.grade && c.grade.toLowerCase().includes(term)) ||
        (c.subject && c.subject.toLowerCase().includes(term))
      );
    }
    return result;
  }, [customers, assigneeFilter, searchTerm]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: CustomerStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatus(status);
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: CustomerStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    if (!draggedId) return;

    const customer = customers.find(c => c.id === draggedId);
    if (!customer || customer.status === newStatus) {
      setDraggedId(null);
      return;
    }

    setCustomers(prev =>
      prev.map(c => (c.id === draggedId ? { ...c, status: newStatus } : c))
    );
    setDraggedId(null);

    await fetch(`/api/customers/${draggedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-apple-accent border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-[1280px] mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-up animate-fade-up-1">
        <div>
          <h1 className="text-title text-apple-text">칸반 보드</h1>
          <p className="text-caption-text text-apple-sub mt-1">드래그앤드롭으로 고객 상태를 변경하세요</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-hint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="이름, 연락처 검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-[36px] pl-9 pr-3 w-48 border border-apple-border rounded-apple-md bg-white text-[13px] text-apple-text placeholder:text-apple-hint focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all"
            />
          </div>
          {/* Assignee Filter */}
          {assignees.length > 0 && (
            <select
              value={assigneeFilter}
              onChange={e => setAssigneeFilter(e.target.value)}
              className="h-[36px] px-3 border border-apple-border rounded-apple-md bg-white text-[13px] text-apple-text focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all"
            >
              <option value="all">전체 담당자</option>
              {assignees.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          )}
          <span className="text-caption-text text-apple-sub">
            {filteredCustomers.length}명
            {filteredCustomers.length !== customers.length && ` / ${customers.length}명`}
          </span>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4 animate-fade-up animate-fade-up-2">
        {STATUSES.map(status => {
          const columnCustomers = filteredCustomers.filter(c => c.status === status);
          const colors = STATUS_COLORS[status];
          const isDragOver = dragOverStatus === status;

          return (
            <div
              key={status}
              className={`flex-shrink-0 w-[240px] rounded-apple-xl bg-apple-hover/60 transition-all ${
                isDragOver ? 'ring-2 ring-apple-accent bg-apple-accent-light/40' : ''
              }`}
              onDragOver={e => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, status)}
            >
              {/* Column Header */}
              <div className="px-4 py-3 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 text-[13px] font-semibold ${colors.text}`}>
                  <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  {status}
                </span>
                <span className="text-[12px] text-apple-hint bg-white px-2 py-0.5 rounded-pill shadow-sm">
                  {columnCustomers.length}
                </span>
              </div>

              {/* Cards */}
              <div className="px-3 pb-3 space-y-2.5 min-h-[200px] max-h-[calc(100vh-220px)] overflow-y-auto">
                {columnCustomers.map(customer => (
                  <div
                    key={customer.id}
                    draggable
                    onDragStart={e => handleDragStart(e, customer.id)}
                    className={`bg-white rounded-apple-lg p-4 shadow-card cursor-grab active:cursor-grabbing card-hover ${
                      draggedId === customer.id ? 'opacity-50 scale-[1.02] shadow-modal' : ''
                    }`}
                  >
                    <Link href={`/customer/${customer.id}`} className="block">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[15px] font-semibold text-apple-text">{customer.name}</span>
                        {customer.assignee && (
                          <span className="text-[11px] text-apple-sub bg-apple-hover px-1.5 py-0.5 rounded-apple-sm">
                            {customer.assignee}
                          </span>
                        )}
                      </div>
                      <div className="text-caption-text text-apple-sub mb-1.5">{customer.phone}</div>
                      {customer.grade && (
                        <div className="text-[12px] text-apple-hint mb-1">
                          {customer.grade}{customer.subject ? ` · ${customer.subject}` : ''}
                        </div>
                      )}
                      {customer.channel && (
                        <div className="text-[12px] text-apple-hint mb-1">유입: {customer.channel}</div>
                      )}

                      {/* Bottom row */}
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-apple-border">
                        {customer.followUpDate ? (
                          <span className={`text-[12px] font-medium ${
                            customer.followUpDate <= todayStr ? 'text-apple-danger' : 'text-apple-sub'
                          }`}>
                            {customer.followUpDate}
                          </span>
                        ) : (
                          <span />
                        )}
                      </div>

                      {customer.nextAction && (
                        <div className="text-[12px] text-apple-accent mt-1.5 truncate">
                          {customer.nextAction}
                        </div>
                      )}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
