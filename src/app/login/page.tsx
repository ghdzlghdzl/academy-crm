'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const email = `${username}@sbs.academy`;
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '로그인 실패';
      if (message.includes('Invalid login')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else if (message.includes('banned')) {
        setError('비활성화된 계정입니다. 관리자에게 문의하세요.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-apple-dark flex items-center justify-center px-4">
      <div className="w-full max-w-[400px] animate-fade-up animate-fade-up-1">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-apple-lg bg-white/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">SBS</span>
          </div>
          <h1 className="text-[24px] font-semibold text-white tracking-tight">SBS아카데미컴퓨터아트학원 분당점</h1>
          <p className="text-[14px] text-white/50 mt-1">영업 관리 시스템</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-white rounded-apple-xl shadow-modal p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-apple-md bg-red-50 text-apple-danger text-[13px]">{error}</div>
          )}

          <div>
            <label className="text-label-text text-apple-sub uppercase tracking-wider">아이디</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="아이디 입력"
              required
              className="w-full mt-1.5 h-[48px] px-4 border border-apple-border rounded-apple-md text-[15px] text-apple-text placeholder:text-apple-hint focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all"
            />
          </div>

          <div>
            <label className="text-label-text text-apple-sub uppercase tracking-wider">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              required
              className="w-full mt-1.5 h-[48px] px-4 border border-apple-border rounded-apple-md text-[15px] text-apple-text placeholder:text-apple-hint focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-press w-full h-[48px] bg-apple-accent text-white font-medium text-[15px] rounded-pill hover:bg-apple-accent-hover disabled:opacity-40 transition-all"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="text-center text-[12px] text-white/30 mt-6">
          계정이 없으시면 관리자에게 문의하세요
        </p>
      </div>
    </div>
  );
}
