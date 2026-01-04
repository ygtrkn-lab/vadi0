import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import supabaseAdmin from '@/lib/supabase/admin';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function formatOffDay(row: any) {
  return {
    id: row.id,
    offDate: row.off_date,
    note: row.note || '',
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getTodayIsoDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('all') === 'true';
    const includePast = searchParams.get('includePast') === 'true';

    let query = supabase.from('delivery_off_days').select('*');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (!includePast) {
      query = query.gte('off_date', getTodayIsoDate());
    }

    const { data, error } = await query.order('off_date', { ascending: true });

    if (error) {
      console.error('Error fetching delivery off days:', error);
      return NextResponse.json({ error: 'Off günler alınamadı' }, { status: 500 });
    }

    return NextResponse.json({
      offDays: (data || []).map(formatOffDay),
      total: data?.length || 0,
    });
  } catch (error) {
    console.error('GET /api/delivery-off-days error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
    }

    const offDate = typeof body.offDate === 'string' ? body.offDate.trim() : '';
    const note = typeof body.note === 'string' ? body.note.trim() : '';

    if (!DATE_REGEX.test(offDate)) {
      return NextResponse.json({ error: 'Geçersiz tarih formatı' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_off_days')
      .insert([
        {
          off_date: offDate,
          note,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error inserting delivery off day:', error);
      return NextResponse.json(
        { error: 'Off günü eklenemedi', details: error.message },
        { status: error.code === '23505' ? 409 : 500 }
      );
    }

    return NextResponse.json({ success: true, data: formatOffDay(data) }, { status: 201 });
  } catch (error) {
    console.error('POST /api/delivery-off-days error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
