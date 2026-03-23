'use client';

import { useEffect, useState } from 'react';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  created_at: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', name: '', role: 'user' });
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.status === 403) {
        setError('관리자 권한이 필요합니다.');
        return;
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUsers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '사용자 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, email: `${formData.username}@sbs.academy` }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFormData({ username: '', password: '', name: '', role: 'user' });
      setShowForm(false);
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '계정 생성 실패');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    const action = currentActive ? '비활성화' : '활성화';
    if (!confirm(`이 계정을 ${action}하시겠습니까?`)) return;
    try {
      const res = await fetch('/api/auth/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, active: !currentActive }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await fetchUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '처리 실패');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-apple-accent border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-8 animate-fade-up animate-fade-up-1">
        <div>
          <h1 className="text-title text-apple-text">계정 관리</h1>
          <p className="text-caption-text text-apple-sub mt-1">영업팀 계정을 생성하고 관리합니다</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-press h-[40px] px-5 bg-apple-accent text-white text-[14px] font-medium rounded-pill hover:bg-apple-accent-hover transition-all"
        >
          {showForm ? '취소' : '+ 새 계정'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-apple-lg bg-red-50 text-apple-danger text-[14px]">{error}</div>
      )}

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-apple-xl shadow-card p-7 mb-6 animate-fade-up animate-fade-up-1">
          <h2 className="text-headline text-apple-text mb-5">새 계정 생성</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-label-text text-apple-accent uppercase tracking-wider">이름</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="홍길동"
                className="w-full mt-1.5 h-[44px] px-3 border border-apple-border rounded-apple-md text-[14px] focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all"
              />
            </div>
            <div>
              <label className="text-label-text text-apple-accent uppercase tracking-wider">아이디</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                placeholder="로그인에 사용할 아이디"
                className="w-full mt-1.5 h-[44px] px-3 border border-apple-border rounded-apple-md text-[14px] focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all"
              />
            </div>
            <div>
              <label className="text-label-text text-apple-accent uppercase tracking-wider">비밀번호</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                placeholder="6자 이상"
                className="w-full mt-1.5 h-[44px] px-3 border border-apple-border rounded-apple-md text-[14px] focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all"
              />
            </div>
            <div>
              <label className="text-label-text text-apple-accent uppercase tracking-wider">권한</label>
              <select
                value={formData.role}
                onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}
                className="w-full mt-1.5 h-[44px] px-3 border border-apple-border rounded-apple-md text-[14px] focus:outline-none focus:border-apple-accent focus:ring-[3px] focus:ring-apple-accent-light transition-all"
              >
                <option value="user">일반 사용자</option>
                <option value="admin">관리자</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="btn-press mt-5 h-[40px] px-6 bg-apple-accent text-white text-[14px] font-medium rounded-pill hover:bg-apple-accent-hover disabled:opacity-40 transition-all"
          >
            {creating ? '생성 중...' : '계정 생성'}
          </button>
        </form>
      )}

      {/* User List */}
      <div className="bg-white rounded-apple-xl shadow-card overflow-hidden animate-fade-up animate-fade-up-2">
        <div className="px-7 py-5 border-b border-apple-border">
          <h2 className="text-headline text-apple-text">
            등록된 사용자
            <span className="ml-2 text-caption-text font-normal text-apple-hint">{users.length}명</span>
          </h2>
        </div>
        <div>
          {users.length === 0 ? (
            <div className="px-7 py-12 text-center text-apple-hint text-[15px]">등록된 사용자가 없습니다.</div>
          ) : (
            users.map(user => (
              <div key={user.id} className="flex items-center justify-between px-7 py-4 border-b border-apple-border last:border-b-0 hover:bg-apple-hover transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-medium ${
                    user.active ? 'bg-apple-accent-light text-apple-accent' : 'bg-apple-hover text-apple-hint'
                  }`}>
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-medium text-apple-text">{user.name}</span>
                      {user.role === 'admin' && (
                        <span className="h-[20px] px-2 rounded-pill bg-status-registered-bg text-status-registered text-[11px] font-medium flex items-center">관리자</span>
                      )}
                      {!user.active && (
                        <span className="h-[20px] px-2 rounded-pill bg-status-hold-bg text-status-hold text-[11px] font-medium flex items-center">비활성</span>
                      )}
                    </div>
                    <div className="text-caption-text text-apple-sub">{user.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleActive(user.id, user.active)}
                  className={`btn-press h-[32px] px-4 text-[12px] font-medium rounded-pill border transition-all ${
                    user.active
                      ? 'border-apple-border text-apple-sub hover:bg-red-50 hover:text-apple-danger hover:border-apple-danger'
                      : 'border-status-booked text-status-booked hover:bg-status-booked-bg'
                  }`}
                >
                  {user.active ? '비활성화' : '활성화'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
