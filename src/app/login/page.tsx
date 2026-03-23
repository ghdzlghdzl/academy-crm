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
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      {/* Logo Area */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-2xl bg-blue-600 mb-6">
          <span className="text-white text-2xl font-bold tracking-tight">SBS</span>
        </div>
        <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight">로그인</h1>
        <p className="text-[15px] text-gray-500 mt-2">SBS아카데미 분당점 영업관리</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[440px] border border-gray-200 rounded-2xl p-10 shadow-sm">
        {/* Error Message */}
        {error && (
          <div className="mb-5 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            <span className="text-[13px] text-red-600">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">아이디</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              required
              autoFocus
              className="w-full h-[52px] px-4 border border-gray-300 rounded-xl text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              className="w-full h-[52px] px-4 border border-gray-300 rounded-xl text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] bg-blue-600 text-white font-semibold text-[15px] rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                로그인 중...
              </span>
            ) : '로그인'}
          </button>
        </form>

        <p className="text-center text-[12px] text-gray-400 mt-6">
          계정이 없으시면 관리자에게 문의하세요
        </p>
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center gap-4 text-[12px] text-gray-400">
        <span>SBS아카데미컴퓨터아트학원</span>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <span>분당점</span>
      </div>
    </div>
  );
}
