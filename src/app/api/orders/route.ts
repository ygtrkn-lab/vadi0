import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase/server-client';
import { toCamelCase } from '@/lib/supabase/transformer';
import { buildTrustedOrderProducts, clampMoney } from '@/lib/server/orderTotals';
import { EmailService } from '@/lib/email/emailService';
import type { Database } from '@/lib/supabase/types';

type OrderRow = Database['public']['Tables']['orders']['Row'];

const DELIVERY_OFF_DAY_ERROR = 'Yoğunluk sebebiyle bu tarihte teslimat yapılamamaktadır. Lütfen başka bir tarih seçin.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function hasStatusEmailNotification(timeline: unknown, status: string): boolean {
  if (!Array.isArray(timeline)) return false;
  const target = status.toLowerCase();
  return timeline.some((t) => {
    if (!isRecord(t)) return false;
    const type = getString(t['type']).toLowerCase();
    const channel = getString(t['channel']).toLowerCase();
    const event = getString(t['event']).toLowerCase();
    const s = getString(t['status']).toLowerCase();
    const success = t['success'] === true;
    return type === 'notification' && channel === 'email' && event === 'order_status' && s === target && success;
  });
}

// Normalize Turkish phone numbers to 10 digits (5XXXXXXXXX)
function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('90') && digits.length >= 12) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('0') && digits.length >= 11) {
    digits = digits.slice(1);
  }
  if (digits.length > 10) {
    digits = digits.slice(0, 10);
  }
  return digits;
}

function getDeliveryFields(delivery: unknown): {
  deliveryDate?: string;
  deliveryTime?: string;
  deliveryAddress?: string;
  district?: string;
  recipientName?: string;
  recipientPhone?: string;
} {
  if (!isRecord(delivery)) return {};
  const rawPhone = getString(delivery['recipientPhone']);
  return {
    deliveryDate: getString(delivery['deliveryDate']) || undefined,
    deliveryTime: getString(delivery['deliveryTimeSlot']) || undefined,
    deliveryAddress: getString(delivery['fullAddress']) || undefined,
    district: getString(delivery['district']) || undefined,
    recipientName: getString(delivery['recipientName']) || undefined,
    recipientPhone: rawPhone ? normalizePhone(rawPhone) : undefined,
  };
}

function detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase();
  if (!ua) return 'desktop';
  if (ua.includes('ipad') || ua.includes('tablet')) return 'tablet';
  if (ua.includes('mobi') || ua.includes('iphone') || ua.includes('android')) return 'mobile';
  return 'desktop';
}

function detectBrowser(userAgent: string): { browser: string; version: string } {
  const ua = userAgent;
  const matchers: Array<{ name: string; regex: RegExp }> = [
    { name: 'Edge', regex: /Edg\/([\d.]+)/ },
    { name: 'Chrome', regex: /Chrome\/([\d.]+)/ },
    { name: 'Firefox', regex: /Firefox\/([\d.]+)/ },
    { name: 'Safari', regex: /Version\/([\d.]+).*Safari/ },
    { name: 'Opera', regex: /OPR\/([\d.]+)/ },
  ];

  for (const { name, regex } of matchers) {
    const match = ua.match(regex);
    if (match) return { browser: name, version: match[1] || '' };
  }
  return { browser: 'Bilinmiyor', version: '' };
}

// GET - Fetch orders (with optional customer filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset') || '0';
    
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' });
    
    // Filter by customer ID
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    
    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }
    
    // Pagination
    if (limit) {
      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    }
    
    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false });
    
    const { data: orders, error, count } = await query;
    
    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      orders: toCamelCase(orders) || [], 
      total: count,
      offset: parseInt(offset),
      limit: limit ? parseInt(limit) : null
    });
  } catch (error) {
    console.error('Error in GET /api/orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const newOrder = await request.json();
    
    console.log('📦 Received order data:', JSON.stringify(newOrder, null, 2));
    
    // Validate required fields
    if (!newOrder.products || !newOrder.delivery) {
      return NextResponse.json(
        { error: 'Products and delivery info are required' },
        { status: 400 }
      );
    }

    // customer_id can be NULL for guest orders (see supabase migration).
    const customerId: string | null = newOrder.customer_id || null;

    // Determine customer snapshot fields.
    // Prefer explicit values sent from client, otherwise load from customers table.
    let customerName: string = (newOrder.customer_name || '').toString();
    let customerEmail: string = (newOrder.customer_email || '').toString();
    let customerPhone: string = (newOrder.customer_phone || '').toString();

    if ((!customerName || !customerEmail || !customerPhone) && customerId) {
      const { data: customer } = await supabase
        .from('customers')
        .select('name, email, phone')
        .eq('id', customerId)
        .single();

      if (customer) {
        customerName = customerName || customer.name || '';
        customerEmail = customerEmail || customer.email || '';
        customerPhone = customerPhone || customer.phone || '';
      }
    }

    // Final fallbacks from delivery payload
    customerName = customerName || newOrder.delivery?.recipientName || '';
    customerEmail = customerEmail || '';
    customerPhone = customerPhone || newOrder.delivery?.recipientPhone || '';
    
    // Normalize customer phone to ensure consistent format (10 digits: 5XXXXXXXXX)
    if (customerPhone) {
      customerPhone = normalizePhone(customerPhone);
    }

    // Guest flag: respect explicit is_guest if provided; otherwise infer from missing customer_id
    const isGuest: boolean = typeof newOrder.is_guest === 'boolean' ? newOrder.is_guest : !customerId;

    // Timeline: if not provided, start with the initial status
    const nowIso = new Date().toISOString();
    const initialStatus = newOrder.status || 'pending';
    const timeline = Array.isArray(newOrder.timeline) && newOrder.timeline.length > 0
      ? newOrder.timeline
      : [{ status: initialStatus, timestamp: nowIso, note: initialStatus === 'pending_payment' ? 'Ödeme bekleniyor' : 'Sipariş alındı' }];
    
    // Rebuild products + subtotal from server catalog to prevent price tampering
    const { products: trustedProducts, subtotal: trustedSubtotal } = await buildTrustedOrderProducts(newOrder.products);

    const deliveryFee = clampMoney(newOrder.delivery_fee ?? 0, { min: 0, max: 1_000_000 });
    const discount = clampMoney(newOrder.discount ?? 0, { min: 0, max: trustedSubtotal + deliveryFee });
    const total = trustedSubtotal + deliveryFee - discount;

    // Server-side: block Sunday deliveries (Pazar)
    const deliveryDateStr = newOrder.delivery?.deliveryDate;
    if (deliveryDateStr) {
      const parsed = new Date(deliveryDateStr);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'Geçersiz teslimat tarihi' }, { status: 400 });
      }
      if (parsed.getUTCDay() === 0) {
        return NextResponse.json({ error: DELIVERY_OFF_DAY_ERROR }, { status: 400 });
      }

      const deliveryDateIso = parsed.toISOString().slice(0, 10);
      const { data: offDayRows, error: offDayError } = await supabase
        .from('delivery_off_days')
        .select('id')
        .eq('off_date', deliveryDateIso)
        .eq('is_active', true)
        .limit(1);

      if (offDayError) {
        console.error('Error checking delivery off days:', offDayError);
        return NextResponse.json({ error: 'Teslimat takvimi doğrulanamadı' }, { status: 500 });
      }

      if (offDayRows && offDayRows.length > 0) {
        return NextResponse.json({ error: DELIVERY_OFF_DAY_ERROR }, { status: 400 });
      }
    }

    // Build order data with only valid Supabase columns
    const userAgent = request.headers.get('user-agent') || '';
    const platform = request.headers.get('sec-ch-ua-platform') || '';
    const { browser, version } = detectBrowser(userAgent);
    const deviceType = detectDeviceType(userAgent);

    const paymentWithClient = {
      ...(newOrder.payment || {}),
      clientInfo: {
        ...(newOrder.payment?.clientInfo || newOrder.payment?.client_info),
        userAgent: userAgent || undefined,
        deviceType,
        browser,
        browserVersion: version || undefined,
        os: platform || undefined,
      },
    };

    const orderData = {
      customer_id: customerId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      is_guest: isGuest,
      products: trustedProducts,
      delivery: newOrder.delivery,
      payment: paymentWithClient,
      message: newOrder.message || null,
      subtotal: trustedSubtotal,
      discount,
      delivery_fee: deliveryFee,
      total,
      status: initialStatus,
      order_time_group: newOrder.order_time_group || null,
      timeline,
      notes: newOrder.notes || '',
      tracking_url: newOrder.tracking_url || '',
    };
    
    console.log('📦 Inserting order:', JSON.stringify(orderData, null, 2));
    
    // Insert order (order_number will be auto-generated by Supabase)
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating order:', error);
      return NextResponse.json({ error: 'Failed to create order', details: error.message }, { status: 500 });
    }

    const orderRow = data as unknown as OrderRow;
    const orderNumber = orderRow?.order_number;
    const paymentMethod = isRecord(orderData.payment) ? getString(orderData.payment.method) : '';

    // For bank transfer orders, send email immediately with bank details
    if (paymentMethod === 'bank_transfer' && customerEmail && orderNumber) {
      console.log('📧 Sending bank transfer confirmation email for order:', orderNumber);
      try {
        const deliveryFields = getDeliveryFields(orderData.delivery);
        const emailData = {
          orderNumber: String(orderNumber),
          customerName,
          customerEmail,
          customerPhone,
          verificationType: 'email' as const,
          verificationValue: customerEmail,
          items: trustedProducts.map((p: { name: string; quantity: number; price: number }) => ({
            name: p.name,
            quantity: p.quantity,
            price: p.price,
          })),
          subtotal: trustedSubtotal,
          discount,
          deliveryFee,
          total,
          deliveryAddress: deliveryFields.deliveryAddress || '',
          district: deliveryFields.district,
          deliveryDate: deliveryFields.deliveryDate || '',
          deliveryTime: deliveryFields.deliveryTime || '',
          recipientName: deliveryFields.recipientName,
          recipientPhone: deliveryFields.recipientPhone,
          paymentMethod: 'Havale/EFT',
        };
        
        const emailSent = await EmailService.sendBankTransferConfirmation(emailData);
        if (emailSent) {
          console.log('✅ Bank transfer confirmation email sent successfully');
        } else {
          console.warn('⚠️ Bank transfer confirmation email failed to send');
        }
      } catch (emailError) {
        console.error('❌ Error sending bank transfer email:', emailError);
        // Don't fail the order creation if email fails
      }
    } else {
      // Order confirmation email will be sent after payment is successful
      // See /api/payment/complete and /api/payment/webhook for email sending logic
      console.log('✅ Order created, awaiting payment confirmation:', {
        orderId: data?.id,
        orderNumber,
        status: orderRow?.status,
      });
    }
    
    // Update customer's orders array and stats (members only)
    if (data && customerId && !isGuest) {
      try {
        const { data: customerData } = await supabase
          .from('customers')
          .select('orders, order_count, total_spent')
          .eq('id', customerId)
          .single();
        
        if (customerData) {
          const orders = customerData.orders || [];
          orders.push(data.id);
          
          await supabase
            .from('customers')
            .update({ 
              orders,
              order_count: (customerData.order_count || 0) + 1,
              total_spent: (customerData.total_spent || 0) + total,
              last_order_date: new Date().toISOString()
            })
            .eq('id', customerId);
        }
      } catch (customerError) {
        console.error('Warning: Failed to update customer stats:', customerError);
        // Don't fail the order creation if customer update fails
      }
    }
    
    return NextResponse.json(toCamelCase(data), { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update order
export async function PUT(request: NextRequest) {
  try {
    const updatedOrder = await request.json();
    
    if (!updatedOrder.id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    // Load current order to detect status changes (for notifications)
    const { data: currentOrder, error: currentErr } = await supabase
      .from('orders')
      .select('id, order_number, status, customer_email, customer_name, delivery, timeline')
      .eq('id', updatedOrder.id)
      .single();

    if (currentErr) {
      console.error('Error loading current order (PUT /api/orders):', currentErr);
    }

    const oldStatus = getString(currentOrder?.status).toLowerCase();
    const nextStatus = getString(updatedOrder.status).toLowerCase();
    const statusChanged = !!nextStatus && !!oldStatus && nextStatus !== oldStatus;

    // Map camelCase payload to actual DB column names.
    // IMPORTANT: Do not snake_case nested JSON keys inside delivery/payment/products.
    const updateData: Record<string, unknown> = {};

    if (typeof updatedOrder.customerId !== 'undefined') updateData.customer_id = updatedOrder.customerId;
    if (typeof updatedOrder.customerName !== 'undefined') updateData.customer_name = updatedOrder.customerName;
    if (typeof updatedOrder.customerEmail !== 'undefined') updateData.customer_email = updatedOrder.customerEmail;
    if (typeof updatedOrder.customerPhone !== 'undefined') updateData.customer_phone = updatedOrder.customerPhone;
    if (typeof updatedOrder.isGuest !== 'undefined') updateData.is_guest = updatedOrder.isGuest;
    if (typeof updatedOrder.status !== 'undefined') updateData.status = updatedOrder.status;
    if (typeof updatedOrder.products !== 'undefined') updateData.products = updatedOrder.products;
    if (typeof updatedOrder.delivery !== 'undefined') updateData.delivery = updatedOrder.delivery;
    if (typeof updatedOrder.payment !== 'undefined') updateData.payment = updatedOrder.payment;
    if (typeof updatedOrder.message !== 'undefined') updateData.message = updatedOrder.message;
    if (typeof updatedOrder.subtotal !== 'undefined') updateData.subtotal = updatedOrder.subtotal;
    if (typeof updatedOrder.discount !== 'undefined') updateData.discount = updatedOrder.discount;
    if (typeof updatedOrder.deliveryFee !== 'undefined') updateData.delivery_fee = updatedOrder.deliveryFee;
    if (typeof updatedOrder.total !== 'undefined') updateData.total = updatedOrder.total;
    if (typeof updatedOrder.notes !== 'undefined') updateData.notes = updatedOrder.notes;
    if (typeof updatedOrder.trackingUrl !== 'undefined') updateData.tracking_url = updatedOrder.trackingUrl;
    if (typeof updatedOrder.orderTimeGroup !== 'undefined') updateData.order_time_group = updatedOrder.orderTimeGroup;
    if (typeof updatedOrder.timeline !== 'undefined') updateData.timeline = updatedOrder.timeline;

    // If status is being updated to 'delivered', set delivered_at (snake_case column)
    if (updatedOrder.status === 'delivered' && !updatedOrder.deliveredAt) {
      updateData.delivered_at = new Date().toISOString();
    }

    // Always set updated_at
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', updatedOrder.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating order:', error);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Send status update email if status changed (non-fatal)
    try {
      const allowed = new Set(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);
      if (statusChanged && allowed.has(nextStatus)) {
        const customerEmail = getString((data as OrderRow).customer_email).trim();
        const customerName = getString((data as OrderRow).customer_name).trim() || 'Değerli Müşterimiz';
        const orderNumber = String((data as OrderRow).order_number || '');

        const alreadyNotified = hasStatusEmailNotification((data as OrderRow).timeline, nextStatus);

        if (customerEmail && orderNumber && !alreadyNotified) {
          const deliveryFields = getDeliveryFields((data as OrderRow).delivery);
          const sent = await EmailService.sendOrderStatusUpdate({
            customerEmail,
            customerName,
            orderNumber,
            status: nextStatus as 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
            ...deliveryFields,
          });

          if (sent) {
            const nowIso = new Date().toISOString();
            const timelineArr = Array.isArray((data as OrderRow).timeline) ? [...((data as OrderRow).timeline as unknown[])] : [];
            timelineArr.push({
              type: 'notification',
              channel: 'email',
              event: 'order_status',
              status: nextStatus,
              timestamp: nowIso,
              success: true,
              automated: false,
            });

            // Best-effort mark in timeline to prevent duplicates
            await supabase
              .from('orders')
              .update({ timeline: timelineArr })
              .eq('id', (data as OrderRow).id)
              .eq('status', (data as OrderRow).status);
          }
        }
      }
    } catch (emailErr) {
      console.error('Order status email error (PUT /api/orders):', emailErr);
    }
    
    return NextResponse.json(toCamelCase(data));
  } catch (error) {
    console.error('Error in PUT /api/orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete order (admin only) - with backup
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    // First, fetch the order to backup
    const { data: orderToDelete, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !orderToDelete) {
      console.error('Error fetching order for backup:', fetchError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Backup to deleted_orders table
    const { error: backupError } = await supabase
      .from('deleted_orders')
      .insert({
        original_id: orderToDelete.id,
        order_number: orderToDelete.order_number,
        order_data: orderToDelete, // Store entire order as JSON
        deleted_at: new Date().toISOString(),
      });
    
    if (backupError) {
      console.error('Error backing up order:', backupError);
      // Continue with deletion even if backup fails, but log it
    }
    
    // Now delete the order
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting order:', error);
      return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, backedUp: !backupError });
  } catch (error) {
    console.error('Error in DELETE /api/orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
