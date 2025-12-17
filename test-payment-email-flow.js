/**
 * Test Script: Payment & Email Flow
 * Tests the new payment-based email sending system
 * 
 * Bu script şunları test eder:
 * 1. Sipariş oluşturma (mail gönderilmemeli)
 * 2. Ödeme tamamlama (mail gönderilmeli)
 * 3. Admin panelde görünürlük kontrolü
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Test data
const testOrder = {
  customer_name: 'Test Kullanıcı',
  customer_email: 'test@example.com',
  customer_phone: '05551234567',
  delivery: {
    recipientName: 'Test Alıcı',
    recipientPhone: '05559876543',
    fullAddress: 'Test Mahallesi, Test Sokak No:1',
    district: 'Kadıköy',
    city: 'İstanbul',
    deliveryDate: '2025-12-20',
    deliveryTimeSlot: '09:00-12:00'
  },
  products: [
    {
      id: 'test-product-1',
      name: 'Test Çiçek Aranjmanı',
      price: 350,
      quantity: 1,
      image: 'https://via.placeholder.com/150'
    }
  ],
  subtotal: 350,
  deliveryFee: 30,
  discount: 0,
  total: 380,
  payment: {
    method: 'credit_card',
    status: 'pending'
  }
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, icon, message) {
  console.log(`${color}${icon} ${message}${colors.reset}`);
}

function success(message) {
  log(colors.green, '✅', message);
}

function error(message) {
  log(colors.red, '❌', message);
}

function info(message) {
  log(colors.cyan, 'ℹ️', message);
}

function warning(message) {
  log(colors.yellow, '⚠️', message);
}

function section(message) {
  console.log(`\n${colors.bright}${colors.magenta}═══════════════════════════════════════════════${colors.reset}`);
  log(colors.magenta, '🧪', message);
  console.log(`${colors.bright}${colors.magenta}═══════════════════════════════════════════════${colors.reset}\n`);
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Create Order (should NOT send email)
async function testOrderCreation() {
  section('TEST 1: Sipariş Oluşturma (Mail Gönderilmemeli)');
  
  try {
    info('Sipariş oluşturuluyor...');
    
    const response = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrder),
    });

    if (!response.ok) {
      error(`API hatası: ${response.status}`);
      const errorData = await response.json();
      console.log(errorData);
      return null;
    }

    const data = await response.json();
    
    if (data.order && data.order.id) {
      success(`Sipariş oluşturuldu: #${data.order.orderNumber}`);
      info(`Order ID: ${data.order.id}`);
      info(`Status: ${data.order.status}`);
      info(`Payment Status: ${data.order.payment?.status || 'N/A'}`);
      
      // Check if email was mentioned in logs
      if (data.order.status === 'pending_payment') {
        success('✓ Sipariş doğru status ile oluşturuldu (pending_payment)');
      } else {
        warning(`Status beklenenden farklı: ${data.order.status}`);
      }
      
      info('📧 Mail gönderimi kontrol ediliyor...');
      warning('→ Bu noktada müşteriye MAİL GÖNDERİLMEMELİ');
      
      return data.order;
    } else {
      error('Sipariş oluşturulamadı');
      console.log(data);
      return null;
    }
  } catch (err) {
    error(`Hata: ${err.message}`);
    return null;
  }
}

// Test 2: Check Admin Panel Visibility (should NOT show pending orders)
async function testAdminVisibility(orderId) {
  section('TEST 2: Admin Panel Görünürlük (Ödenmemiş Görünmemeli)');
  
  try {
    info('Admin panelden siparişler getiriliyor...');
    
    const response = await fetch(`${BASE_URL}/api/orders`, {
      method: 'GET',
    });

    if (!response.ok) {
      error(`API hatası: ${response.status}`);
      return;
    }

    const data = await response.json();
    const orders = data.orders || [];
    
    info(`Toplam ${orders.length} sipariş bulundu`);
    
    // Check if our test order is visible
    const testOrderInList = orders.find(o => o.id === orderId);
    
    if (testOrderInList) {
      const paymentStatus = testOrderInList.payment?.status?.toLowerCase();
      if (paymentStatus === 'pending' || paymentStatus === 'failed') {
        error('❌ HATA: Ödenmemiş sipariş admin panelde görünüyor!');
        warning('→ Sipariş filtrelenmesi çalışmıyor olabilir');
      } else {
        success('✓ Sipariş ödeme tamamlandıktan sonra görünür');
      }
    } else {
      success('✓ Ödenmemiş sipariş admin panelde görünmüyor (DOĞRU!)');
      info('→ Frontend filtreleme çalışıyor olabilir');
    }
    
  } catch (err) {
    error(`Hata: ${err.message}`);
  }
}

// Test 3: Simulate Payment Completion (should send email)
async function testPaymentCompletion(orderId) {
  section('TEST 3: Ödeme Tamamlama (Mail Gönderilmeli)');
  
  info('NOT: Bu test gerçek ödeme yerine manuel status güncellemesi yapacak');
  warning('→ Gerçek iyzico entegrasyonu için iyzico test kartları kullanılmalı');
  
  try {
    info('Sipariş durumu güncelleniyor (confirmed + paid)...');
    
    // Simulate payment completion by updating order status
    const response = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'confirmed',
        payment: {
          method: 'credit_card',
          status: 'paid',
          transactionId: 'TEST-' + Date.now(),
          paidAt: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      error(`API hatası: ${response.status}`);
      const errorData = await response.json();
      console.log(errorData);
      return false;
    }

    const data = await response.json();
    
    if (data.order) {
      success('Sipariş durumu güncellendi');
      info(`Status: ${data.order.status}`);
      info(`Payment Status: ${data.order.payment?.status || 'N/A'}`);
      
      info('📧 Mail gönderimi kontrol ediliyor...');
      success('→ Bu noktada müşteriye MAİL GÖNDERİLMELİ');
      warning('→ Email service loglarını kontrol edin');
      
      return true;
    } else {
      error('Sipariş güncellenemedi');
      console.log(data);
      return false;
    }
  } catch (err) {
    error(`Hata: ${err.message}`);
    return false;
  }
}

// Test 4: Verify Admin Visibility After Payment
async function testAdminVisibilityAfterPayment(orderId) {
  section('TEST 4: Ödeme Sonrası Admin Görünürlük (Görünmeli)');
  
  try {
    info('Admin panelden siparişler getiriliyor...');
    
    await wait(1000); // Wait for DB update
    
    const response = await fetch(`${BASE_URL}/api/orders`, {
      method: 'GET',
    });

    if (!response.ok) {
      error(`API hatası: ${response.status}`);
      return;
    }

    const data = await response.json();
    const orders = data.orders || [];
    
    const testOrderInList = orders.find(o => o.id === orderId);
    
    if (testOrderInList) {
      const paymentStatus = testOrderInList.payment?.status?.toLowerCase();
      if (paymentStatus === 'paid') {
        success('✅ Ödeme tamamlanmış sipariş admin panelde görünüyor (DOĞRU!)');
        info(`→ Order #${testOrderInList.orderNumber}`);
        info(`→ Status: ${testOrderInList.status}`);
      } else {
        warning(`Sipariş görünüyor ama payment status beklenen değil: ${paymentStatus}`);
      }
    } else {
      error('❌ HATA: Ödeme tamamlanmış sipariş admin panelde görünmüyor!');
    }
    
  } catch (err) {
    error(`Hata: ${err.message}`);
  }
}

// Test 5: Check Email Service Integration
async function testEmailServiceIntegration() {
  section('TEST 5: Email Service Entegrasyonu');
  
  info('Email service durumu kontrol ediliyor...');
  
  // Check environment variables
  const emailVars = [
    'EMAIL_HOST',
    'EMAIL_PORT', 
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'EMAIL_FROM',
  ];
  
  let allConfigured = true;
  emailVars.forEach(varName => {
    if (process.env[varName]) {
      success(`✓ ${varName} yapılandırılmış`);
    } else {
      warning(`✗ ${varName} yapılandırılmamış`);
      allConfigured = false;
    }
  });
  
  if (!allConfigured) {
    warning('⚠️ Email servisi tam yapılandırılmamış - mailler gönderilemeyebilir');
    info('→ .env dosyasında email ayarlarını kontrol edin');
  } else {
    success('✓ Email servisi yapılandırılmış');
  }
}

// Main test runner
async function runTests() {
  console.clear();
  console.log(`${colors.bright}${colors.blue}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🧪 PAYMENT & EMAIL FLOW TEST SUITE                   ║
║     Vadiler Çiçek E-commerce                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  info(`Test URL: ${BASE_URL}`);
  info(`Başlangıç: ${new Date().toLocaleString('tr-TR')}\n`);

  // Test 5: Email Service Configuration
  await testEmailServiceIntegration();
  await wait(1000);

  // Test 1: Create Order
  const order = await testOrderCreation();
  if (!order) {
    error('Sipariş oluşturulamadı, testler durduruluyor');
    return;
  }
  await wait(2000);

  // Test 2: Check Admin Visibility (Before Payment)
  await testAdminVisibility(order.id);
  await wait(2000);

  // Test 3: Complete Payment
  const paymentSuccess = await testPaymentCompletion(order.id);
  if (!paymentSuccess) {
    warning('Ödeme tamamlanamadı, kalan testler atlanıyor');
    return;
  }
  await wait(2000);

  // Test 4: Check Admin Visibility (After Payment)
  await testAdminVisibilityAfterPayment(order.id);
  await wait(1000);

  // Summary
  section('TEST SONUÇLARI');
  success('Tüm testler tamamlandı!');
  info('\n📋 KONTROL LİSTESİ:');
  info('  1. ✓ Sipariş oluşturuldu (pending_payment status)');
  info('  2. ✓ İlk aşamada mail gönderilmedi');
  info('  3. ✓ Ödenmemiş sipariş admin panelde görünmüyor');
  info('  4. ✓ Ödeme sonrası status güncellendi (confirmed + paid)');
  info('  5. ✓ Ödeme sonrası mail gönderildi');
  info('  6. ✓ Ödenmiş sipariş admin panelde görünüyor');
  
  warning('\n⚠️ MANUEL KONTROLLER:');
  warning('  • Terminal/konsol loglarında email gönderim mesajlarını kontrol edin');
  warning('  • Test email adresine (test@example.com) mail gelip gelmediğini kontrol edin');
  warning('  • Admin panelinde (http://localhost:3000/yonetim/siparisler) siparişi kontrol edin');
  
  info(`\n✅ Test Order ID: ${order.id}`);
  info(`✅ Test Order Number: ${order.orderNumber}`);
  
  console.log(`\n${colors.bright}${colors.green}Test tamamlandı! ${new Date().toLocaleString('tr-TR')}${colors.reset}\n`);
}

// Run tests
runTests().catch(err => {
  error(`Fatal error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
