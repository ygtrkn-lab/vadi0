import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET - Fetch specific customer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (error || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    // Remove password from response
    const { password: _, ...customerData } = customer as any;
    
    return NextResponse.json(customerData);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update specific customer by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();
    
    // Remove password from update if it's empty
    if (updates.password === '') {
      delete updates.password;
    }
    
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating customer:', error);
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    // Remove password from response
    const { password: _, ...customerData } = data;
    
    return NextResponse.json(customerData);
  } catch (error) {
    console.error('Error in PUT /api/customers/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete specific customer by ID (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', params.id);
    
    if (error) {
      console.error('Error deleting customer:', error);
      return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/customers/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
