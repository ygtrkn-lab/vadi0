import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase/admin';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function toIntId(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const offDayId = toIntId(id);
    if (!offDayId) {
      return NextResponse.json({ error: 'Geçersiz ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof body.note === 'string') {
      updates.note = body.note.trim();
    }

    if (typeof body.isActive === 'boolean') {
      updates.is_active = body.isActive;
    }

    if (typeof body.offDate === 'string') {
      const next = body.offDate.trim();
      if (!DATE_REGEX.test(next)) {
        return NextResponse.json({ error: 'Geçersiz tarih formatı' }, { status: 400 });
      }
      updates.off_date = next;
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_off_days')
      .update(updates)
      .eq('id', offDayId)
      .select()
      .single();

    if (error) {
      console.error('Error updating delivery off day:', error);
      return NextResponse.json({ error: 'Güncellenemedi', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: formatOffDay(data) });
  } catch (error) {
    console.error('PUT /api/delivery-off-days/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const offDayId = toIntId(id);
    if (!offDayId) {
      return NextResponse.json({ error: 'Geçersiz ID' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('delivery_off_days')
      .delete()
      .eq('id', offDayId);

    if (error) {
      console.error('Error deleting delivery off day:', error);
      return NextResponse.json({ error: 'Silinemedi', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/delivery-off-days/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
