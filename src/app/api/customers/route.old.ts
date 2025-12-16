import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src/data/customers.json');

// GET - Tüm müşterileri getir
export async function GET() {
  try {
    const data = await fs.readFile(dataFilePath, 'utf-8');
    const customers = JSON.parse(data);
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error reading customers:', error);
    // Return empty array if file cannot be read
    return NextResponse.json([], { status: 200 });
  }
}

// POST - Yeni müşteri ekle
export async function POST(request: NextRequest) {
  try {
    const newCustomer = await request.json();

    // Basic validation
    if (!newCustomer || typeof newCustomer.email !== 'string' || !newCustomer.email.trim()) {
      return NextResponse.json({ error: 'Geçerli bir e-posta adresi giriniz.' }, { status: 400 });
    }

    const email = newCustomer.email.toLowerCase().trim();

    // Read existing customers with fallback
    let customers = [] as any[];
    try {
      const data = await fs.readFile(dataFilePath, 'utf-8');
      customers = JSON.parse(data);
    } catch (err) {
      // If the file cannot be read or parsed, start with an empty array
      customers = [];
    }

    // Check for existing email (defensive)
    const existingCustomer = customers.find(
      (c: any) => c && c.email && typeof c.email === 'string' && c.email.toLowerCase() === email
    );

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kayıtlı.' },
        { status: 400 }
      );
    }

    // Populate default fields
    const id = newCustomer.id || 'cust_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    const now = new Date().toISOString();

    const customerToInsert = {
      ...newCustomer,
      id,
      email: email,
      createdAt: newCustomer.createdAt || now,
      updatedAt: now,
      addresses: newCustomer.addresses || [],
      orders: newCustomer.orders || [],
      favorites: newCustomer.favorites || [],
      totalSpent: newCustomer.totalSpent || 0,
      orderCount: newCustomer.orderCount || 0,
      lastOrderDate: newCustomer.lastOrderDate || null,
      accountCredit: newCustomer.accountCredit || 0,
      isActive: typeof newCustomer.isActive === 'boolean' ? newCustomer.isActive : true,
      notes: newCustomer.notes || '',
      tags: newCustomer.tags || [],
    };

    customers.push(customerToInsert);
    
    // Atomic write: write to temp file first, then rename
    const tempPath = dataFilePath + '.tmp';
    try {
      await fs.writeFile(tempPath, JSON.stringify(customers, null, 2), 'utf-8');
      await fs.rename(tempPath, dataFilePath);
    } catch (writeError) {
      console.error('Failed to write customers file:', writeError);
      // Clean up temp file if it exists
      try { await fs.unlink(tempPath); } catch {}
      return NextResponse.json({ error: 'Veriler kaydedilemedi. Lütfen tekrar deneyin.' }, { status: 500 });
    }

    return NextResponse.json(customerToInsert, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}

// PUT - Müşteri güncelle
export async function PUT(request: NextRequest) {
  try {
    const updatedCustomer = await request.json();
    if (!updatedCustomer || typeof updatedCustomer.id !== 'string') {
      return NextResponse.json({ error: 'Geçerli müşteri bilgisi sağlanmadı.' }, { status: 400 });
    }

    let customers = [] as any[];
    try {
      const data = await fs.readFile(dataFilePath, 'utf-8');
      customers = JSON.parse(data);
    } catch (err) {
      customers = [];
    }
    
    const index = customers.findIndex((c: { id: string }) => c.id === updatedCustomer.id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Müşteri bulunamadı.' }, { status: 404 });
    }
    
    customers[index] = { ...customers[index], ...updatedCustomer, updatedAt: new Date().toISOString() };
    
    // Atomic write: write to temp file first, then rename
    const tempPath = dataFilePath + '.tmp';
    try {
      await fs.writeFile(tempPath, JSON.stringify(customers, null, 2), 'utf-8');
      await fs.rename(tempPath, dataFilePath);
    } catch (writeError) {
      console.error('Failed to write customers file:', writeError);
      // Clean up temp file if it exists
      try { await fs.unlink(tempPath); } catch {}
      return NextResponse.json({ error: 'Veriler kaydedilemedi. Lütfen tekrar deneyin.' }, { status: 500 });
    }
    
    return NextResponse.json(customers[index]);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}
