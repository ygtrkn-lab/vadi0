import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase/server-client';
import { toCamelCase } from '@/lib/supabase/transformer';

// GET - Fetch all customers or specific customer by email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (email) {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching customer:', error);
        return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
      }
      
      if (!data) return NextResponse.json(null);
      const { password: _pw, ...safeCustomer } = data as any;
      return NextResponse.json(toCamelCase(safeCustomer));
    }
    
    // Fetch all customers
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    const safeList = Array.isArray(data)
      ? data.map((c: any) => {
          const { password: _pw, ...rest } = c || {};
          return rest;
        })
      : [];

    return NextResponse.json(toCamelCase(safeList) || []);
  } catch (error) {
    console.error('Error in GET /api/customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new customer
export async function POST(request: NextRequest) {
  try {
    const newCustomer = await request.json();
    
    // Validate required fields
    if (!newCustomer.email || !newCustomer.name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }
    
    const email = newCustomer.email.toLowerCase().trim();
    
    // Check if email already exists
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existing) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kayıtlı.' },
        { status: 400 }
      );
    }
    
    // Set default values
    const customerData = {
      ...newCustomer,
      email,
      addresses: newCustomer.addresses || [],
      orders: newCustomer.orders || [],
      favorites: newCustomer.favorites || [],
    };
    
    // Insert customer
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating customer:', error);
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }
    
    const { password: _pw, ...safeCustomer } = data as any;
    return NextResponse.json(toCamelCase(safeCustomer), { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update customer
export async function PUT(request: NextRequest) {
  try {
    const updatedCustomer = await request.json();
    
    if (!updatedCustomer.id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }
    
    // Remove password from update if it's empty
    if (updatedCustomer.password === '') {
      delete updatedCustomer.password;
    }

    // IMPORTANT:
    // Update only known columns to avoid schema mismatch issues silently breaking
    // critical flows (like address saving) when the payload includes extra fields.
    const customerId = updatedCustomer.id;
    const updateData: Record<string, unknown> = {};

    if (typeof updatedCustomer.email !== 'undefined') {
      updateData.email = String(updatedCustomer.email).toLowerCase().trim();
    }
    if (typeof updatedCustomer.name !== 'undefined') updateData.name = updatedCustomer.name;
    if (typeof updatedCustomer.phone !== 'undefined') updateData.phone = updatedCustomer.phone;
    if (typeof updatedCustomer.password !== 'undefined') updateData.password = updatedCustomer.password;

    // JSON columns
    if (typeof updatedCustomer.addresses !== 'undefined') updateData.addresses = updatedCustomer.addresses;
    if (typeof updatedCustomer.orders !== 'undefined') updateData.orders = updatedCustomer.orders;
    if (typeof updatedCustomer.favorites !== 'undefined') updateData.favorites = updatedCustomer.favorites;
    if (typeof updatedCustomer.tags !== 'undefined') updateData.tags = updatedCustomer.tags;

    // Stats
    if (typeof updatedCustomer.totalSpent !== 'undefined') updateData.total_spent = updatedCustomer.totalSpent;
    if (typeof updatedCustomer.orderCount !== 'undefined') updateData.order_count = updatedCustomer.orderCount;
    if (typeof updatedCustomer.lastOrderDate !== 'undefined') updateData.last_order_date = updatedCustomer.lastOrderDate;
    if (typeof updatedCustomer.accountCredit !== 'undefined') updateData.account_credit = updatedCustomer.accountCredit;

    // Flags / misc
    if (typeof updatedCustomer.isActive !== 'undefined') updateData.is_active = updatedCustomer.isActive;
    if (typeof updatedCustomer.notes !== 'undefined') updateData.notes = updatedCustomer.notes;

    // Always set updated_at
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', customerId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating customer:', error);
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    return NextResponse.json(toCamelCase(data));
  } catch (error) {
    console.error('Error in PUT /api/customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete customer (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }
    
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting customer:', error);
      return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
