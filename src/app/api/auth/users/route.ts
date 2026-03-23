import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer, createServiceClient } from '@/lib/supabase-server';

async function getAdminUser() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const service = createServiceClient();
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') return null;

  return user;
}

// GET — list all users (admin only)
export async function GET() {
  try {
    const user = await getAdminUser();
    if (!user) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });

    const service = createServiceClient();
    const { data, error } = await service.from('profiles').select('*').order('created_at');
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '사용자 목록 조회 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST — create new user account (admin only)
export async function POST(req: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });

    const { email, password, name, role } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: '아이디, 비밀번호, 이름은 필수입니다.' }, { status: 400 });
    }

    const service = createServiceClient();
    const userRole = role || 'user';

    // 1. Create auth user
    const { data, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: userRole },
    });
    if (error) throw error;

    // 2. Manually create profile (trigger not used)
    await service.from('profiles').insert({
      id: data.user.id,
      email,
      name,
      role: userRole,
    });

    return NextResponse.json({ user: data.user }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '계정 생성 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH — toggle user active/inactive (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });

    const { userId, active } = await req.json();
    if (!userId || active === undefined) {
      return NextResponse.json({ error: 'userId와 active 값이 필요합니다.' }, { status: 400 });
    }

    const service = createServiceClient();
    const { error } = await service.from('profiles').update({ active }).eq('id', userId);
    if (error) throw error;

    if (!active) {
      await service.auth.admin.updateUserById(userId, { ban_duration: '876000h' });
    } else {
      await service.auth.admin.updateUserById(userId, { ban_duration: 'none' });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '처리 실패';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
