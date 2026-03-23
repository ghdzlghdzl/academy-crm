'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Customer, AnalysisResult, STATUSES, CustomerStatus } from '@/types';

type Step = 'upload' | 'stt' | 'analyze' | 'review' | 'done';

const STEPS = [
  { key: 'upload', label: '녹취 파일 업로드' },
  { key: 'stt', label: '텍스트 변환 중...' },
  { key: 'analyze', label: 'AI 메모 생성 중...' },
  { key: 'review', label: '결과 확인' },
  { key: 'done', label: '저장 완료' },
] as const;

function stepIndex(step: Step) {
  return STEPS.findIndex(s => s.key === step);
}

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('new');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [memoCopied, setMemoCopied] = useState(false);

  // 메모 양식 생성 함수
  const generateMemoFormat = (a: AnalysisResult): string => {
    return `*컨텍자 : ${a.customerName || ''}
*본인 확인 및 문의 여부 체크 : ${a.needs ? '문의 확인 - ' + a.needs : ''}
*배워보시려는 계기 및 수강 희망 시기 : ${a.currentSituation || ''}${a.consultationDate ? ' / ' + a.consultationDate + ' 수강 희망' : ''}
*분야 경험 및 수강 경험 유/무 : ${a.currentSituation || '확인 필요'}
*현재 거주지 및 평소 스케줄 어떤지 (가용시간체크) : ${a.preferredTime || '확인 필요'}
*상담 명분 제시 및 상담 일정 확정 : ${a.consultationBooked ? '상담 확정' : '미확정'}${a.consultationDate ? ' - ' + a.consultationDate : ''}
*이외 상담내용(특이사항) : ${[a.subject, a.grade, a.notes].filter(Boolean).join(' / ') || ''}
* 수강료 / 시간표에 대한 나의 응대 :
* 같이 방문하실 지인 / 기타 특이사항 : ${a.notes || ''}
* 통화시간 : ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleCopyMemo = async () => {
    if (!analysis) return;
    const memo = generateMemoFormat(analysis);
    try {
      await navigator.clipboard.writeText(memo);
      setMemoCopied(true);
      setTimeout(() => setMemoCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = memo;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setMemoCopied(true);
      setTimeout(() => setMemoCopied(false), 2000);
    }
  };

  useEffect(() => {
    fetch('/api/customers').then(res => res.json()).then(setCustomers);
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    const allowed = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-m4a', 'audio/mp3'];
    if (!allowed.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp3|m4a|wav)$/i)) {
      setError('MP3, M4A, WAV 파일만 업로드 가능합니다.');
      return;
    }
    setFile(selectedFile);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setError('');
    setStep('stt');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const sttRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const sttData = await sttRes.json();
      if (!sttRes.ok) throw new Error(sttData.error || 'STT 실패');
      setTranscript(sttData.transcript);

      setStep('analyze');
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: sttData.transcript }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeData.error || 'AI 분석 실패');
      setAnalysis(analyzeData);
      setStep('review');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '처리 중 오류 발생';
      setError(message);
      setStep('upload');
    }
  };

  const handleSave = async () => {
    if (!analysis) return;
    setSaving(true);
    try {
      let customerId = selectedCustomerId;
      if (selectedCustomerId === 'new') {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: analysis.customerName || '미확인',
            phone: '',
            status: analysis.status,
            grade: analysis.grade,
            subject: analysis.subject,
            preferredTime: analysis.preferredTime,
            needs: analysis.needs,
            currentSituation: analysis.currentSituation,
            followUpDate: analysis.followUpDate,
            consultationBooked: analysis.consultationBooked,
            consultationDate: analysis.consultationDate,
            nextAction: analysis.nextAction,
            notes: analysis.notes,
          }),
        });
        const newCustomer = await res.json();
        customerId = newCustomer.id;
      } else {
        await fetch(`/api/customers/${customerId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: analysis.status,
            grade: analysis.grade || undefined,
            subject: analysis.subject || undefined,
            preferredTime: analysis.preferredTime || undefined,
            needs: analysis.needs || undefined,
            currentSituation: analysis.currentSituation || undefined,
            followUpDate: analysis.followUpDate,
            consultationBooked: analysis.consultationBooked,
            consultationDate: analysis.consultationDate,
            nextAction: analysis.nextAction,
            notes: analysis.notes,
          }),
        });
      }

      await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newContact: {
            type: 'call',
            transcript: transcript,
            memo: formatMemo(analysis),
            aiGenerated: true,
            date: new Date().toISOString(),
          },
        }),
      });

      setStep('done');
      setTimeout(() => router.push(`/customer/${customerId}`), 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '저장 중 오류 발생';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, []);

  const filteredCustomers = customers.filter(
    c => c.name.includes(searchTerm) || c.phone.includes(searchTerm)
  );

  const currentStep = stepIndex(step);

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-10">
      {/* Header */}
      <div className="mb-8 animate-fade-up animate-fade-up-1">
        <h1 className="text-title text-apple-text">녹취 업로드</h1>
        <p className="text-caption-text text-apple-sub mt-1">통화 녹취 파일을 업로드하면 자동으로 분석됩니다</p>
      </div>

      {/* Vertical Stepper */}
      <div className="mb-8 animate-fade-up animate-fade-up-2">
        <div className="flex flex-col gap-0">
          {STEPS.map((s, i) => {
            const isComplete = currentStep > i;
            const isCurrent = currentStep === i;

            return (
              <div key={s.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isComplete ? 'bg-status-booked' :
                    isCurrent ? 'bg-apple-accent' :
                    'bg-apple-hover border-2 border-apple-border'
                  }`}>
                    {isComplete ? (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isCurrent && (step === 'stt' || step === 'analyze') ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                    ) : (
                      <span className={`text-[11px] font-semibold ${isCurrent ? 'text-white' : 'text-apple-hint'}`}>{i + 1}</span>
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-0.5 h-4 ${isComplete ? 'bg-status-booked' : 'bg-apple-border'}`} />
                  )}
                </div>
                <span className={`text-[14px] pt-0.5 ${
                  isCurrent ? 'text-apple-accent font-medium' :
                  isComplete ? 'text-status-booked' :
                  'text-apple-hint'
                }`}>
                  {isCurrent && (step === 'stt' || step === 'analyze') ? s.label : (isComplete ? s.label.replace('중...', '완료') : s.label)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-apple-lg bg-red-50 text-apple-danger text-[14px]">{error}</div>
      )}

      {/* Upload Step */}
      {step === 'upload' && (
        <div className="space-y-6 animate-fade-up animate-fade-up-3">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            className={`rounded-apple-xl border-2 border-dashed p-16 text-center transition-all ${
              isDragOver
                ? 'border-apple-accent bg-apple-accent-light'
                : 'border-apple-border bg-white hover:border-apple-sub'
            }`}
          >
            <div className={`mx-auto w-12 h-12 flex items-center justify-center transition-colors ${isDragOver ? 'text-apple-accent' : 'text-apple-hint'}`}>
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="mt-4 text-[15px] text-apple-text">
              파일을 여기에 드래그하거나{' '}
              <label className="text-apple-accent hover:text-apple-accent-hover cursor-pointer font-medium">
                클릭하여 선택
                <input
                  type="file"
                  accept=".mp3,.m4a,.wav"
                  className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
                />
              </label>
              하세요
            </p>
            <p className="text-[13px] text-apple-hint mt-2">MP3, M4A, WAV 지원</p>
            {file && (
              <div className="mt-5 inline-flex items-center gap-2 bg-apple-accent-light text-apple-accent px-4 py-2 rounded-pill text-[13px] font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
              </div>
            )}
          </div>

          {/* Customer Selection */}
          <div className="bg-white rounded-apple-xl shadow-card p-6">
            <h2 className="text-headline text-apple-text mb-4">연결할 고객</h2>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-3.5 rounded-apple-md border cursor-pointer transition-all ${
                selectedCustomerId === 'new' ? 'border-apple-accent bg-apple-accent-light' : 'border-apple-border hover:bg-apple-hover'
              }`}>
                <input type="radio" name="customer" value="new" checked={selectedCustomerId === 'new'} onChange={() => setSelectedCustomerId('new')} className="accent-apple-accent" />
                <span className="text-[14px] font-medium text-apple-text">신규 고객 생성</span>
              </label>

              <input
                type="text"
                placeholder="기존 고객 검색 (이름 또는 연락처)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-[44px] px-4 border border-apple-border rounded-apple-md bg-white text-[14px] text-apple-text placeholder:text-apple-hint focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all"
              />

              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {filteredCustomers.map(c => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-3 p-3.5 rounded-apple-md border cursor-pointer transition-all ${
                      selectedCustomerId === c.id ? 'border-apple-accent bg-apple-accent-light' : 'border-apple-border hover:bg-apple-hover'
                    }`}
                  >
                    <input type="radio" name="customer" value={c.id} checked={selectedCustomerId === c.id} onChange={() => setSelectedCustomerId(c.id)} className="accent-apple-accent" />
                    <div>
                      <span className="text-[14px] font-medium text-apple-text">{c.name}</span>
                      <span className="text-[12px] text-apple-sub ml-2">{c.phone}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file}
            className="btn-press w-full h-[48px] bg-apple-accent text-white font-medium text-[15px] rounded-pill hover:bg-apple-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            업로드 및 분석 시작
          </button>
        </div>
      )}

      {/* Processing */}
      {(step === 'stt' || step === 'analyze') && (
        <div className="bg-white rounded-apple-xl shadow-card p-16 text-center animate-fade-up animate-fade-up-1">
          <div className="w-12 h-12 border-2 border-apple-accent border-t-transparent rounded-full mx-auto" style={{ animation: 'spin 0.8s linear infinite' }} />
          <p className="mt-5 text-headline text-apple-text">
            {step === 'stt' ? '텍스트 변환 중...' : 'AI가 내용을 분석 중...'}
          </p>
          <p className="mt-2 text-caption-text text-apple-sub">잠시만 기다려주세요</p>
        </div>
      )}

      {/* Review Step */}
      {step === 'review' && analysis && (
        <div className="space-y-6 animate-fade-up animate-fade-up-1">
          {/* Transcript */}
          <div className="bg-white rounded-apple-xl shadow-card p-6">
            <h2 className="text-headline text-apple-text mb-3">텍스트 변환</h2>
            <div className="bg-apple-hover rounded-apple-md p-4 text-[14px] text-apple-sub max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {transcript}
            </div>
          </div>

          {/* AI 분석 + 메모 양식 - 2컬럼 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Analysis Result */}
            <div className="bg-white rounded-apple-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-headline text-apple-text">AI 분석 결과</h2>
                <span className="h-[22px] px-2.5 rounded-pill bg-status-booked-bg text-status-booked text-[12px] font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  완료
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FieldInput label="고객 이름" value={analysis.customerName || ''} onChange={v => setAnalysis(a => a && ({ ...a, customerName: v }))} />
                <FieldInput label="학년" value={analysis.grade || ''} onChange={v => setAnalysis(a => a && ({ ...a, grade: v }))} />
                <FieldInput label="과목" value={analysis.subject || ''} onChange={v => setAnalysis(a => a && ({ ...a, subject: v }))} />
                <FieldInput label="희망 시간대" value={analysis.preferredTime || ''} onChange={v => setAnalysis(a => a && ({ ...a, preferredTime: v }))} />
                <div className="col-span-2">
                  <FieldInput label="고객 니즈" value={analysis.needs || ''} onChange={v => setAnalysis(a => a && ({ ...a, needs: v }))} textarea />
                </div>
                <div className="col-span-2">
                  <FieldInput label="현재 상황" value={analysis.currentSituation || ''} onChange={v => setAnalysis(a => a && ({ ...a, currentSituation: v }))} textarea />
                </div>
                <div>
                  <label className="text-label-text text-apple-accent uppercase tracking-wider">상담 예약</label>
                  <select
                    className="w-full mt-1.5 h-[44px] px-3 border border-apple-border rounded-apple-md text-[14px] text-apple-text focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all"
                    value={analysis.consultationBooked ? 'yes' : 'no'}
                    onChange={e => setAnalysis(a => a && ({ ...a, consultationBooked: e.target.value === 'yes' }))}
                  >
                    <option value="no">NO</option>
                    <option value="yes">YES</option>
                  </select>
                </div>
                <FieldInput label="상담 날짜" value={analysis.consultationDate || ''} onChange={v => setAnalysis(a => a && ({ ...a, consultationDate: v }))} type="date" />
                <FieldInput label="팔로업 날짜" value={analysis.followUpDate || ''} onChange={v => setAnalysis(a => a && ({ ...a, followUpDate: v }))} type="date" />
                <div>
                  <label className="text-label-text text-apple-accent uppercase tracking-wider">상태</label>
                  <select
                    className="w-full mt-1.5 h-[44px] px-3 border border-apple-border rounded-apple-md text-[14px] text-apple-text focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all"
                    value={analysis.status}
                    onChange={e => setAnalysis(a => a && ({ ...a, status: e.target.value as CustomerStatus }))}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <FieldInput label="다음 액션" value={analysis.nextAction || ''} onChange={v => setAnalysis(a => a && ({ ...a, nextAction: v }))} textarea />
                </div>
                <div className="col-span-2">
                  <FieldInput label="특이사항" value={analysis.notes || ''} onChange={v => setAnalysis(a => a && ({ ...a, notes: v }))} textarea />
                </div>
              </div>
            </div>

            {/* 메모 양식 */}
            <div className="bg-white rounded-apple-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-headline text-apple-text">메모 양식</h2>
                <button
                  onClick={handleCopyMemo}
                  className={`btn-press h-[32px] px-4 text-[12px] font-medium rounded-pill flex items-center gap-1.5 transition-all ${
                    memoCopied
                      ? 'bg-status-booked-bg text-status-booked'
                      : 'bg-apple-accent text-white hover:bg-apple-accent-hover'
                  }`}
                >
                  {memoCopied ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      복사 완료!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                      메모 전체 복사
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-50 rounded-apple-md p-5 text-[13px] text-gray-700 leading-[2.2] whitespace-pre-wrap font-mono border border-gray-100">
                {generateMemoFormat(analysis)}
              </div>
              <p className="text-[11px] text-apple-hint mt-3">* AI 분석 결과를 수정하면 메모 내용도 자동 반영됩니다</p>
            </div>
          </div>

          {/* Consultation Material Button */}
          {analysis.consultationBooked && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-apple-xl border border-blue-100 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    상담 예약이 확인되었습니다
                  </h3>
                  <p className="text-[13px] text-gray-500 mt-1">AI가 맞춤형 상담 자료를 자동으로 생성해드립니다</p>
                </div>
                <button
                  onClick={() => {
                    sessionStorage.setItem('consultationData', JSON.stringify({
                      customerName: analysis.customerName,
                      grade: analysis.grade,
                      subject: analysis.subject,
                      needs: analysis.needs,
                      currentSituation: analysis.currentSituation,
                      notes: analysis.notes,
                    }));
                    router.push('/consultation');
                  }}
                  className="btn-press h-[40px] px-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[13px] font-medium rounded-pill hover:opacity-90 transition-all flex items-center gap-2 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  상담 자료 생성
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setStep('upload'); setTranscript(''); setAnalysis(null); }}
              className="btn-press flex-1 h-[48px] bg-transparent border-[1.5px] border-apple-border text-apple-text font-medium text-[15px] rounded-pill hover:bg-apple-hover transition-all"
            >
              다시 업로드
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-press flex-1 h-[48px] bg-apple-accent text-white font-medium text-[15px] rounded-pill hover:bg-apple-accent-hover disabled:opacity-40 transition-all"
            >
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </div>
      )}

      {/* Done */}
      {step === 'done' && (
        <div className="bg-white rounded-apple-xl shadow-card p-16 text-center animate-modal-in">
          <div className="w-16 h-16 bg-status-booked-bg rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-status-booked" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="mt-5 text-headline text-apple-text">저장 완료!</p>
          <p className="mt-2 text-caption-text text-apple-sub">고객 상세 페이지로 이동합니다...</p>
        </div>
      )}
    </div>
  );
}

function FieldInput({
  label, value, onChange, type = 'text', textarea = false,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean;
}) {
  return (
    <div>
      <label className="text-label-text text-apple-accent uppercase tracking-wider">{label}</label>
      {textarea ? (
        <textarea
          className="w-full mt-1.5 px-3 py-2.5 border border-apple-border rounded-apple-md text-[14px] text-apple-text resize-none focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all"
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={2}
        />
      ) : (
        <input
          type={type}
          className="w-full mt-1.5 h-[44px] px-3 border border-apple-border rounded-apple-md text-[14px] text-apple-text focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function formatMemo(analysis: AnalysisResult): string {
  const lines = [];
  if (analysis.customerName) lines.push(`고객명: ${analysis.customerName}`);
  if (analysis.grade) lines.push(`학년: ${analysis.grade}`);
  if (analysis.subject) lines.push(`과목: ${analysis.subject}`);
  if (analysis.needs) lines.push(`니즈: ${analysis.needs}`);
  if (analysis.currentSituation) lines.push(`현재 상황: ${analysis.currentSituation}`);
  if (analysis.preferredTime) lines.push(`희망 시간대: ${analysis.preferredTime}`);
  lines.push(`상담 예약: ${analysis.consultationBooked ? 'YES' : 'NO'}`);
  if (analysis.consultationDate) lines.push(`상담 날짜: ${analysis.consultationDate}`);
  lines.push(`팔로업: ${analysis.followUpDate}`);
  if (analysis.nextAction) lines.push(`다음 액션: ${analysis.nextAction}`);
  if (analysis.notes) lines.push(`특이사항: ${analysis.notes}`);
  return lines.join('\n');
}
