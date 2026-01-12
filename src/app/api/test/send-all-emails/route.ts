import { NextResponse } from 'next/server';
import { EmailService } from '@/lib/email/emailService';

export const dynamic = 'force-dynamic';

/**
 * Test endpoint: Tüm email şablonlarını belirtilen adrese gönderir
 * GET /api/test/send-all-emails?email=yigitraiken@gmail.com
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testEmail = searchParams.get('email') || 'yigitraiken@gmail.com';
  
  const results: Array<{ type: string; success: boolean; error?: string }> = [];
  
  // Test data
  const mockOrderNumber = 'TEST-' + Date.now().toString().slice(-6);
  const mockCustomerName = 'Test Kullanıcı';
  const mockDeliveryDate = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const mockDeliveryTime = '14:00 - 18:00';
  
  const mockItems = [
    { name: 'Kırmızı Güller Buketi', quantity: 1, price: 299.99, imageUrl: 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1/products/kirmizi-guller' },
    { name: 'Beyaz Lilyum Aranjmanı', quantity: 2, price: 189.99, imageUrl: 'https://res.cloudinary.com/dgdl1vdao/image/upload/v1/products/beyaz-lilyum' },
  ];
  
  const mockTotal = 679.97;
  const mockSubtotal = 679.97;
  const mockDeliveryFee = 0;

  try {
    // 1. OTP Email (Login)
    console.log('📧 Sending OTP Login email...');
    try {
      const otpResult = await EmailService.sendCustomerOtp({
        to: testEmail,
        code: '123456',
        purpose: 'login',
      });
      results.push({ type: 'OTP Login', success: otpResult });
    } catch (err) {
      results.push({ type: 'OTP Login', success: false, error: String(err) });
    }

    // 2. OTP Email (Register)
    console.log('📧 Sending OTP Register email...');
    try {
      const otpRegisterResult = await EmailService.sendCustomerOtp({
        to: testEmail,
        code: '654321',
        purpose: 'register',
      });
      results.push({ type: 'OTP Register', success: otpRegisterResult });
    } catch (err) {
      results.push({ type: 'OTP Register', success: false, error: String(err) });
    }

    // 3. OTP Email (Password Reset)
    console.log('📧 Sending OTP Password Reset email...');
    try {
      const otpResetResult = await EmailService.sendCustomerOtp({
        to: testEmail,
        code: '111222',
        purpose: 'password-reset',
      });
      results.push({ type: 'OTP Password Reset', success: otpResetResult });
    } catch (err) {
      results.push({ type: 'OTP Password Reset', success: false, error: String(err) });
    }

    // 4. Order Confirmation
    console.log('📧 Sending Order Confirmation email...');
    try {
      const orderConfirmResult = await EmailService.sendOrderConfirmation({
        orderNumber: mockOrderNumber,
        customerName: mockCustomerName,
        customerEmail: testEmail,
        customerPhone: '05551234567',
        items: mockItems,
        subtotal: mockSubtotal,
        deliveryFee: mockDeliveryFee,
        total: mockTotal,
        deliveryAddress: 'Atatürk Mah. Cumhuriyet Cad. No:123 Daire:5',
        district: 'Beşiktaş',
        deliveryDate: mockDeliveryDate,
        deliveryTime: mockDeliveryTime,
        recipientName: 'Sevgili Alıcı',
        recipientPhone: '05559876543',
        paymentMethod: 'Kredi Kartı',
        verificationType: 'email',
        verificationValue: testEmail,
      });
      results.push({ type: 'Order Confirmation', success: orderConfirmResult });
    } catch (err) {
      results.push({ type: 'Order Confirmation', success: false, error: String(err) });
    }

    // 5. Bank Transfer Confirmation
    console.log('📧 Sending Bank Transfer email...');
    try {
      const bankResult = await EmailService.sendBankTransferConfirmation({
        orderNumber: mockOrderNumber + '-BANK',
        customerName: mockCustomerName,
        customerEmail: testEmail,
        customerPhone: '05551234567',
        items: mockItems,
        subtotal: mockSubtotal,
        deliveryFee: mockDeliveryFee,
        total: mockTotal,
        deliveryAddress: 'Atatürk Mah. Cumhuriyet Cad. No:123 Daire:5',
        district: 'Kadıköy',
        deliveryDate: mockDeliveryDate,
        deliveryTime: mockDeliveryTime,
        recipientName: 'Havale Alıcısı',
        recipientPhone: '05559876543',
        paymentMethod: 'Havale/EFT',
        verificationType: 'email',
        verificationValue: testEmail,
      });
      results.push({ type: 'Bank Transfer Confirmation', success: bankResult });
    } catch (err) {
      results.push({ type: 'Bank Transfer Confirmation', success: false, error: String(err) });
    }

    // 6. Shipping Notification
    console.log('📧 Sending Shipping Notification email...');
    try {
      const shippingResult = await EmailService.sendShippingNotification(
        testEmail,
        mockCustomerName,
        mockOrderNumber
      );
      results.push({ type: 'Shipping Notification', success: shippingResult });
    } catch (err) {
      results.push({ type: 'Shipping Notification', success: false, error: String(err) });
    }

    // 7-15. Order Status Updates
    const statuses: Array<{
      status: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed' | 'payment_failed' | 'pending_payment' | 'refunded';
      name: string;
    }> = [
      { status: 'confirmed', name: 'Order Confirmed' },
      { status: 'processing', name: 'Order Processing' },
      { status: 'shipped', name: 'Order Shipped' },
      { status: 'delivered', name: 'Order Delivered' },
      { status: 'cancelled', name: 'Order Cancelled' },
      { status: 'failed', name: 'Order Failed' },
      { status: 'payment_failed', name: 'Payment Failed' },
      { status: 'pending_payment', name: 'Pending Payment' },
      { status: 'refunded', name: 'Order Refunded' },
    ];

    for (const { status, name } of statuses) {
      console.log(`📧 Sending ${name} email...`);
      try {
        const statusResult = await EmailService.sendOrderStatusUpdate({
          customerEmail: testEmail,
          customerName: mockCustomerName,
          orderNumber: mockOrderNumber,
          status,
          deliveryDate: mockDeliveryDate,
          deliveryTime: mockDeliveryTime,
          deliveryAddress: 'Atatürk Mah. Cumhuriyet Cad. No:123',
          district: 'Şişli',
          recipientName: 'Test Alıcı',
          recipientPhone: '05559876543',
          refundAmount: status === 'refunded' ? 679.97 : undefined,
          refundReason: status === 'refunded' ? 'Müşteri talebi' : undefined,
        });
        results.push({ type: name, success: statusResult });
      } catch (err) {
        results.push({ type: name, success: false, error: String(err) });
      }
    }

    // 16. Payment Reminder (Level 1)
    console.log('📧 Sending Payment Reminder Level 1 email...');
    try {
      const reminder1Result = await EmailService.sendPaymentReminderEmail({
        customerEmail: testEmail,
        customerName: mockCustomerName,
        orderNumber: mockOrderNumber,
        status: 'pending_payment',
        reminderCount: 1,
        items: mockItems,
        total: mockTotal,
        deliveryDate: mockDeliveryDate,
        deliveryTime: mockDeliveryTime,
        createdAt: new Date().toISOString(),
      });
      results.push({ type: 'Payment Reminder Level 1', success: reminder1Result });
    } catch (err) {
      results.push({ type: 'Payment Reminder Level 1', success: false, error: String(err) });
    }

    // 17. Payment Reminder (Level 2)
    console.log('📧 Sending Payment Reminder Level 2 email...');
    try {
      const reminder2Result = await EmailService.sendPaymentReminderEmail({
        customerEmail: testEmail,
        customerName: mockCustomerName,
        orderNumber: mockOrderNumber,
        status: 'awaiting_payment',
        reminderCount: 2,
        items: mockItems,
        total: mockTotal,
        deliveryDate: mockDeliveryDate,
        deliveryTime: mockDeliveryTime,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      });
      results.push({ type: 'Payment Reminder Level 2', success: reminder2Result });
    } catch (err) {
      results.push({ type: 'Payment Reminder Level 2', success: false, error: String(err) });
    }

    // 18. Payment Reminder (Level 3)
    console.log('📧 Sending Payment Reminder Level 3 email...');
    try {
      const reminder3Result = await EmailService.sendPaymentReminderEmail({
        customerEmail: testEmail,
        customerName: mockCustomerName,
        orderNumber: mockOrderNumber,
        status: 'pending_payment',
        reminderCount: 3,
        items: mockItems,
        total: mockTotal,
        deliveryDate: mockDeliveryDate,
        deliveryTime: mockDeliveryTime,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      });
      results.push({ type: 'Payment Reminder Level 3', success: reminder3Result });
    } catch (err) {
      results.push({ type: 'Payment Reminder Level 3', success: false, error: String(err) });
    }

    // 19. Payment Failed Reminder
    console.log('📧 Sending Payment Failed Reminder email...');
    try {
      const failedResult = await EmailService.sendPaymentReminderEmail({
        customerEmail: testEmail,
        customerName: mockCustomerName,
        orderNumber: mockOrderNumber,
        status: 'payment_failed',
        reminderCount: 1,
        items: mockItems,
        total: mockTotal,
        deliveryDate: mockDeliveryDate,
        deliveryTime: mockDeliveryTime,
        createdAt: new Date().toISOString(),
      });
      results.push({ type: 'Payment Failed Reminder', success: failedResult });
    } catch (err) {
      results.push({ type: 'Payment Failed Reminder', success: false, error: String(err) });
    }

    // 20. Review Approved Notification
    console.log('📧 Sending Review Approved email...');
    try {
      const reviewApprovedResult = await EmailService.sendReviewApprovedNotification(
        testEmail,
        mockCustomerName,
        'Kırmızı Güller Buketi',
        'https://vadiler.com/urun/kirmizi-guller-buketi#reviews'
      );
      results.push({ type: 'Review Approved', success: reviewApprovedResult });
    } catch (err) {
      results.push({ type: 'Review Approved', success: false, error: String(err) });
    }

    // 21. Seller Response Notification
    console.log('📧 Sending Seller Response email...');
    try {
      const sellerResponseResult = await EmailService.sendSellerResponseNotification(
        testEmail,
        mockCustomerName,
        'Kırmızı Güller Buketi',
        'Değerli müşterimiz, güzel yorumunuz için çok teşekkür ederiz! Sizleri memnun etmek bizim en büyük mutluluğumuz. Bir sonraki siparişinizde görüşmek üzere! 🌹',
        'https://vadiler.com/urun/kirmizi-guller-buketi#reviews'
      );
      results.push({ type: 'Seller Response', success: sellerResponseResult });
    } catch (err) {
      results.push({ type: 'Seller Response', success: false, error: String(err) });
    }

    // 22. New Review Admin Notification
    console.log('📧 Sending New Review Admin email...');
    try {
      const newReviewResult = await EmailService.sendNewReviewNotificationToAdmin(
        testEmail,
        'Kırmızı Güller Buketi',
        'Ahmet Yılmaz',
        5,
        'https://vadiler.com/yonetim/reviews'
      );
      results.push({ type: 'New Review Admin', success: newReviewResult });
    } catch (err) {
      results.push({ type: 'New Review Admin', success: false, error: String(err) });
    }

    // Summary
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `${successCount} email başarıyla gönderildi, ${failCount} hata oluştu.`,
      targetEmail: testEmail,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failCount,
      },
    });

  } catch (error) {
    console.error('Error sending test emails:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
      results,
    }, { status: 500 });
  }
}
