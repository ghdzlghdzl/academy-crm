'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface UserInfo {
  id: string;
  name: string;
  role: string;
}

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (isLoginPage) return;
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, [isLoginPage]);

  // Don't show nav on login page
  if (isLoginPage) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <nav
      className="sticky top-0 z-[100] h-[52px] border-b border-apple-border"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-8 h-full flex items-center justify-between">
        {/* Left — Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-apple-sm bg-apple-dark flex items-center justify-center">
            <span className="text-white font-semibold text-[10px] tracking-wide">SBS</span>
          </div>
          <span className="font-semibold text-[15px] text-apple-text tracking-tight">SBS아카데미 분당점</span>
        </Link>

        {/* Center — Menu */}
        <div className="flex items-center gap-1">
          <NavLink href="/" active={pathname === '/'}>대시보드</NavLink>
          <NavLink href="/board" active={pathname === '/board'}>칸반 보드</NavLink>
          <NavLink href="/upload" active={pathname === '/upload'}>녹취 업로드</NavLink>
          <NavLink href="/consultation" active={pathname === '/consultation'}>상담자료</NavLink>
          {user?.role === 'admin' && (
            <NavLink href="/admin" active={pathname === '/admin'}>관리</NavLink>
          )}
        </div>

        {/* Right — User + Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/upload"
            className="btn-press inline-flex items-center gap-1.5 h-[34px] px-4 bg-apple-accent text-white text-[13px] font-medium rounded-pill hover:bg-apple-accent-hover transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            업로드
          </Link>
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-apple-sub">{user.name}</span>
              <button
                onClick={handleLogout}
                className="btn-press h-[34px] px-3 text-[13px] text-apple-hint hover:text-apple-danger rounded-apple-sm hover:bg-red-50 transition-all"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 text-[14px] transition-colors rounded-apple-sm ${
        active
          ? 'text-apple-accent font-medium'
          : 'text-apple-text hover:text-apple-accent'
      }`}
    >
      {children}
    </Link>
  );
}
