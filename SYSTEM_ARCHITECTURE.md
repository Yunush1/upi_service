# 🎯 Complete System Architecture & How It Works

## 🔍 Quick Answer: How Money Transfers Between UPI Users

### The Short Version (3 Steps)

```
1️⃣ User A sends ₹500 to user@ybl
   ↓
2️⃣ Your backend sends to Razorpay/Cashfree (configurable by admin)
   ↓
3️⃣ Payment gateway handles real money transfer through UPI network
   ↓
4️⃣ Webhook confirms → Your backend records it → Users notified
```

**Key Point:** Your backend doesn't touch the money. It just orchestrates the process.

---

## 📊 Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React Native)                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. User A logs in (OTP-based)                          │   │
│  │ 2. Enters receiver UPI: user@ybl                       │   │
│  │ 3. Clicks "Send ₹500"                                  │   │
│  │ 4. Razorpay/Cashfree UI opens                          │   │
│  │ 5. User enters UPI PIN on bank app                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Your NestJS API)                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Auth Module                                              │   │
│  │ • OTP generation & verification                         │   │
│  │ • JWT token generation                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Payment Module                                           │   │
│  │ • Validate UPI ID format                               │   │
│  │ • Get configured provider from settings (DB)           │   │
│  │ • Create Transaction record (PENDING)                  │   │
│  │ • Create Payment record (CREATED)                      │   │
│  │ • Send to Razorpay/Cashfree                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Admin Module                                             │   │
│  │ • Manage payment provider settings (Razorpay/Cashfree) │   │
│  │ • Configure OTP expiry                                 │   │
│  │ • Set max transaction limit                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Webhook Module                                           │   │
│  │ • Receive payment status from provider                 │   │
│  │ • Verify webhook signature                             │   │
│  │ • Update Transaction & Payment status                  │   │
│  │ • Trigger notifications                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Database (PostgreSQL)                                    │   │
│  │ • Users table                                           │   │
│  │ • Transactions table (tracks all payments)             │   │
│  │ • Payments table (gateway-specific details)            │   │
│  │ • Settings table (admin configurations)                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  PAYMENT GATEWAY (Provider)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ RAZORPAY OR CASHFREE (Selected by Admin)               │   │
│  │ • Validates UPI ID with NPCI network                   │   │
│  │ • Initiates UPI payment request                        │   │
│  │ • Shows payment UI on user's phone                     │   │
│  │ • Communicates with user's bank                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BANKING NETWORK (NPCI)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ User A's Bank → Process Payment → User B's Bank        │   │
│  │ • Verify UPI credentials                               │   │
│  │ • Deduct ₹500 from User A's account                    │   │
│  │ • Add ₹500 to receiver's account (user@ybl)           │   │
│  │ • Send confirmation to gateway                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  NOTIFICATION SYSTEM                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • Send SMS: "₹500 transferred to user@ybl"            │   │
│  │ • Send Email: Payment confirmation                     │   │
│  │ • Push Notification: Payment received                  │   │
│  │ • In-App: Update transaction history                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
│                      User A & User B Updated                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Detailed Flow: What Happens at Each Step

### Step 1: User Authentication
```
User A: "I want to send ₹500"
   ↓
Frontend: POST /auth/send-otp
   ↓
Backend: Generate 6-digit OTP → Store in Redis (5 min expiry)
   ↓
User receives SMS/Email with OTP
   ↓
Frontend: POST /auth/verify-otp
   ↓
Backend: 
  • Verify OTP matches
  • Create/fetch User record
  • Generate JWT token (15 min validity)
  • Return access token + refresh token
```

### Step 2: Initiate Payment
```
User A enters:
  • Receiver UPI: user@ybl
  • Amount: ₹500
   ↓
Frontend: POST /payment/create (with JWT token)
   ↓
Backend:
  1. Extract User A's ID from JWT
  2. Validate UPI format (regex check)
  3. Check User A exists in DB
  4. Validate amount > 0
  5. Query settings table → Get configured provider
     (Could be RAZORPAY or CASHFREE)
  6. Create Transaction record:
     {
       id: uuid,
       senderId: User A's UUID,
       receiverUpi: "user@ybl",
       amount: 500,
       status: "PENDING",
       type: "SEND"
     }
  7. Create Payment record:
     {
       id: uuid,
       userId: User A's UUID,
       transactionId: above uuid,
       provider: "RAZORPAY" (from settings),
       status: "CREATED",
       amount: 500
     }
  8. Return: paymentId, transactionId, provider
```

### Step 3: Frontend Opens Payment Gateway
```
Frontend receives paymentId from backend
   ↓
Frontend initializes Razorpay:
  • Sets order ID = paymentId
  • Sets amount = 500 (converted to paise: 50000)
  • Sets UPI method only
  • Opens Razorpay UI
   ↓
User sees:
  "Send ₹500 to user@ybl via UPI"
  "Select your UPI app..."
   ↓
User selects UPI app (Google Pay, PhonePe, etc.)
   ↓
User enters UPI PIN
```

### Step 4: Bank Processing (Happens on User's Device)
```
User's phone → Selected UPI app
   ↓
UPI App verifies:
  • User's credentials
  • UPI ID: user@ybl exists
  • Available balance: ≥ ₹500
   ↓
Contacts User A's bank
   ↓
Bank verifies through NPCI (National Payments Corporation of India)
   ↓
Bank processes:
  • Deducts ₹500 from User A
  • Transfers via UPI network
  • Adds ₹500 to receiver's bank
   ↓
Receiver's bank confirms
   ↓
UPI app receives confirmation
   ↓
Razorpay receives confirmation
```

### Step 5: Webhook Notification
```
Razorpay: "Payment successful!"
   ↓
Razorpay sends webhook:
  POST /webhook/razorpay
  X-RazorPay-Signature: {HMAC_SHA256_hash}
  Body: {
    event: "payment.captured",
    payload: {
      payment: {
        id: "pay_123xyz",
        status: "captured",
        amount: 50000,
        notes: { transaction_id: "uuid-1" }
      }
    }
  }
   ↓
Backend receives webhook:
  1. Verify signature matches:
     HMAC_SHA256(body, RAZORPAY_WEBHOOK_SECRET) === signature
  2. Extract transaction ID from notes
  3. Find Transaction in DB by ID
  4. Find Payment in DB by transaction ID
  5. Update Payment status: CREATED → CAPTURED
  6. Update Transaction status: PENDING → SUCCESS
  7. Update capturedAt timestamp
```

### Step 6: Database Updates
```
BEFORE webhook:
  Transaction: { id: uuid-1, status: PENDING }
  Payment: { id: uuid-2, status: CREATED }

AFTER webhook:
  Transaction: { id: uuid-1, status: SUCCESS, updatedAt: now }
  Payment: { 
    id: uuid-2, 
    status: CAPTURED, 
    capturedAt: now,
    providerPaymentId: "pay_123xyz"
  }
```

### Step 7: Notifications Sent
```
Notification Service triggers:
   ↓
For User A (Sender):
  • SMS: ✅ Sent ₹500 to user@ybl
  • Email: Payment confirmed
  • Push: Amount debited
   ↓
For User B (Receiver):
  • SMS: ✅ Received ₹500 from 9876543210
  • Push: Money received
```

---

## 🎮 Admin Control Points

### What Can Admin Configure?

**1. Payment Provider (Most Important)**
```bash
# Admin switches from Razorpay to Cashfree
PUT /admin/payment-provider
{
  "provider": "CASHFREE",
  "apiKey": "cfsk_123",
  "apiSecret": "cfsk_456"
}

✅ Impact: All future payments use Cashfree
❌ Existing pending payments: Still use Razorpay
```

**2. OTP Expiry**
```bash
PUT /admin/settings/otp_expiry
{
  "value": "600"  # 10 minutes instead of 5
}

✅ Impact: New OTPs valid for 10 minutes
```

**3. Max Transaction Amount**
```bash
PUT /admin/settings/max_transaction_amount
{
  "value": "1000000"  # ₹10 lakhs
}

✅ Impact: Users can send up to ₹10,00,000
❌ Below this: System enforces in validation
```

**4. Webhook Secrets (Security)**
```bash
PUT /admin/settings/razorpay_webhook_secret
{
  "value": "new_secret_xyz"
}

✅ Impact: Webhook verification uses new secret
```

---

## 💾 Database Schema

```sql
-- Users (who can send payments)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  phone VARCHAR(15) UNIQUE,
  status ENUM ('active', 'inactive', 'blocked'),
  createdAt TIMESTAMP
);

-- Transactions (tracks payment flow)
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  senderId UUID REFERENCES users(id),
  receiverUpi VARCHAR(100),  -- Could be external
  amount DECIMAL(10,2),
  status ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'),
  transactionType ENUM ('SEND', 'RECEIVE', 'REFUND'),
  description TEXT,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

-- Payments (gateway-specific records)
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  transactionId UUID REFERENCES transactions(id),
  provider ENUM ('RAZORPAY', 'CASHFREE'),
  providerPaymentId VARCHAR(100),  -- External gateway ID
  status ENUM ('CREATED', 'CAPTURED', 'FAILED'),
  amount DECIMAL(10,2),
  capturedAt TIMESTAMP,
  failedAt TIMESTAMP
);

-- Settings (admin configurable)
CREATE TABLE settings (
  id UUID PRIMARY KEY,
  key VARCHAR(100) UNIQUE,
  value TEXT,
  type ENUM ('string', 'number', 'boolean', 'json'),
  description TEXT
);
```

---

## 🔐 Security Layers

### Layer 1: Authentication
- ✅ JWT tokens (15 min validity)
- ✅ OTP verification (5 min validity)
- ✅ Redis session storage

### Layer 2: Input Validation
- ✅ UPI format regex: `/^[a-zA-Z0-9_.\-]{3,}@[a-zA-Z]{3,}$/`
- ✅ Amount validation: > 0 and < max_amount
- ✅ Phone validation: 10 digits

### Layer 3: Webhook Security
- ✅ HMAC-SHA256 signature verification
- ✅ Timestamp validation (prevent replay)
- ✅ Idempotency (handle duplicate webhooks)

### Layer 4: Transaction State Machine
- ✅ PENDING → SUCCESS / FAILED
- ✅ No transitions back (immutable history)
- ✅ Atomic database updates

---

## 🚀 API Flow Diagram

```
┌─ PUBLIC ENDPOINTS (No auth)
│
├─ POST /auth/send-otp
│   └─ Generate & send OTP
│
├─ POST /auth/verify-otp
│   └─ Verify & return JWT token
│
├─ POST /webhook/razorpay
│   └─ Receive payment updates
│
└─ GET /health
    └─ Server status

┌─ PROTECTED ENDPOINTS (Requires JWT token)
│
├─ Payment Module
│   ├─ POST /payment/create → Initiate payment
│   ├─ POST /payment/validate-upi → Check UPI ID
│   ├─ GET /payment/list → Payment history
│   └─ POST /payment/status → Check status
│
├─ Transaction Module
│   ├─ GET /transaction/list → All transactions
│   ├─ POST /transaction/:id → Get details
│   └─ GET /transaction/stats → Statistics
│
└─ Admin Module ⚠️ (Should be restricted to admin only)
    ├─ GET /admin/payment-provider → Current provider
    ├─ PUT /admin/payment-provider → Switch provider
    ├─ GET /admin/settings → All settings
    ├─ PUT /admin/settings/{key} → Update setting
    └─ DELETE /admin/settings/{key} → Delete setting
```

---

## 📋 Step-by-Step Test (Full Flow)

```bash
# 1. Get OTP
curl -X POST http://localhost:3000/auth/send-otp \
  -d '{"phone": "9876543210"}'

# 2. Verify OTP (check server logs for actual OTP)
TOKEN=$(curl -X POST http://localhost:3000/auth/verify-otp \
  -d '{"phone": "9876543210", "otp": "123456"}' \
  | jq -r '.accessToken')

# 3. Admin: Check payment provider
curl http://localhost:3000/admin/payment-provider \
  -H "Authorization: Bearer $TOKEN"

# 4. Admin: Switch to Cashfree
curl -X PUT http://localhost:3000/admin/payment-provider \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"provider": "CASHFREE", "apiKey": "cfsk_test_123"}'

# 5. Create payment (will use Cashfree now)
curl -X POST http://localhost:3000/payment/create \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount": 500, "receiverUpi": "user@ybl"}'

# 6. List transactions
curl http://localhost:3000/transaction/list \
  -H "Authorization: Bearer $TOKEN"

# 7. Simulate webhook from Razorpay/Cashfree
# (This would come automatically in production)
curl -X POST http://localhost:3000/webhook/razorpay \
  -H "x-razorpay-signature: YOUR_SIGNATURE" \
  -d '{
    "event": "payment.captured",
    "payload": {
      "payment": {
        "id": "pay_test_123",
        "status": "captured",
        "amount": 50000
      }
    }
  }'
```

---

## ✅ Quick Reference

| Component | What It Does | Who Uses |
|-----------|------------|----------|
| **Auth** | User login via OTP + JWT | Users |
| **Payment** | Create payment request, choose provider | Users |
| **Transaction** | Track all payments | Users + Admin |
| **Webhook** | Receive status from gateway | System (automatic) |
| **Admin** | Manage provider & settings | Admins |
| **Notification** | Send alerts to users | System (automatic) |

---

## 🎯 Summary

**Your system works like this:**

1. **User sends money** → Backend creates records
2. **Backend asks Razorpay/Cashfree** (configurable by admin)
3. **Payment gateway handles real transfer** via UPI network
4. **Banks exchange money** through NPCI
5. **Gateway sends confirmation** → Backend updates DB
6. **Users notified** → Money transfer complete

**Your backend:** 🎯 (Orchestrator)
**Real money:** 💸 (Flows through banks, not your server)
**Admin control:** 🎮 (Can change payment provider anytime)

---

For detailed information, see:
- [UPI_PAYMENT_FLOW.md](./UPI_PAYMENT_FLOW.md) - End-to-end payment flow
- [ADMIN_API_GUIDE.md](./ADMIN_API_GUIDE.md) - Admin configuration API
- [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) - Authentication setup
