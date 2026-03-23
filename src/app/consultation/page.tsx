'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Section {
  title: string;
  content: string;
  imageKeyword: string;
}

interface ConsultationMaterial {
  title: string;
  subtitle: string;
  sections: Section[];
}

const SECTION_VISUALS = [
  { from: 'from-blue-500', to: 'to-cyan-400', bg: 'from-blue-50 to-cyan-50', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { from: 'from-violet-500', to: 'to-purple-400', bg: 'from-violet-50 to-purple-50', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { from: 'from-emerald-500', to: 'to-teal-400', bg: 'from-emerald-50 to-teal-50', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  { from: 'from-orange-500', to: 'to-amber-400', bg: 'from-orange-50 to-amber-50', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { from: 'from-rose-500', to: 'to-pink-400', bg: 'from-rose-50 to-pink-50', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { from: 'from-indigo-500', to: 'to-blue-400', bg: 'from-indigo-50 to-blue-50', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  { from: 'from-cyan-500', to: 'to-sky-400', bg: 'from-cyan-50 to-sky-50', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
  { from: 'from-fuchsia-500', to: 'to-violet-400', bg: 'from-fuchsia-50 to-violet-50', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
];

export default function ConsultationPage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [customerName, setCustomerName] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [needs, setNeeds] = useState('');
  const [currentSituation, setCurrentSituation] = useState('');
  const [notes, setNotes] = useState('');
  const [customContent, setCustomContent] = useState('');

  const [generating, setGenerating] = useState(false);
  const [material, setMaterial] = useState<ConsultationMaterial | null>(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [pptDownloading, setPptDownloading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('consultationData');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCustomerName(data.customerName || '');
        setGrade(data.grade || '');
        setSubject(data.subject || '');
        setNeeds(data.needs || '');
        setCurrentSituation(data.currentSituation || '');
        setNotes(data.notes || '');
      } catch { /* ignore */ }
    }
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setMaterial(null);
    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName, grade, subject, needs, currentSituation, notes, customContent }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMaterial(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '상담 자료 생성 실패');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 297;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;
      let remainingHeight = imgHeight;

      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight);
      remainingHeight -= pageHeight;

      while (remainingHeight > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight);
        remainingHeight -= pageHeight;
      }

      const fileName = customerName ? `${customerName}_상담자료.pdf` : '상담자료.pdf';
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('PDF 다운로드 중 오류가 발생했습니다. 프린트 기능을 이용해주세요.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePptDownload = async () => {
    if (!material) return;
    setPptDownloading(true);
    try {
      // Use Function-based dynamic import to avoid webpack static analysis of node: modules
      const pptxgenjs = (await (new Function('return import("pptxgenjs")'))()).default;
      const pptx = new pptxgenjs();
      pptx.layout = 'LAYOUT_WIDE';

      // Cover slide
      const coverSlide = pptx.addSlide();
      coverSlide.background = { fill: '1a237e' };
      coverSlide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: '100%', h: 0.15,
        fill: { type: 'solid', color: '3949ab' },
      });
      coverSlide.addShape(pptx.ShapeType.rect, {
        x: 0, y: '95%', w: '100%', h: 0.15,
        fill: { type: 'solid', color: '3949ab' },
      });
      coverSlide.addText('SBS', {
        x: 4.5, y: 1.0, w: 4, h: 1,
        fontSize: 36, bold: true, color: 'FFFFFF', align: 'center',
      });
      coverSlide.addText(material.title, {
        x: 1, y: 2.2, w: 11, h: 1,
        fontSize: 28, bold: true, color: 'FFFFFF', align: 'center',
      });
      coverSlide.addText(material.subtitle, {
        x: 1, y: 3.2, w: 11, h: 0.6,
        fontSize: 16, color: 'B0BEC5', align: 'center',
      });
      const infoLines: string[] = [];
      if (customerName) infoLines.push(`고객: ${customerName}`);
      if (grade) infoLines.push(`학년: ${grade}`);
      if (subject) infoLines.push(`과목: ${subject}`);
      if (infoLines.length > 0) {
        coverSlide.addText(infoLines.join('  |  '), {
          x: 1, y: 4.2, w: 11, h: 0.5,
          fontSize: 13, color: '90CAF9', align: 'center',
        });
      }
      coverSlide.addText(new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }), {
        x: 1, y: 5.0, w: 11, h: 0.4,
        fontSize: 11, color: '78909C', align: 'center',
      });

      // Content slides
      material.sections.forEach((section, idx) => {
        const slide = pptx.addSlide();
        slide.background = { fill: 'FFFFFF' };
        slide.addShape(pptx.ShapeType.rect, {
          x: 0, y: 0, w: '100%', h: 0.08,
          fill: { type: 'solid', color: '3F51B5' },
        });
        slide.addText(String(idx + 1).padStart(2, '0'), {
          x: 0.5, y: 0.4, w: 0.8, h: 0.8,
          fontSize: 24, bold: true, color: '3F51B5', align: 'center',
        });
        slide.addText(section.title, {
          x: 1.4, y: 0.5, w: 10, h: 0.6,
          fontSize: 22, bold: true, color: '1a237e',
        });
        slide.addShape(pptx.ShapeType.rect, {
          x: 0.5, y: 1.3, w: 12, h: 0.02,
          fill: { type: 'solid', color: 'E8EAF6' },
        });
        slide.addText(section.content, {
          x: 0.7, y: 1.6, w: 11.5, h: 4.5,
          fontSize: 15, color: '424242', lineSpacingMultiple: 1.5,
          valign: 'top',
        });
        slide.addText(`SBS아카데미컴퓨터아트학원 분당점  |  ${material.title}`, {
          x: 0.5, y: 7.0, w: 12, h: 0.3,
          fontSize: 9, color: 'BDBDBD', align: 'center',
        });
      });

      // Footer slide
      const footerSlide = pptx.addSlide();
      footerSlide.background = { fill: '1a237e' };
      footerSlide.addText('SBS아카데미컴퓨터아트학원 분당점', {
        x: 1, y: 2.0, w: 11, h: 1,
        fontSize: 28, bold: true, color: 'FFFFFF', align: 'center',
      });
      footerSlide.addText('학생 한 명 한 명에게 최적화된 교육을 제공합니다', {
        x: 1, y: 3.2, w: 11, h: 0.6,
        fontSize: 15, color: 'B0BEC5', align: 'center',
      });
      footerSlide.addText('상담 문의는 담당자에게 연락주세요', {
        x: 1, y: 4.5, w: 11, h: 0.5,
        fontSize: 13, color: '78909C', align: 'center',
      });
      footerSlide.addText(`본 자료는 ${new Date().toLocaleDateString('ko-KR')} 기준으로 작성되었습니다`, {
        x: 1, y: 5.5, w: 11, h: 0.4,
        fontSize: 10, color: '546E7A', align: 'center',
      });

      const fileName = customerName ? `${customerName}_상담자료.pptx` : '상담자료.pptx';
      await pptx.writeFile({ fileName });
    } catch (err) {
      console.error('PPT download error:', err);
      alert('PPT 다운로드 중 오류가 발생했습니다.');
    } finally {
      setPptDownloading(false);
    }
  };

  // Show form when no material generated yet
  if (!material) {
    return (
      <div className="max-w-[720px] mx-auto px-8 py-10">
        <div className="mb-8 animate-fade-up animate-fade-up-1">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="btn-press w-9 h-9 rounded-full border border-apple-border flex items-center justify-center hover:bg-apple-hover transition-colors">
              <svg className="w-4 h-4 text-apple-sub" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h1 className="text-title text-apple-text">상담 자료 생성</h1>
              <p className="text-caption-text text-apple-sub mt-1">AI가 맞춤형 상담 자료를 생성합니다</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-apple-lg bg-red-50 text-apple-danger text-[14px]">{error}</div>
        )}

        <div className="bg-white rounded-apple-xl shadow-card p-7 space-y-5 animate-fade-up animate-fade-up-2">
          <h2 className="text-headline text-apple-text">고객 정보</h2>
          <p className="text-[13px] text-apple-sub -mt-3">분석 결과가 자동으로 채워집니다. 수정하거나 추가 내용을 입력하세요.</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-label-text text-apple-accent uppercase tracking-wider">고객 이름</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                placeholder="홍길동" className="w-full mt-1.5 h-[44px] px-3 border border-apple-border rounded-apple-md text-[14px] focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all" />
            </div>
            <div>
              <label className="text-label-text text-apple-accent uppercase tracking-wider">나이/연령</label>
              <input type="text" value={grade} onChange={e => setGrade(e.target.value)}
                placeholder="25세, 대학생, 직장인 등" className="w-full mt-1.5 h-[44px] px-3 border border-apple-border rounded-apple-md text-[14px] focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all" />
            </div>
            <div>
              <label className="text-label-text text-apple-accent uppercase tracking-wider">관심 과정</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="포토샵, 일러스트, AI, 영상편집 등" className="w-full mt-1.5 h-[44px] px-3 border border-apple-border rounded-apple-md text-[14px] focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all" />
            </div>
            <div>
              <label className="text-label-text text-apple-accent uppercase tracking-wider">현재 상황</label>
              <input type="text" value={currentSituation} onChange={e => setCurrentSituation(e.target.value)}
                placeholder="비전공자, 취업 준비 중, 실무 스킬업 등" className="w-full mt-1.5 h-[44px] px-3 border border-apple-border rounded-apple-md text-[14px] focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all" />
            </div>
            <div className="col-span-2">
              <label className="text-label-text text-apple-accent uppercase tracking-wider">고객 니즈</label>
              <textarea value={needs} onChange={e => setNeeds(e.target.value)}
                placeholder="수학 성적 향상, 내신 대비 등" rows={2}
                className="w-full mt-1.5 px-3 py-2.5 border border-apple-border rounded-apple-md text-[14px] resize-none focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all" />
            </div>
            <div className="col-span-2">
              <label className="text-label-text text-apple-accent uppercase tracking-wider">특이사항</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="기타 참고할 사항" rows={2}
                className="w-full mt-1.5 px-3 py-2.5 border border-apple-border rounded-apple-md text-[14px] resize-none focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all" />
            </div>
          </div>

          <div className="pt-2">
            <label className="text-label-text text-apple-accent uppercase tracking-wider">추가 작성 내용 (선택)</label>
            <textarea value={customContent} onChange={e => setCustomContent(e.target.value)}
              placeholder={"상담 자료에 포함하고 싶은 추가 내용을 자유롭게 작성하세요.\n예: 특별 프로모션 안내, 커리큘럼 특징, 강조할 부분 등"}
              rows={4}
              className="w-full mt-1.5 px-3 py-2.5 border border-apple-border rounded-apple-md text-[14px] resize-none focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all" />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-press w-full mt-6 h-[48px] bg-apple-accent text-white font-medium text-[15px] rounded-pill hover:bg-apple-accent-hover disabled:opacity-40 transition-all"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
              AI 상담 자료 생성 중...
            </span>
          ) : '상담 자료 생성하기'}
        </button>
      </div>
    );
  }

  // Material generated - show preview with print/download
  return (
    <>
      {/* Action bar - hidden when printing */}
      <div className="print:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-apple-border">
        <div className="max-w-[900px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMaterial(null)} className="btn-press w-9 h-9 rounded-full border border-apple-border flex items-center justify-center hover:bg-apple-hover transition-colors">
              <svg className="w-4 h-4 text-apple-sub" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h1 className="text-[17px] font-semibold text-apple-text">상담 자료 미리보기</h1>
              <p className="text-[12px] text-apple-sub">PDF로 다운로드하거나 프린트하세요</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="btn-press h-[38px] px-5 bg-white border border-apple-border text-apple-text text-[13px] font-medium rounded-pill hover:bg-apple-hover disabled:opacity-40 transition-all flex items-center gap-2"
            >
              {downloading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-apple-accent border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                  다운로드 중...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  PDF 다운로드
                </>
              )}
            </button>
            <button
              onClick={handlePptDownload}
              disabled={pptDownloading}
              className="btn-press h-[38px] px-5 bg-white border border-apple-border text-apple-text text-[13px] font-medium rounded-pill hover:bg-apple-hover disabled:opacity-40 transition-all flex items-center gap-2"
            >
              {pptDownloading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-apple-accent border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                  다운로드 중...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  PPT 다운로드
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="btn-press h-[38px] px-5 bg-apple-accent text-white text-[13px] font-medium rounded-pill hover:bg-apple-accent-hover transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              프린트
            </button>
          </div>
        </div>
      </div>

      {/* Printable content */}
      <div ref={printRef} className="max-w-[900px] mx-auto bg-white print:max-w-none print:mx-0">
        {/* Cover Page */}
        <div className="relative min-h-[600px] flex flex-col items-center justify-center text-center px-12 py-20 print:min-h-[90vh] print:break-after-page">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            <div className="absolute top-20 right-10 w-64 h-64 bg-blue-50 rounded-full opacity-40 blur-3xl" />
            <div className="absolute bottom-20 left-10 w-48 h-48 bg-indigo-50 rounded-full opacity-40 blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-8 shadow-lg">
              <span className="text-white font-bold text-xl">SBS</span>
            </div>

            <h1 className="text-[32px] font-bold text-gray-900 leading-tight mb-4">
              {material.title}
            </h1>
            <p className="text-[18px] text-gray-500 mb-8">{material.subtitle}</p>

            <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto mb-8" />

            <div className="space-y-2 text-[15px] text-gray-600">
              {customerName && <p>{customerName} 학부모님께 드리는 맞춤 상담 자료</p>}
              <p>{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Summary info cards */}
            <div className="flex justify-center gap-4 mt-10">
              {([
                grade ? { label: '학년', value: grade } : null,
                subject ? { label: '과목', value: subject } : null,
                currentSituation ? { label: '현재 상황', value: currentSituation } : null,
              ].filter((item): item is { label: string; value: string } => item !== null)).map((item, i) => (
                <div key={i} className="px-5 py-3 rounded-xl bg-white/80 border border-gray-100 shadow-sm">
                  <div className="text-[11px] text-gray-400 uppercase tracking-wider">{item.label}</div>
                  <div className="text-[15px] font-semibold text-gray-800 mt-0.5">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Sections */}
        {material.sections.map((section, idx) => {
          const visual = SECTION_VISUALS[idx % SECTION_VISUALS.length];
          const isEven = idx % 2 === 0;

          return (
            <div key={idx} className={`px-12 py-10 ${isEven ? 'bg-white' : 'bg-gray-50'} print:break-inside-avoid`}>
              <div className="max-w-[750px] mx-auto">
                {/* Section number + title */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${visual.from} ${visual.to} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold text-[14px]">{String(idx + 1).padStart(2, '0')}</span>
                  </div>
                  <h2 className="text-[22px] font-bold text-gray-900">{section.title}</h2>
                </div>

                {/* Content with visual card */}
                <div className={`flex gap-8 items-start ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className="flex-1">
                    <p className="text-[15px] text-gray-700 leading-[1.8] whitespace-pre-line">
                      {section.content}
                    </p>
                  </div>
                  <div className="w-[240px] flex-shrink-0">
                    <SectionImage keyword={section.imageKeyword} visual={visual} index={idx} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Footer / Contact page */}
        <div className="px-12 py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white text-center print:break-before-page">
          <div className="max-w-[600px] mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-lg">SBS</span>
            </div>
            <h2 className="text-[24px] font-bold mb-3">SBS아카데미컴퓨터아트학원 분당점</h2>
            <p className="text-[15px] text-white/60 mb-8">
              학생 한 명 한 명에게 최적화된 교육을 제공합니다
            </p>
            <div className="w-12 h-0.5 bg-white/20 mx-auto mb-8" />
            <div className="space-y-2 text-[14px] text-white/50">
              <p>상담 문의는 담당자에게 연락주세요</p>
              <p className="text-white/30 text-[12px] mt-4">
                본 자료는 {new Date().toLocaleDateString('ko-KR')} 기준으로 작성되었습니다
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom spacer */}
      <div className="print:hidden h-20" />
    </>
  );
}

function SectionImage({ keyword, visual, index }: { keyword: string; visual: typeof SECTION_VISUALS[number]; index: number }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(keyword + ', professional photo, high quality, realistic')}?width=480&height=360&seed=${index + 1}&nologo=true`;

  if (failed) {
    return (
      <div className={`w-full h-[180px] rounded-xl bg-gradient-to-br ${visual.bg} flex flex-col items-center justify-center shadow-sm border border-gray-100`}>
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${visual.from} ${visual.to} flex items-center justify-center shadow-md mb-3`}>
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={visual.icon} />
          </svg>
        </div>
        <span className="text-[12px] font-medium text-gray-400 px-4 text-center">{keyword}</span>
      </div>
    );
  }

  return (
    <div className="w-full h-[180px] rounded-xl overflow-hidden shadow-sm border border-gray-100 relative bg-gray-100">
      {!loaded && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${visual.bg}`}>
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
          <span className="text-[11px] text-gray-400 absolute bottom-3">이미지 생성 중...</span>
        </div>
      )}
      <img
        src={imageUrl}
        alt={keyword}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (retryCount < 2) {
            setRetryCount(prev => prev + 1);
            setTimeout(() => {
              const img = document.querySelector(`img[alt="${keyword}"]`) as HTMLImageElement;
              if (img) img.src = imageUrl + `&retry=${retryCount + 1}`;
            }, 2000 * (retryCount + 1));
          } else {
            setFailed(true);
          }
        }}
      />
    </div>
  );
}
