'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Customer, Contact, STATUS_COLORS, STATUSES, CustomerStatus } from '@/types';

function StatusBadge({ status }: { status: CustomerStatus }) {
  const colors = STATUS_COLORS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-pill text-[12px] font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {status}
    </span>
  );
}

export default function CustomerDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Customer>>({});
  const [newMemo, setNewMemo] = useState('');
  const [briefing, setBriefing] = useState('');
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editContactMemo, setEditContactMemo] = useState('');

  const refreshData = async () => {
    const data = await fetch(`/api/customers/${id}`).then(r => r.json());
    setCustomer(data.customer);
    setContacts(data.contacts || []);
  };

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('고객을 찾을 수 없습니다.');
        return res.json();
      })
      .then(data => {
        setCustomer(data.customer);
        setContacts(data.contacts || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    const res = await fetch(`/api/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData),
    });
    if (res.ok) {
      const updated = await res.json();
      setCustomer(updated);
      setEditing(false);
      setEditData({});
    }
  };

  const handleAddMemo = async () => {
    if (!newMemo.trim()) return;
    const res = await fetch(`/api/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newContact: { type: 'call', memo: newMemo, aiGenerated: false, date: new Date().toISOString() },
      }),
    });
    if (res.ok) {
      setNewMemo('');
      await refreshData();
    }
  };

  const handleEditContact = async (contactId: string) => {
    if (!editContactMemo.trim()) return;
    const res = await fetch(`/api/contacts/${contactId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memo: editContactMemo }),
    });
    if (res.ok) {
      setEditingContactId(null);
      setEditContactMemo('');
      await refreshData();
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('이 메모를 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/contacts/${contactId}`, { method: 'DELETE' });
    if (res.ok) await refreshData();
  };

  const handleBriefing = async () => {
    setBriefingLoading(true);
    try {
      const res = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: id }),
      });
      const data = await res.json();
      if (data.briefing) {
        setBriefing(data.briefing);
        setShowBriefing(true);
      } else {
        alert(data.error || '브리핑 생성 실패');
      }
    } catch {
      alert('브리핑 생성 중 오류 발생');
    } finally {
      setBriefingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-apple-accent border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="max-w-[1280px] mx-auto px-8 py-12">
        <div className="bg-red-50 text-apple-danger p-5 rounded-apple-lg text-[15px]">
          {error || '고객 정보를 불러올 수 없습니다.'}
          <button onClick={() => router.back()} className="ml-4 underline">돌아가기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-up animate-fade-up-1">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-apple-sm flex items-center justify-center text-apple-hint hover:text-apple-text hover:bg-apple-hover transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-title text-apple-text">{customer.name}</h1>
            <div className="mt-1"><StatusBadge status={customer.status} /></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBriefing}
            disabled={briefingLoading}
            className="btn-press h-[40px] px-5 bg-transparent border-[1.5px] border-apple-border text-apple-text text-[14px] font-medium rounded-pill hover:bg-apple-hover disabled:opacity-40 transition-all"
          >
            {briefingLoading ? '생성 중...' : '브리핑 시트'}
          </button>
          <button
            onClick={() => {
              if (editing) { handleSave(); } else { setEditing(true); setEditData({ ...customer }); }
            }}
            className="btn-press h-[40px] px-5 bg-apple-accent text-white text-[14px] font-medium rounded-pill hover:bg-apple-accent-hover transition-all"
          >
            {editing ? '저장' : '정보 수정'}
          </button>
          {editing && (
            <button
              onClick={() => { setEditing(false); setEditData({}); }}
              className="btn-press h-[40px] px-5 bg-transparent border-[1.5px] border-apple-border text-apple-sub text-[14px] font-medium rounded-pill hover:bg-apple-hover transition-all"
            >
              취소
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[360px_1fr] gap-6">
        {/* Left — Customer Info */}
        <div className="space-y-6 animate-fade-up animate-fade-up-2">
          <div className="bg-white rounded-apple-xl shadow-card p-7">
            <h2 className="text-headline text-apple-text mb-5">기본 정보</h2>
            <div className="space-y-3">
              {editing ? (
                <>
                  <EditField label="이름" value={editData.name || ''} onChange={v => setEditData(p => ({ ...p, name: v }))} />
                  <EditField label="연락처" value={editData.phone || ''} onChange={v => setEditData(p => ({ ...p, phone: v }))} />
                  <EditField label="유입 채널" value={editData.channel || ''} onChange={v => setEditData(p => ({ ...p, channel: v }))} />
                  <EditField label="담당자" value={editData.assignee || ''} onChange={v => setEditData(p => ({ ...p, assignee: v }))} />
                  <div>
                    <label className="text-label-text text-apple-accent uppercase tracking-wider">상태</label>
                    <select className="w-full mt-1.5 h-[44px] px-3 border border-apple-border rounded-apple-md text-[14px] focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light"
                      value={editData.status || customer.status}
                      onChange={e => setEditData(p => ({ ...p, status: e.target.value as CustomerStatus }))}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <EditField label="학년" value={editData.grade || ''} onChange={v => setEditData(p => ({ ...p, grade: v }))} />
                  <EditField label="과목" value={editData.subject || ''} onChange={v => setEditData(p => ({ ...p, subject: v }))} />
                  <EditField label="희망 시간대" value={editData.preferredTime || ''} onChange={v => setEditData(p => ({ ...p, preferredTime: v }))} />
                  <EditField label="팔로업 날짜" value={editData.followUpDate || ''} onChange={v => setEditData(p => ({ ...p, followUpDate: v }))} type="date" />
                  <div>
                    <label className="text-label-text text-apple-accent uppercase tracking-wider">고객 니즈</label>
                    <textarea className="w-full mt-1.5 px-3 py-2.5 border border-apple-border rounded-apple-md text-[14px] resize-none focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light" value={editData.needs || ''} onChange={e => setEditData(p => ({ ...p, needs: e.target.value }))} rows={2} />
                  </div>
                  <div>
                    <label className="text-label-text text-apple-accent uppercase tracking-wider">현재 상황</label>
                    <textarea className="w-full mt-1.5 px-3 py-2.5 border border-apple-border rounded-apple-md text-[14px] resize-none focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light" value={editData.currentSituation || ''} onChange={e => setEditData(p => ({ ...p, currentSituation: e.target.value }))} rows={2} />
                  </div>
                  <EditField label="다음 액션" value={editData.nextAction || ''} onChange={v => setEditData(p => ({ ...p, nextAction: v }))} />
                  <div>
                    <label className="text-label-text text-apple-accent uppercase tracking-wider">특이사항</label>
                    <textarea className="w-full mt-1.5 px-3 py-2.5 border border-apple-border rounded-apple-md text-[14px] resize-none focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light" value={editData.notes || ''} onChange={e => setEditData(p => ({ ...p, notes: e.target.value }))} rows={2} />
                  </div>
                </>
              ) : (
                <>
                  <InfoRow label="연락처" value={customer.phone} />
                  <InfoRow label="유입 채널" value={customer.channel} />
                  <InfoRow label="유입일" value={customer.createdAt?.split('T')[0]} />
                  <InfoRow label="담당자" value={customer.assignee} />
                  <InfoRow label="학년" value={customer.grade} />
                  <InfoRow label="과목" value={customer.subject} />
                  <InfoRow label="희망 시간대" value={customer.preferredTime} />
                  <InfoRow label="팔로업 날짜" value={customer.followUpDate} />
                  <InfoRow label="상담 예약" value={customer.consultationBooked ? `YES (${customer.consultationDate})` : 'NO'} />
                </>
              )}
            </div>
          </div>

          {!editing && (
            <div className="bg-white rounded-apple-xl shadow-card p-7">
              <h2 className="text-headline text-apple-text mb-5">고객 니즈 & 상황</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-label-text text-apple-sub uppercase tracking-wider mb-1">고객 니즈</div>
                  <div className="text-[14px] text-apple-text">{customer.needs || '-'}</div>
                </div>
                <div>
                  <div className="text-label-text text-apple-sub uppercase tracking-wider mb-1">현재 상황</div>
                  <div className="text-[14px] text-apple-text">{customer.currentSituation || '-'}</div>
                </div>
                <div>
                  <div className="text-label-text text-apple-sub uppercase tracking-wider mb-1">다음 액션</div>
                  <div className="text-[14px] text-apple-accent font-medium">{customer.nextAction || '-'}</div>
                </div>
                <div>
                  <div className="text-label-text text-apple-sub uppercase tracking-wider mb-1">특이사항</div>
                  <div className="text-[14px] text-apple-text">{customer.notes || '-'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right — Contact History */}
        <div className="animate-fade-up animate-fade-up-3">
          <div className="bg-white rounded-apple-xl shadow-card p-7">
            <h2 className="text-headline text-apple-text mb-5">
              컨택 이력
              <span className="ml-2 text-caption-text font-normal text-apple-hint">{contacts.length}건</span>
            </h2>

            {/* Add Memo */}
            <div className="mb-6 flex gap-3">
              <textarea
                value={newMemo}
                onChange={e => setNewMemo(e.target.value)}
                placeholder="수동 메모를 추가하세요..."
                className="flex-1 px-4 py-3 border border-apple-border rounded-apple-md text-[14px] resize-none placeholder:text-apple-hint focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all"
                rows={2}
              />
              <button
                onClick={handleAddMemo}
                disabled={!newMemo.trim()}
                className="btn-press self-end h-[40px] px-5 bg-apple-accent text-white text-[14px] font-medium rounded-pill hover:bg-apple-accent-hover disabled:opacity-40 transition-all"
              >
                추가
              </button>
            </div>

            {/* Timeline */}
            <div className="space-y-0">
              {contacts.length === 0 ? (
                <div className="text-center text-apple-hint py-12 text-[15px]">컨택 이력이 없습니다.</div>
              ) : (
                [...contacts]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(contact => (
                    <div key={contact.id} className="relative pl-7 pb-6 border-l-2 border-apple-border last:border-l-0 group">
                      <div className="absolute left-[-5px] top-1.5 w-2 h-2 bg-apple-accent rounded-full" />
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-medium text-apple-text">
                            {new Date(contact.date).toLocaleDateString('ko-KR')}
                          </span>
                          <span className="text-[12px] text-apple-hint">
                            {new Date(contact.date).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {contact.aiGenerated && (
                            <span className="h-[20px] px-2 rounded-pill bg-status-registered-bg text-status-registered text-[11px] font-medium flex items-center">AI</span>
                          )}
                          <span className="h-[20px] px-2 rounded-pill bg-apple-hover text-apple-sub text-[11px] font-medium flex items-center">{contact.type}</span>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <button
                            onClick={() => { setEditingContactId(contact.id); setEditContactMemo(contact.memo); }}
                            className="btn-press h-7 px-2.5 text-[12px] text-apple-accent hover:bg-apple-accent-light rounded-apple-sm transition-all"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteContact(contact.id)}
                            className="btn-press h-7 px-2.5 text-[12px] text-apple-danger hover:bg-red-50 rounded-apple-sm transition-all"
                          >
                            삭제
                          </button>
                        </div>
                      </div>

                      {editingContactId === contact.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editContactMemo}
                            onChange={e => setEditContactMemo(e.target.value)}
                            className="w-full px-3 py-2.5 border border-apple-border rounded-apple-md text-[14px] resize-none focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleEditContact(contact.id)} className="btn-press h-[32px] px-4 bg-apple-accent text-white text-[12px] font-medium rounded-pill hover:bg-apple-accent-hover transition-all">저장</button>
                            <button onClick={() => { setEditingContactId(null); setEditContactMemo(''); }} className="btn-press h-[32px] px-4 bg-apple-hover text-apple-sub text-[12px] font-medium rounded-pill hover:bg-apple-border transition-all">취소</button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[14px] text-apple-sub whitespace-pre-wrap leading-relaxed">{contact.memo}</div>
                      )}

                      {contact.transcript && (
                        <details className="mt-2">
                          <summary className="text-[12px] text-apple-accent cursor-pointer hover:underline">원본 녹취 보기</summary>
                          <div className="mt-2 text-[12px] text-apple-sub bg-apple-hover rounded-apple-md p-3 max-h-40 overflow-y-auto leading-relaxed">
                            {contact.transcript}
                          </div>
                        </details>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Briefing Modal */}
      {showBriefing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 no-print" onClick={() => setShowBriefing(false)}>
          <div
            className="bg-white rounded-apple-xl shadow-modal max-w-[680px] w-full max-h-[85vh] overflow-y-auto animate-modal-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/90 border-b border-apple-border px-8 py-5 flex items-center justify-between" style={{ backdropFilter: 'blur(20px)' }}>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-apple-sm bg-apple-dark flex items-center justify-center">
                  <span className="text-white font-semibold text-[10px]">SBS</span>
                </div>
                <h2 className="text-headline text-apple-text">상담 브리핑 시트</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(briefing); alert('클립보드에 복사되었습니다.'); }}
                  className="btn-press h-[34px] px-4 bg-apple-hover text-apple-text text-[13px] font-medium rounded-pill hover:bg-apple-border transition-all"
                >
                  복사
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn-press h-[34px] px-4 bg-apple-hover text-apple-text text-[13px] font-medium rounded-pill hover:bg-apple-border transition-all"
                >
                  인쇄
                </button>
                <button
                  onClick={() => setShowBriefing(false)}
                  className="btn-press w-[34px] h-[34px] flex items-center justify-center rounded-apple-sm hover:bg-apple-hover text-apple-hint hover:text-apple-text transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Modal Body */}
            <div className="px-8 py-6">
              <div className="text-[12px] text-apple-hint mb-4">{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div className="text-title text-apple-text mb-6">{customer.name}</div>
              <div className="prose prose-sm max-w-none text-[14px] text-apple-sub leading-relaxed whitespace-pre-wrap">{briefing}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-apple-border last:border-b-0">
      <span className="text-caption-text text-apple-sub">{label}</span>
      <span className="text-[14px] text-apple-text font-medium">{value || '-'}</span>
    </div>
  );
}

function EditField({
  label, value, onChange, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="text-label-text text-apple-accent uppercase tracking-wider">{label}</label>
      <input
        type={type}
        className="w-full mt-1.5 h-[44px] px-3 border border-apple-border rounded-apple-md text-[14px] focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
