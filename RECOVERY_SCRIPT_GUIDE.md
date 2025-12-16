# Quick Start: Payment Recovery Script

## 🚀 Immediate Action Required

If customers are reporting successful payments but orders stuck in "pending_payment", follow these steps:

### Step 1: Check for Stuck Orders
```bash
cd c:\Users\YCE\Desktop\vadilercom-master
node scripts/recover-stuck-orders.mjs --check
```

This will show you:
- Order numbers affected
- Payment tokens present
- Order age (in minutes)
- Total amount paid

### Step 2: Attempt Automatic Recovery
```bash
node scripts/recover-stuck-orders.mjs --recover
```

This will:
- ✅ Verify each payment with iyzico
- ✅ Update order status if payment successful
- ✅ Add recovery note to order timeline
- ✅ Show summary of recovered vs failed orders

### Step 3: Review Results

**If successful:**
```
✅ Recovered: 5
❌ Failed: 0
📋 Total: 5
```

**If some failed:**
- Check iyzico dashboard manually
- Compare payment IDs
- Contact customer support if needed

---

## 📋 Example Output

### Check Mode
```
🔍 Searching for stuck orders...

📋 Found 3 orders in pending_payment status:

Order #100123 (abc-def-ghi-123):
  Status: pending_payment
  Total: ₺450.00
  Created: 14.12.2025 15:30
  Age: 25 minutes
  Has payment token: ✅
  Has transaction ID: ❌
  Payment token: e5972b7b-844d-41d2-...
  ⚠️  POTENTIALLY STUCK

Order #100124 (xyz-uvw-rst-456):
  Status: pending_payment
  Total: ₺789.50
  Created: 14.12.2025 16:15
  Age: 10 minutes
  Has payment token: ✅
  Has transaction ID: ❌
  Payment token: f7a83c9d-955e-52e3...
  ⚠️  POTENTIALLY STUCK
```

### Recovery Mode
```
🔧 RECOVERY MODE: Attempting to recover stuck orders

🔧 Attempting to recover order #100123...
  🔍 Checking payment status with token...
  ✅ Payment verified as successful!
  💳 Paid: ₺450.00
  🔢 Transaction ID: 1234567890
  💳 Card: **** 5678
  ✅ Order successfully recovered!

🔧 Attempting to recover order #100124...
  🔍 Checking payment status with token...
  ❌ Payment verification failed: Payment cancelled by user
  💡 This order should be marked as payment_failed manually
```

---

## ⚠️ Important Notes

### When to Run
- **Immediately** after deploying the fix
- **Daily** for the first week to catch any stragglers
- **On-demand** when customers report issues

### What Gets Updated
The script updates:
- `status`: `pending_payment` → `confirmed`
- `payment.status`: → `paid`
- `payment.transactionId`: Added from iyzico
- `payment.cardLast4`: Added from iyzico
- `payment.paidAt`: Current timestamp
- `payment.recoveredAt`: Recovery timestamp
- `payment.recoveredBy`: `'script'`
- `timeline`: Adds recovery event

### Safety Features
✅ **Amount validation**: Won't update if paid ≠ expected  
✅ **Status check**: Won't downgrade already-paid orders  
✅ **iyzico verification**: Only updates if iyzico confirms success  
✅ **Idempotency**: Safe to run multiple times  

### Manual Intervention Needed If:
- ❌ Payment amount mismatch
- ❌ iyzico reports payment failed
- ❌ Order not found by token
- ❌ Customer disputes charge

---

## 🔍 Troubleshooting

### Script Won't Run
```bash
# Check Node.js version (requires 18+)
node --version

# Install dependencies if missing
npm install

# Verify .env.local exists and has correct credentials
cat .env.local | grep SUPABASE
```

### No Stuck Orders Found
✅ Good! The fix is working correctly.

### Recovery Fails
1. Check iyzico dashboard for actual payment status
2. Verify IYZICO credentials in .env.local
3. Check Supabase connection
4. Review order manually in admin panel

### Database Connection Error
```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_KEY

# Test Supabase connection
curl -H "apikey: YOUR_SERVICE_KEY" \
  "YOUR_SUPABASE_URL/rest/v1/orders?select=id&limit=1"
```

---

## 📊 Post-Recovery Verification

### Check Database
```sql
-- Count recovered orders
SELECT COUNT(*) FROM orders 
WHERE payment->>'recoveredBy' = 'script';

-- List recovered orders with details
SELECT 
  order_number,
  status,
  total,
  payment->>'paidPrice' as paid,
  payment->>'recoveredAt' as recovered_at
FROM orders 
WHERE payment->>'recoveredBy' = 'script'
ORDER BY payment->>'recoveredAt' DESC;

-- Verify no remaining stuck orders
SELECT COUNT(*) FROM orders 
WHERE status = 'pending_payment' 
AND created_at < NOW() - INTERVAL '10 minutes';
```

### Customer Communication Template
```
Subject: Sipariş Onay - Order #[ORDER_NUMBER]

Sayın [CUSTOMER_NAME],

Ödemeniz başarıyla tamamlanmıştır. Siparişiniz onaylanmış 
ve hazırlık aşamasına geçmiştir.

Sipariş No: [ORDER_NUMBER]
Tutar: ₺[AMOUNT]
Kart: **** [LAST4]

Siparişinizi "Hesabım > Siparişlerim" bölümünden 
takip edebilirsiniz.

Teşekkür ederiz,
Vadiler Çiçek
```

---

## 📞 Support Contacts

**Technical Issues:**
- Check logs: Supabase Dashboard > Logs
- Review errors: `npm run lint`
- Test locally: `npm run dev`

**Business Issues:**
- iyzico Dashboard: Check transaction status
- Customer refunds: Contact iyzico support
- Order disputes: Admin panel → Orders → Manual update

---

**Last Updated**: December 14, 2025  
**Script Version**: 1.0.0  
**Compatible With**: Next.js 16, Supabase, iyzico API v2
