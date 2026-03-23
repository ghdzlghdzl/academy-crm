import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getClient(accessToken?: string) {
  if (accessToken) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Service client for admin operations (bypasses RLS)
function getServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  return createClient(supabaseUrl, serviceKey);
}

// ---- Customer operations ----

export async function getCustomers(userId: string, token: string) {
  const sb = getClient(token);
  const { data, error } = await sb
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapCustomer);
}

export async function getCustomerById(customerId: string, token: string) {
  const sb = getClient(token);
  const { data, error } = await sb
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();
  if (error) throw error;
  return data ? mapCustomer(data) : null;
}

export async function createCustomer(userId: string, fields: Record<string, unknown>, token: string) {
  const sb = getClient(token);
  const { data, error } = await sb
    .from('customers')
    .insert({
      user_id: userId,
      name: fields.name || '미확인',
      phone: fields.phone || '',
      channel: fields.channel || '전화',
      assignee: fields.assignee || '',
      status: fields.status || '미컨택',
      grade: fields.grade || null,
      subject: fields.subject || null,
      preferred_time: fields.preferredTime || null,
      needs: fields.needs || null,
      current_situation: fields.currentSituation || null,
      follow_up_date: fields.followUpDate || null,
      consultation_booked: fields.consultationBooked || false,
      consultation_date: fields.consultationDate || null,
      next_action: fields.nextAction || null,
      notes: fields.notes || null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapCustomer(data);
}

export async function updateCustomer(customerId: string, fields: Record<string, unknown>, token: string) {
  const sb = getClient(token);
  const updateData: Record<string, unknown> = {};
  if (fields.name !== undefined) updateData.name = fields.name;
  if (fields.phone !== undefined) updateData.phone = fields.phone;
  if (fields.channel !== undefined) updateData.channel = fields.channel;
  if (fields.assignee !== undefined) updateData.assignee = fields.assignee;
  if (fields.status !== undefined) updateData.status = fields.status;
  if (fields.grade !== undefined) updateData.grade = fields.grade;
  if (fields.subject !== undefined) updateData.subject = fields.subject;
  if (fields.preferredTime !== undefined) updateData.preferred_time = fields.preferredTime;
  if (fields.needs !== undefined) updateData.needs = fields.needs;
  if (fields.currentSituation !== undefined) updateData.current_situation = fields.currentSituation;
  if (fields.followUpDate !== undefined) updateData.follow_up_date = fields.followUpDate;
  if (fields.consultationBooked !== undefined) updateData.consultation_booked = fields.consultationBooked;
  if (fields.consultationDate !== undefined) updateData.consultation_date = fields.consultationDate;
  if (fields.nextAction !== undefined) updateData.next_action = fields.nextAction;
  if (fields.notes !== undefined) updateData.notes = fields.notes;

  const { data, error } = await sb
    .from('customers')
    .update(updateData)
    .eq('id', customerId)
    .select()
    .single();
  if (error) throw error;
  return mapCustomer(data);
}

export async function deleteCustomer(customerId: string, token: string) {
  const sb = getClient(token);
  const { error } = await sb.from('customers').delete().eq('id', customerId);
  if (error) throw error;
}

// ---- Contact operations ----

export async function getContacts(customerId: string, token: string) {
  const sb = getClient(token);
  const { data, error } = await sb
    .from('contacts')
    .select('*')
    .eq('customer_id', customerId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapContact);
}

export async function createContact(customerId: string, userId: string, fields: Record<string, unknown>, token: string) {
  const sb = getClient(token);
  const { data, error } = await sb
    .from('contacts')
    .insert({
      customer_id: customerId,
      user_id: userId,
      type: fields.type || 'call',
      transcript: fields.transcript || null,
      memo: fields.memo || '',
      ai_generated: fields.aiGenerated || false,
      date: fields.date || new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return mapContact(data);
}

export async function updateContact(contactId: string, fields: Record<string, unknown>, token: string) {
  const sb = getClient(token);
  const updateData: Record<string, unknown> = {};
  if (fields.memo !== undefined) updateData.memo = fields.memo;

  const { data, error } = await sb
    .from('contacts')
    .update(updateData)
    .eq('id', contactId)
    .select()
    .single();
  if (error) throw error;
  return mapContact(data);
}

export async function deleteContact(contactId: string, token: string) {
  const sb = getClient(token);
  const { error } = await sb.from('contacts').delete().eq('id', contactId);
  if (error) throw error;
}

// ---- Admin operations ----

export async function createUserAccount(email: string, password: string, name: string, role: string = 'user') {
  const sb = getServiceClient();
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  });
  if (error) throw error;
  return data.user;
}

export async function listUsers() {
  const sb = getServiceClient();
  const { data, error } = await sb.from('profiles').select('*').order('created_at');
  if (error) throw error;
  return data;
}

export async function toggleUserActive(userId: string, active: boolean) {
  const sb = getServiceClient();
  const { error } = await sb.from('profiles').update({ active }).eq('id', userId);
  if (error) throw error;

  // Also ban/unban in auth
  if (!active) {
    await sb.auth.admin.updateUserById(userId, { ban_duration: '876000h' }); // ~100 years
  } else {
    await sb.auth.admin.updateUserById(userId, { ban_duration: 'none' });
  }
}

// ---- Mappers (snake_case → camelCase) ----

function mapCustomer(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string,
    channel: row.channel as string,
    createdAt: row.created_at as string,
    assignee: row.assignee as string,
    status: row.status as string,
    grade: row.grade as string | null,
    subject: row.subject as string | null,
    preferredTime: row.preferred_time as string | null,
    needs: row.needs as string | null,
    currentSituation: row.current_situation as string | null,
    followUpDate: row.follow_up_date as string | null,
    consultationBooked: row.consultation_booked as boolean,
    consultationDate: row.consultation_date as string | null,
    nextAction: row.next_action as string | null,
    notes: row.notes as string | null,
  };
}

function mapContact(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    date: row.date as string,
    type: row.type as string,
    transcript: row.transcript as string | null,
    memo: row.memo as string,
    aiGenerated: row.ai_generated as boolean,
  };
}
