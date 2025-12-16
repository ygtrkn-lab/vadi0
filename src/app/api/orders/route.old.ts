import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { generateOrderNumber } from '@/lib/orderNumberGenerator';

const dataFilePath = path.join(process.cwd(), 'src/data/orders.json');

// GET - Tüm siparişleri getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    
    const data = await fs.readFile(dataFilePath, 'utf-8');
    let orders = JSON.parse(data);
    
    // Müşteri ID'ye göre filtrele
    if (customerId) {
      orders = orders.filter((o: { customerId: string }) => o.customerId === customerId);
    }
    
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error reading orders:', error);
    return NextResponse.json({ orders: [] });
  }
}

// POST - Yeni sipariş ekle
export async function POST(request: NextRequest) {
  try {
    const newOrder = await request.json();
    
    let orders = [];
    try {
      const data = await fs.readFile(dataFilePath, 'utf-8');
      orders = JSON.parse(data);
    } catch {
      // Dosya yoksa boş array ile başla
    }
    
    // 6 haneli sipariş numarası generate et (100001, 100002, ...)
    const orderNumber = await generateOrderNumber();
    
    // Sipariş ID oluştur
    newOrder.id = `ord_${orderNumber}`;
    newOrder.orderNumber = orderNumber;
    newOrder.createdAt = new Date().toISOString();
    newOrder.updatedAt = new Date().toISOString();
    
    orders.push(newOrder);
    
    // Atomic write: write to temp file first, then rename
    const tempPath = dataFilePath + '.tmp';
    try {
      await fs.writeFile(tempPath, JSON.stringify(orders, null, 2), 'utf-8');
      await fs.rename(tempPath, dataFilePath);
    } catch (writeError) {
      console.error('Failed to write orders file:', writeError);
      // Clean up temp file if it exists
      try { await fs.unlink(tempPath); } catch {}
      return NextResponse.json({ error: 'Sipariş kaydedilemedi. Lütfen tekrar deneyin.' }, { status: 500 });
    }
    
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

// PUT - Sipariş güncelle
export async function PUT(request: NextRequest) {
  try {
    const updatedOrder = await request.json();
    
    const data = await fs.readFile(dataFilePath, 'utf-8');
    const orders = JSON.parse(data);
    
    const index = orders.findIndex((o: { id: string }) => o.id === updatedOrder.id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 });
    }
    
    orders[index] = { ...orders[index], ...updatedOrder, updatedAt: new Date().toISOString() };
    
    // Atomic write: write to temp file first, then rename
    const tempPath = dataFilePath + '.tmp';
    try {
      await fs.writeFile(tempPath, JSON.stringify(orders, null, 2), 'utf-8');
      await fs.rename(tempPath, dataFilePath);
    } catch (writeError) {
      console.error('Failed to write orders file:', writeError);
      // Clean up temp file if it exists
      try { await fs.unlink(tempPath); } catch {}
      return NextResponse.json({ error: 'Sipariş güncellenemedi. Lütfen tekrar deneyin.' }, { status: 500 });
    }
    
    return NextResponse.json(orders[index]);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

// DELETE - Sipariş sil
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    
    if (!orderId) {
      return NextResponse.json({ error: 'Sipariş ID gerekli.' }, { status: 400 });
    }
    
    const data = await fs.readFile(dataFilePath, 'utf-8');
    const orders = JSON.parse(data);
    
    const filteredOrders = orders.filter((o: { id: string }) => o.id !== orderId);
    
    if (filteredOrders.length === orders.length) {
      return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 });
    }
    
    // Atomic write: write to temp file first, then rename
    const tempPath = dataFilePath + '.tmp';
    try {
      await fs.writeFile(tempPath, JSON.stringify(filteredOrders, null, 2), 'utf-8');
      await fs.rename(tempPath, dataFilePath);
    } catch (writeError) {
      console.error('Failed to write orders file:', writeError);
      // Clean up temp file if it exists
      try { await fs.unlink(tempPath); } catch {}
      return NextResponse.json({ error: 'Sipariş silinemedi. Lütfen tekrar deneyin.' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
