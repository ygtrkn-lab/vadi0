import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { isValidOrderNumber, parseOrderNumber } from '@/lib/orderNumberGenerator';

const ordersFilePath = path.join(process.cwd(), 'src/data/orders.json');
const customersFilePath = path.join(process.cwd(), 'src/data/customers.json');

// POST - Sipariş takibi (sipariş numarası + e-posta/telefon ile doğrulama)
export async function POST(request: NextRequest) {
  try {
    let { orderNumber, verificationType, verificationValue } = await request.json();

    if (!orderNumber || !verificationType || !verificationValue) {
      return NextResponse.json(
        { error: 'Sipariş numarası ve doğrulama bilgisi gereklidir.' },
        { status: 400 }
      );
    }

    // orderNumber string ise number'a dönüştür
    if (typeof orderNumber === 'string') {
      orderNumber = parseOrderNumber(orderNumber);
    }

    // 6 haneli formatta olup olmadığını kontrol et
    if (!isValidOrderNumber(orderNumber)) {
      return NextResponse.json(
        { error: 'Geçersiz sipariş numarası formatı.' },
        { status: 400 }
      );
    }

    // Siparişleri oku
    const ordersData = await fs.readFile(ordersFilePath, 'utf-8');
    const orders = JSON.parse(ordersData);

    // Sipariş numarasına göre bul
    const order = orders.find((o: any) => o.orderNumber === orderNumber);

    if (!order) {
      return NextResponse.json(
        { error: 'Bu sipariş numarasına ait sipariş bulunamadı.' },
        { status: 404 }
      );
    }

    console.log('Order found:', order.id, 'OrderNumber:', order.orderNumber);
    console.log('Verification attempt:', {
      type: verificationType,
      value: verificationValue,
      orderEmail: order.customerEmail,
      orderPhone: order.customerPhone,
      recipientPhone: order.delivery?.recipientPhone
    });

    // Doğrulama kontrolü
    let isVerified = false;

    if (verificationType === 'email') {
      const normalizeEmail = (email: string) => email.toLowerCase().trim();
      const inputEmail = normalizeEmail(verificationValue);
      
      // Siparişte e-posta varsa kontrol et
      if (order.customerEmail) {
        isVerified = normalizeEmail(order.customerEmail) === inputEmail;
        console.log('Email check (order):', normalizeEmail(order.customerEmail), '===', inputEmail, '→', isVerified);
      }
      // Müşteri ID'si varsa müşteri bilgilerinden kontrol et
      if (!isVerified && order.customerId) {
        const customersData = await fs.readFile(customersFilePath, 'utf-8');
        const customers = JSON.parse(customersData);
        const customer = customers.find((c: any) => c.id === order.customerId);
        if (customer && customer.email) {
          isVerified = normalizeEmail(customer.email) === inputEmail;
          console.log('Email check (customer):', normalizeEmail(customer.email), '===', inputEmail, '→', isVerified);
        }
      }
    } else if (verificationType === 'phone') {
      // Telefon numarası kontrolü - formatları normalize et
      // Tüm rakam olmayan karakterleri kaldır, ardından son 10 haneyi al
      const normalizePhone = (phone: string) => {
        const digits = phone.replace(/\D/g, '');
        // Türkiye için: 90 ile başlıyorsa kaldır, sonra son 10 hane
        if (digits.startsWith('90') && digits.length > 10) {
          return digits.slice(-10);
        }
        // 0 ile başlıyorsa kaldır
        if (digits.startsWith('0')) {
          return digits.slice(1);
        }
        return digits.slice(-10);
      };
      
      const inputPhone = normalizePhone(verificationValue);
      console.log('Normalized input phone:', inputPhone);
      
      // Teslimat alıcısı telefonu
      if (order.delivery?.recipientPhone) {
        const normalized = normalizePhone(order.delivery.recipientPhone);
        isVerified = normalized === inputPhone;
        console.log('Phone check (recipient):', normalized, '===', inputPhone, '→', isVerified);
      }
      
      // Sipariş sahibi telefonu (guest siparişler için)
      if (!isVerified && order.customerPhone) {
        const normalized = normalizePhone(order.customerPhone);
        isVerified = normalized === inputPhone;
        console.log('Phone check (customer order):', normalized, '===', inputPhone, '→', isVerified);
      }
      
      // Müşteri ID'si varsa müşteri bilgilerinden kontrol et
      if (!isVerified && order.customerId) {
        const customersData = await fs.readFile(customersFilePath, 'utf-8');
        const customers = JSON.parse(customersData);
        const customer = customers.find((c: any) => c.id === order.customerId);
        if (customer && customer.phone) {
          const normalized = normalizePhone(customer.phone);
          isVerified = normalized === inputPhone;
          console.log('Phone check (customer db):', normalized, '===', inputPhone, '→', isVerified);
        }
      }
    }

    if (!isVerified) {
      console.log('Verification failed. Order data:', {
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        recipientPhone: order.delivery?.recipientPhone,
        customerId: order.customerId
      });
      return NextResponse.json(
        { error: 'Doğrulama bilgileri sipariş ile eşleşmiyor.' },
        { status: 403 }
      );
    }

    console.log('Verification successful!');

    // Hassas bilgileri çıkar ve güvenli veri döndür
    const safeOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      deliveryDate: order.deliveryDate || order.delivery?.deliveryDate || order.createdAt,
      deliveryTimeSlot: order.deliveryTimeSlot || order.delivery?.deliveryTimeSlot || '11:00-17:00',
      recipientName: order.delivery?.recipientName || 'Alıcı',
      recipientPhone: maskPhone(order.delivery?.recipientPhone || ''),
      deliveryAddress: order.delivery?.fullAddress || '',
      district: order.delivery?.district || '',
      items: (order.products || []).map((item: any) => ({
        productId: item.productId || item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
      })),
      subtotal: order.subtotal || 0,
      deliveryFee: order.deliveryFee || 0,
      discount: order.discount || 0,
      total: order.total || 0,
      paymentMethod: order.payment?.method || order.paymentMethod || 'credit_card',
      cardMessage: order.message?.content || order.cardMessage || order.note,
      senderName: order.message?.senderName || order.senderName,
    };

    return NextResponse.json(safeOrder);
  } catch (error) {
    console.error('Error tracking order:', error);
    return NextResponse.json(
      { error: 'Sipariş sorgulanırken bir hata oluştu.' },
      { status: 500 }
    );
  }
}

// Telefon numarasını maskele (5XX XXX XX XX -> 5XX XXX ** **)
function maskPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return phone;
  const last10 = digits.slice(-10);
  return `${last10.slice(0, 3)} ${last10.slice(3, 6)} ** **`;
}
