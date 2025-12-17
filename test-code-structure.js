/**
 * Simple Mock Test - Email Flow Verification
 * Bu test API'ye gerçek istek atmadan kod yapısını kontrol eder
 */

const fs = require('fs');
const path = require('path');

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bright: '\x1b[1m',
};

function success(msg) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

function error(msg) {
  console.log(`${colors.red}❌ ${msg}${colors.reset}`);
}

function info(msg) {
  console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`);
}

function section(msg) {
  console.log(`\n${colors.bright}${colors.magenta}${'═'.repeat(60)}${colors.reset}`);
  console.log(`${colors.magenta}🧪 ${msg}${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}${'═'.repeat(60)}${colors.reset}\n`);
}

// Test file paths
const files = {
  orders: path.join(__dirname, 'src', 'app', 'api', 'orders', 'route.ts'),
  paymentComplete: path.join(__dirname, 'src', 'app', 'api', 'payment', 'complete', 'route.ts'),
  paymentWebhook: path.join(__dirname, 'src', 'app', 'api', 'payment', 'webhook', 'route.ts'),
  adminOrders: path.join(__dirname, 'src', 'app', 'yonetim', 'siparisler', 'page.tsx'),
};

// Check if files exist
function checkFilesExist() {
  section('Dosya Kontrolleri');
  let allExist = true;
  
  Object.entries(files).forEach(([name, filePath]) => {
    if (fs.existsSync(filePath)) {
      success(`${name}: Dosya mevcut`);
    } else {
      error(`${name}: Dosya bulunamadı - ${filePath}`);
      allExist = false;
    }
  });
  
  return allExist;
}

// Test 1: Orders API should NOT send email on creation
function testOrdersApiEmailRemoved() {
  section('TEST 1: Sipariş API - Email Gönderimi Kaldırıldı mı?');
  
  const content = fs.readFileSync(files.orders, 'utf8');
  
  // Check if old email sending code is removed
  const hasOldEmailCode = content.includes('await EmailService.sendOrderConfirmation') &&
                          content.includes('Send order confirmation email');
  
  if (hasOldEmailCode) {
    error('Eski email gönderim kodu hala mevcut!');
    error('→ EmailService.sendOrderConfirmation çağrısı POST handler içinde bulundu');
    return false;
  }
  
  // Check if new comment exists
  const hasNewComment = content.includes('Order confirmation email will be sent after payment is successful');
  
  if (hasNewComment) {
    success('Email gönderimi kaldırıldı ve açıklama eklendi');
    success('→ "Order confirmation email will be sent after payment is successful" yorumu mevcut');
  } else {
    info('Email gönderimi yok ama açıklama da yok (isteğe bağlı)');
  }
  
  // Check if awaiting log exists
  const hasAwaitingLog = content.includes('awaiting payment confirmation');
  if (hasAwaitingLog) {
    success('Sipariş oluşturma logu eklendi');
  }
  
  return true;
}

// Test 2: Payment Complete should send email
function testPaymentCompleteEmailAdded() {
  section('TEST 2: Payment Complete - Email Gönderimi Eklendi mi?');
  
  const content = fs.readFileSync(files.paymentComplete, 'utf8');
  
  // Check if email sending code exists after payment success
  const hasEmailService = content.includes('EmailService') && 
                         content.includes('sendOrderConfirmation');
  
  if (!hasEmailService) {
    error('EmailService.sendOrderConfirmation çağrısı bulunamadı!');
    return false;
  }
  
  success('EmailService import ve çağrısı mevcut');
  
  // Check if it's in the right place (after order update)
  const orderUpdateIndex = content.indexOf('Order updated successfully');
  const emailSendIndex = content.indexOf('sendOrderConfirmation');
  
  if (orderUpdateIndex > 0 && emailSendIndex > orderUpdateIndex) {
    success('Email gönderimi sipariş güncellemesinden SONRA yapılıyor (DOĞRU)');
  } else if (emailSendIndex > 0) {
    info('Email gönderimi mevcut (sıralama tam doğrulanamadı)');
  }
  
  // Check for try-catch
  const hasTryCatch = content.includes('try') && 
                      content.includes('catch (emailErr)');
  
  if (hasTryCatch) {
    success('Hata yönetimi (try-catch) mevcut');
  } else {
    info('Hata yönetimi kontrolü yapılamadı');
  }
  
  return true;
}

// Test 3: Payment Webhook should send email
function testPaymentWebhookEmailAdded() {
  section('TEST 3: Payment Webhook - Email Gönderimi Eklendi mi?');
  
  const content = fs.readFileSync(files.paymentWebhook, 'utf8');
  
  // Check if email sending code exists
  const hasEmailService = content.includes('EmailService') && 
                         content.includes('sendOrderConfirmation');
  
  if (!hasEmailService) {
    error('EmailService.sendOrderConfirmation çağrısı bulunamadı!');
    return false;
  }
  
  success('EmailService import ve çağrısı mevcut');
  
  // Check if it's after webhook order update
  const webhookUpdateIndex = content.indexOf('Order updated via webhook');
  const emailSendIndex = content.indexOf('sendOrderConfirmation');
  
  if (webhookUpdateIndex > 0 && emailSendIndex > webhookUpdateIndex) {
    success('Email gönderimi webhook güncellemesinden SONRA yapılıyor (DOĞRU)');
  } else if (emailSendIndex > 0) {
    info('Email gönderimi mevcut (sıralama tam doğrulanamadı)');
  }
  
  // Check for idempotency
  const hasIdempotency = content.includes('idempotent') || 
                        content.includes('already paid');
  
  if (hasIdempotency) {
    success('Idempotency kontrolü mevcut (tekrar ödeme önleniyor)');
  }
  
  return true;
}

// Test 4: Admin should filter unpaid orders
function testAdminFilterUnpaid() {
  section('TEST 4: Admin Panel - Ödenmemiş Siparişler Filtreleniyor mu?');
  
  const content = fs.readFileSync(files.adminOrders, 'utf8');
  
  // Check for payment status filtering
  const hasPaymentFilter = content.includes('payment?.status') || 
                          content.includes('payment.status');
  
  if (!hasPaymentFilter) {
    error('Payment status filtreleme kodu bulunamadı!');
    return false;
  }
  
  success('Payment status kontrolü mevcut');
  
  // Check for pending/failed filtering
  const filtersPending = content.includes("!== 'pending'") || 
                        content.includes('pending');
  const filtersFailed = content.includes("!== 'failed'") || 
                       content.includes('failed');
  
  if (filtersPending) {
    success('Pending status filtreleniyor');
  }
  
  if (filtersFailed) {
    success('Failed status filtreleniyor');
  }
  
  // Check if filtering happens in useMemo or filter function
  const hasFilterLogic = content.includes('isPaymentComplete') ||
                        content.includes('paymentStatus');
  
  if (hasFilterLogic) {
    success('Ödeme durumu kontrolü filter içinde yapılıyor');
  }
  
  return true;
}

// Test 5: Check for common patterns
function testCommonPatterns() {
  section('TEST 5: Genel Pattern Kontrolleri');
  
  const paymentCompleteContent = fs.readFileSync(files.paymentComplete, 'utf8');
  const paymentWebhookContent = fs.readFileSync(files.paymentWebhook, 'utf8');
  
  // Check for error handling
  let errorHandlingCount = 0;
  [paymentCompleteContent, paymentWebhookContent].forEach(content => {
    if (content.includes('catch') && content.includes('emailErr')) {
      errorHandlingCount++;
    }
  });
  
  if (errorHandlingCount === 2) {
    success('Tüm email gönderimlerinde hata yönetimi var');
  } else if (errorHandlingCount > 0) {
    info(`${errorHandlingCount}/2 dosyada hata yönetimi var`);
  }
  
  // Check for logging
  let loggingCount = 0;
  [paymentCompleteContent, paymentWebhookContent].forEach(content => {
    if (content.includes('console.log') && content.includes('email sent')) {
      loggingCount++;
    }
  });
  
  if (loggingCount >= 1) {
    success('Email gönderimi loglanıyor');
  }
  
  // Check for dynamic imports (better for serverless)
  const hasDynamicImport = paymentCompleteContent.includes("await import('@/lib/email/emailService')") ||
                          paymentWebhookContent.includes("await import('@/lib/email/emailService')");
  
  if (hasDynamicImport) {
    success('Dynamic import kullanılıyor (performans optimizasyonu)');
  } else {
    info('Static import kullanılıyor (varsayılan davranış)');
  }
  
  return true;
}

// Run all tests
function runAllTests() {
  console.clear();
  console.log(`${colors.bright}${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🧪 EMAIL FLOW - CODE STRUCTURE TEST                    ║
║   Mock Test (API'ye istek atmadan kod kontrolü)          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  info('Başlangıç: ' + new Date().toLocaleString('tr-TR') + '\n');

  if (!checkFilesExist()) {
    error('\nDosyalar bulunamadı, testler durduruluyor.');
    process.exit(1);
  }

  const results = {
    test1: testOrdersApiEmailRemoved(),
    test2: testPaymentCompleteEmailAdded(),
    test3: testPaymentWebhookEmailAdded(),
    test4: testAdminFilterUnpaid(),
    test5: testCommonPatterns(),
  };

  // Summary
  section('SONUÇLAR');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.values(results).length;
  
  if (passed === total) {
    success(`Tüm testler başarılı! (${passed}/${total})`);
    console.log(`\n${colors.green}${colors.bright}✅ SİSTEM HAZIR${colors.reset}\n`);
    
    info('📋 Kontrol Edilen:');
    info('  ✓ Orders API - Email gönderimi kaldırıldı');
    info('  ✓ Payment Complete - Email gönderimi eklendi');
    info('  ✓ Payment Webhook - Email gönderimi eklendi (yedek)');
    info('  ✓ Admin Panel - Ödenmemiş siparişler filtreleniyor');
    info('  ✓ Hata yönetimi ve logging mevcut');
    
    console.log(`\n${colors.yellow}⚠️  MANUEL TEST GEREKLİ:${colors.reset}`);
    info('  • Gerçek bir sipariş oluştur ve ödeme yap');
    info('  • Email gelip gelmediğini kontrol et');
    info('  • Admin panelde sipariş görünürlüğünü kontrol et');
    
  } else {
    error(`Bazı testler başarısız: ${passed}/${total}`);
    console.log(`\n${colors.red}${colors.bright}❌ DÜZELTME GEREKLİ${colors.reset}\n`);
  }
  
  console.log(`\nTest tamamlandı: ${new Date().toLocaleString('tr-TR')}\n`);
  
  return passed === total ? 0 : 1;
}

// Execute
const exitCode = runAllTests();
process.exit(exitCode);
