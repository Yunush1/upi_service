# 🔧 Admin Panel API - Payment Provider Configuration

## 📋 Overview

The Admin Panel allows administrators to:
- ✅ Switch payment provider (Razorpay ↔ Cashfree)
- ✅ Manage API credentials
- ✅ Configure system settings (OTP expiry, max transaction, etc.)
- ✅ View all transactions and statistics

---

## 🔐 Authentication

All admin endpoints require JWT authentication with admin privileges.

**Header:**
```
Authorization: Bearer {accessToken}
```

⚠️ **Important:** Currently, all authenticated users can access admin endpoints. In production, implement role-based access control (RBAC) to restrict to admin users only.

---

## 🚀 Quick Start

### 1. Initialize Default Settings

**Endpoint:** `POST /admin/settings/initialize`

```bash
curl -X POST http://localhost:3000/admin/settings/initialize \
  -H "Authorization: Bearer {accessToken}"
```

**Response:**
```json
{
  "success": true,
  "message": "Default settings initialized successfully"
}
```

This creates default settings:
- `payment_provider`: RAZORPAY
- `otp_expiry`: 300 (seconds)
- `max_transaction_amount`: 100000 (rupees)

---

## 💳 Payment Provider Management

### View Current Provider

**Endpoint:** `GET /admin/payment-provider`

```bash
curl -X GET http://localhost:3000/admin/payment-provider \
  -H "Authorization: Bearer {accessToken}"
```

**Response:**
```json
{
  "provider": "RAZORPAY",
  "description": "Current active payment provider is RAZORPAY"
}
```

---

### Switch to Razorpay

**Endpoint:** `PUT /admin/payment-provider`

```bash
curl -X PUT http://localhost:3000/admin/payment-provider \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "RAZORPAY",
    "apiKey": "rzp_live_YOUR_KEY",
    "apiSecret": "YOUR_SECRET"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Payment provider successfully updated to RAZORPAY",
  "provider": "RAZORPAY"
}
```

---

### Switch to Cashfree

**Endpoint:** `PUT /admin/payment-provider`

```bash
curl -X PUT http://localhost:3000/admin/payment-provider \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "CASHFREE",
    "apiKey": "cfsk_test_YOUR_KEY",
    "apiSecret": "YOUR_SECRET"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Payment provider successfully updated to CASHFREE",
  "provider": "CASHFREE"
}
```

**Impact:** All NEW payments will use Cashfree from this point forward.

---

## ⚙️ Settings Management

### View All Settings

**Endpoint:** `GET /admin/settings`

```bash
curl -X GET http://localhost:3000/admin/settings \
  -H "Authorization: Bearer {accessToken}"
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-100000000001",
    "key": "payment_provider",
    "value": "RAZORPAY",
    "description": "Default payment provider (RAZORPAY or CASHFREE)",
    "type": "string",
    "createdAt": "2026-04-26T16:00:00Z",
    "updatedAt": "2026-04-26T16:30:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-100000000002",
    "key": "otp_expiry",
    "value": "300",
    "description": "OTP expiry time in seconds",
    "type": "number",
    "createdAt": "2026-04-26T16:00:00Z",
    "updatedAt": "2026-04-26T16:00:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-100000000003",
    "key": "max_transaction_amount",
    "value": "100000",
    "description": "Maximum transaction amount in rupees",
    "type": "number",
    "createdAt": "2026-04-26T16:00:00Z",
    "updatedAt": "2026-04-26T16:00:00Z"
  }
]
```

---

### Get Specific Setting

**Endpoint:** `GET /admin/settings/{key}`

```bash
curl -X GET http://localhost:3000/admin/settings/payment_provider \
  -H "Authorization: Bearer {accessToken}"
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-100000000001",
  "key": "payment_provider",
  "value": "RAZORPAY",
  "description": "Default payment provider (RAZORPAY or CASHFREE)",
  "type": "string",
  "createdAt": "2026-04-26T16:00:00Z",
  "updatedAt": "2026-04-26T16:30:00Z"
}
```

---

### Update a Setting

**Endpoint:** `PUT /admin/settings/{key}`

#### Example 1: Change OTP Expiry

```bash
curl -X PUT http://localhost:3000/admin/settings/otp_expiry \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "600",
    "type": "number",
    "description": "OTP valid for 10 minutes"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Setting otp_expiry updated successfully",
  "key": "otp_expiry",
  "value": "600"
}
```

**Impact:** New OTPs will expire after 600 seconds (10 minutes)

---

#### Example 2: Change Max Transaction Amount

```bash
curl -X PUT http://localhost:3000/admin/settings/max_transaction_amount \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "500000",
    "type": "number",
    "description": "Maximum transaction increased to 500k"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Setting max_transaction_amount updated successfully",
  "key": "max_transaction_amount",
  "value": "500000"
}
```

**Impact:** Users can now send up to ₹5,00,000 per transaction

---

#### Example 3: Add Razorpay Webhook Secret

```bash
curl -X PUT http://localhost:3000/admin/settings/razorpay_webhook_secret \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "whsec_live_xyz123abc456",
    "type": "string",
    "description": "Razorpay Webhook Secret for production"
  }'
```

---

### Delete a Setting

**Endpoint:** `DELETE /admin/settings/{key}`

```bash
curl -X DELETE http://localhost:3000/admin/settings/custom_setting \
  -H "Authorization: Bearer {accessToken}"
```

**Response:**
```json
{
  "success": true,
  "message": "Setting custom_setting deleted successfully"
}
```

---

## 📊 Available Settings

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `payment_provider` | string | RAZORPAY | Active payment provider |
| `otp_expiry` | number | 300 | OTP validity in seconds |
| `max_transaction_amount` | number | 100000 | Max amount per transaction |
| `razorpay_key` | string | - | Razorpay API Key |
| `razorpay_secret` | string | - | Razorpay API Secret |
| `cashfree_key` | string | - | Cashfree API Key |
| `cashfree_secret` | string | - | Cashfree API Secret |

---

## 🔄 Real-World Admin Workflow

### Scenario 1: Switch Payment Gateway

**Situation:** You want to migrate from Razorpay to Cashfree

**Step 1:** Get Cashfree credentials
```bash
# From Cashfree dashboard, obtain:
# - API Key
# - API Secret
```

**Step 2:** Update payment provider
```bash
curl -X PUT http://localhost:3000/admin/payment-provider \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "CASHFREE",
    "apiKey": "cfsk_prod_key_123",
    "apiSecret": "cfsk_prod_secret_456"
  }'
```

**Step 3:** Verify configuration
```bash
curl -X GET http://localhost:3000/admin/payment-provider \
  -H "Authorization: Bearer {adminToken}"
```

**Result:** All new payments use Cashfree. Existing pending payments continue with Razorpay.

---

### Scenario 2: Increase Transaction Limit During Peak Hours

**Situation:** Black Friday sales - increase transaction limit temporarily

**Step 1:** Check current limit
```bash
curl -X GET http://localhost:3000/admin/settings/max_transaction_amount \
  -H "Authorization: Bearer {adminToken}"
```

**Step 2:** Increase to ₹10 lakhs
```bash
curl -X PUT http://localhost:3000/admin/settings/max_transaction_amount \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "1000000",
    "type": "number",
    "description": "Black Friday - Increased limit"
  }'
```

**Step 3:** After peak hours, revert
```bash
curl -X PUT http://localhost:3000/admin/settings/max_transaction_amount \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "100000",
    "type": "number"
  }'
```

---

## 🛡️ Security Best Practices

1. **Protect Admin Endpoints:**
   ```typescript
   // TODO: Implement role-based access control
   @UseGuards(JwtAuthGuard, AdminGuard)  // Add AdminGuard
   export class AdminController { }
   ```

2. **Audit Logging:**
   ```typescript
   // Log all admin changes for compliance
   {
     admin_id: "uuid",
     action: "payment_provider_changed",
     old_value: "RAZORPAY",
     new_value: "CASHFREE",
     timestamp: "2026-04-26T16:30:00Z"
   }
   ```

3. **Webhook Secret Management:**
   - Store secrets encrypted in database
   - Rotate regularly (monthly recommended)
   - Don't log secret values

4. **Rate Limiting:**
   ```typescript
   // Implement rate limiting on admin endpoints
   @UseGuards(RateLimitGuard)
   @Put('/payment-provider')
   updatePaymentProvider() { }
   ```

---

## 🐛 Troubleshooting

### Settings Not Updating

**Problem:** Updated a setting, but payments still use old provider

**Solution:**
```bash
# Settings are cached. Clear cache if needed:
# 1. Restart server: npm run dev
# 2. Or check PaymentService is using latest value
```

### Invalid Provider Name

**Error:** `Invalid provider. Must be RAZORPAY or CASHFREE`

**Solution:** Use exact case: `RAZORPAY` or `CASHFREE` (uppercase)

### 401 Unauthorized on Admin Endpoints

**Problem:** Getting unauthorized error on admin APIs

**Solution:**
1. Verify JWT token is valid: `POST /auth/verify-otp`
2. Check token format: `Authorization: Bearer {token}`
3. Check token hasn't expired (15 min expiry)

---

## 📚 Related Documentation

- [UPI Payment Flow](./UPI_PAYMENT_FLOW.md) - End-to-end payment process
- [Authentication Guide](./AUTHENTICATION_GUIDE.md) - JWT and OTP auth
- [README](./README_NEW.md) - Full project documentation

---

## ✅ Production Checklist

- [ ] Implement role-based access control (RBAC)
- [ ] Add admin audit logging
- [ ] Implement rate limiting
- [ ] Encrypt sensitive settings in database
- [ ] Set up webhook secret rotation
- [ ] Monitor admin API access
- [ ] Document approval workflow for provider changes
- [ ] Test provider switching with real transactions
- [ ] Set up alerts for failed webhooks

---

**Happy administrating! 🚀**
