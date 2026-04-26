# 💳 Complete UPI Payment Flow - End-to-End Explanation

## Overview
This document explains how money transfers from one user to another through your UPI payment backend.

---

## 📊 Architecture Diagram

```
User A (Sender)
     ↓
1. Authentication (JWT Token)
     ↓
2. POST /payment/create with Receiver UPI
     ↓
Backend API
├─ Creates Transaction record (PENDING)
├─ Creates Payment record
└─ Sends payment request to Razorpay
     ↓
3. Razorpay/Cashfree (Payment Gateway)
├─ Validates UPI ID
├─ Initiates UPI Payment
└─ Shows payment prompt on user's bank app
     ↓
User A (Enters PIN on Bank App)
     ↓
4. Bank Processing
├─ Verifies credentials
├─ Deducts ₹Amount from Sender Account
├─ Transfers to Recipient Account
└─ Sends confirmation
     ↓
5. Razorpay Webhook Notification
     ↓
Backend (Receives webhook)
├─ Verifies signature
├─ Updates Payment status (CAPTURED)
├─ Updates Transaction status (SUCCESS)
├─ Stores payment metadata
└─ Triggers notifications
     ↓
Notifications (Email, SMS, Push)
     ↓
User A & User B receive confirmation
```

---

## 🔄 Step-by-Step Process

### Step 1: User A Authenticates

**Endpoint:** `POST /auth/verify-otp`

```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "otp": "123456"
  }'
```

**Response:**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**JWT Token Contains:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",  // User UUID
  "phone": "9876543210",
  "iat": 1700000000,
  "exp": 1700900000,
  "role": "user"
}
```

---

### Step 2: User A Initiates Payment

**Endpoint:** `POST /payment/create`

```bash
curl -X POST http://localhost:3000/payment/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {accessToken}" \
  -d '{
    "amount": 500,
    "receiverUpi": "user@ybl",
    "description": "Payment for service"
  }'
```

**What Happens Inside:**

```typescript
// payment.service.ts -> createPayment()

// 1. Extract sender's ID from JWT token
userId = req.user.id;  // "550e8400-e29b-41d4-a716-446655440000"

// 2. Validate UPI format
validateUpi("user@ybl")  // ✅ Valid format

// 3. Verify sender exists in database
User.findOne({ id: userId })  // ✅ Found: Raj Kumar

// 4. Validate amount
if (500 > 0)  // ✅ Valid amount

// 5. Create Transaction record in DB
Transaction.create({
  id: "uuid-1",
  senderId: "550e8400-e29b-41d4-a716-446655440000",  // Raj Kumar
  receiverUpi: "user@ybl",  // Receiver's UPI (not UUID yet)
  amount: 500,
  status: "PENDING",
  transactionType: "SEND",
  description: "Payment for service",
  createdAt: now
})

// 6. Get configured payment provider from settings
provider = await settings.get("payment_provider")  // "RAZORPAY"

// 7. Create Payment record in DB
Payment.create({
  id: "uuid-2",
  userId: "550e8400-e29b-41d4-a716-446655440000",
  transactionId: "uuid-1",
  provider: "RAZORPAY",  // Could be CASHFREE (configurable by admin)
  providerPaymentId: "razorpay_uuid-1",
  status: "CREATED",
  amount: 500,
  currency: "INR",
  metadata: {
    upiId: "user@ybl",
    provider: "RAZORPAY",
    timestamp: "2026-04-26T16:30:00Z"
  }
})

// 8. Return response
{
  "transactionId": "uuid-1",
  "paymentId": "uuid-2",
  "provider": "RAZORPAY",
  "status": "CREATED",
  "amount": 500,
  "providerPaymentId": "razorpay_uuid-1"
}
```

**Response:**
```json
{
  "transactionId": "550e8400-e29b-41d4-a716-100000000001",
  "paymentId": "550e8400-e29b-41d4-a716-200000000001",
  "provider": "RAZORPAY",
  "status": "CREATED",
  "amount": 500,
  "providerPaymentId": "razorpay_550e8400-e29b-41d4-a716-100000000001"
}
```

**Database State After Step 2:**

| Table | Record |
|-------|--------|
| **transactions** | id: uuid-1, senderId: UUID, receiverUpi: "user@ybl", amount: 500, status: PENDING |
| **payments** | id: uuid-2, userId: UUID, transactionId: uuid-1, provider: RAZORPAY, status: CREATED |

---

### Step 3: Frontend Initiates Razorpay Payment

**In React Native App (Frontend):**

```javascript
// Use the paymentId from backend to create Razorpay order
const initializeRazorpay = async (paymentResponse) => {
  const options = {
    key: "YOUR_RAZORPAY_KEY_ID",
    amount: paymentResponse.amount * 100,  // Convert to paise
    currency: "INR",
    order_id: paymentResponse.paymentId,
    description: "UPI Payment",
    image: "https://your-app-logo.png",
    customer_notification: 1,
    notes: {
      transaction_id: paymentResponse.transactionId,
      receiver_upi: paymentResponse.receiverUpi
    },
    prefill: {
      contact: userPhone,
      email: userEmail
    },
    method: {
      upi: true,  // Enable UPI
      netbanking: false,
      card: false
    }
  };

  // This opens Razorpay UI
  const razorpayInstance = new RazorpayCheckout(options);
  
  razorpayInstance.open()
    .then((paymentData) => {
      // Payment successful, verify signature
      handlePaymentSuccess(paymentData);
    })
    .catch((error) => {
      // Payment failed
      handlePaymentFailure(error);
    });
};
```

---

### Step 4: User Completes Payment in UPI

**User Experience:**

1. Razorpay UI opens on phone
2. User sees payment details:
   - Receiver UPI: `user@ybl`
   - Amount: ₹500
   - Description: "Payment for service"

3. User selects UPI app (Google Pay, PhonePe, etc.)
4. UPI app opens and shows:
   - Sender: User A's Phone Number
   - Receiver: user@ybl
   - Amount: ₹500

5. User enters UPI PIN
6. Bank processes payment:
   - Deducts ₹500 from User A's account
   - Adds ₹500 to receiver's account

---

### Step 5: Razorpay Sends Webhook Notification

**Webhook Request:**

```bash
POST /webhook/razorpay
x-razorpay-signature: {HMAC_SHA256_SIGNATURE}
Content-Type: application/json

{
  "id": "event_123abc",
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_123xyz",
        "status": "captured",
        "amount": 50000,
        "currency": "INR",
        "description": "UPI Payment",
        "notes": {
          "transaction_id": "uuid-1",
          "receiver_upi": "user@ybl"
        }
      }
    }
  }
}
```

---

### Step 6: Backend Processes Webhook

**What Happens Inside `webhook.service.ts`:**

```typescript
async handleRazorpayWebhook(data, signature) {
  // 1. Extract payment details
  const paymentId = "pay_123xyz"
  const paymentStatus = "captured"
  
  // 2. Verify webhook signature
  const isValid = verifyRazorpaySignature(
    body,
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET
  )
  
  if (!isValid) {
    throw new BadRequestException('Invalid signature')
  }
  
  // 3. Extract transaction ID from notes
  const transactionId = data.payload.payment.entity.notes.transaction_id
  
  // 4. Map Razorpay status to internal status
  let internalStatus = PaymentStatus.CAPTURED      // ✅ Payment captured
  let transactionStatus = TransactionStatus.SUCCESS // ✅ Transaction successful
  
  // 5. Update Payment record in DB
  await Payment.update(
    { transactionId: "uuid-1" },
    {
      status: "CAPTURED",
      providerPaymentId: "pay_123xyz",
      capturedAt: new Date(),
      metadata: {
        razorpayPaymentId: "pay_123xyz",
        signature: signature,
        timestamp: new Date().toISOString()
      }
    }
  )
  
  // 6. Update Transaction record in DB
  await Transaction.update(
    { id: "uuid-1" },
    { status: "SUCCESS" }
  )
  
  // 7. Send notifications
  await notificationService.notifyTransactionStatus({
    userId: senderUserId,
    transactionId: "uuid-1",
    status: "SUCCESS",
    amount: 500,
    receiverUpi: "user@ybl"
  })
  
  return { status: "processed" }
}
```

**Database Updates After Webhook:**

| Table | Before | After |
|-------|--------|-------|
| **payments** | status: CREATED | status: CAPTURED, capturedAt: timestamp |
| **transactions** | status: PENDING | status: SUCCESS |

---

### Step 7: Notifications Sent

**Sender (User A) Receives:**

```
📱 SMS: ✅ Payment successful! ₹500 transferred to user@ybl. Ref: uuid-1

📧 Email:
Subject: Payment Confirmation
Body: Your payment of ₹500 to user@ybl has been completed successfully on Razorpay.

🔔 Push Notification:
Title: Payment Successful
Body: ₹500 transferred to user@ybl
```

**Receiver (User B) Receives:**

```
📱 SMS: ✅ You received ₹500 from 9876543210. Balance: ₹5500

🔔 Push Notification:
Title: Money Received
Body: ₹500 received from User A
```

---

## 💾 Database Records After Complete Flow

### Transactions Table
```json
{
  "id": "550e8400-e29b-41d4-a716-100000000001",
  "senderId": "550e8400-e29b-41d4-a716-446655440000",
  "receiverUpi": "user@ybl",
  "amount": 500,
  "status": "SUCCESS",
  "transactionType": "SEND",
  "description": "Payment for service",
  "createdAt": "2026-04-26T16:30:00Z",
  "updatedAt": "2026-04-26T16:30:45Z"
}
```

### Payments Table
```json
{
  "id": "550e8400-e29b-41d4-a716-200000000001",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "transactionId": "550e8400-e29b-41d4-a716-100000000001",
  "provider": "RAZORPAY",
  "providerPaymentId": "pay_123xyz",
  "status": "CAPTURED",
  "amount": 500,
  "currency": "INR",
  "capturedAt": "2026-04-26T16:30:45Z",
  "metadata": {
    "razorpayPaymentId": "pay_123xyz",
    "upiId": "user@ybl",
    "provider": "RAZORPAY",
    "signature": "abc123def456"
  },
  "createdAt": "2026-04-26T16:30:00Z",
  "updatedAt": "2026-04-26T16:30:45Z"
}
```

---

## 🔧 Configuration Points (Admin Can Change)

### 1. Payment Provider Selection

**Admin Updates Provider:**
```bash
PUT /admin/payment-provider
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "provider": "CASHFREE",
  "apiKey": "cashfree_key_123",
  "apiSecret": "cashfree_secret_456"
}
```

**Impact:** All future payments use Cashfree instead of Razorpay

### 2. Webhook Secret

**Admin Updates Secret:**
```bash
PUT /admin/settings/RAZORPAY_WEBHOOK_SECRET
Authorization: Bearer {adminToken}

{
  "value": "new_webhook_secret_789",
  "type": "string"
}
```

**Impact:** Webhook signature verification uses new secret

---

## 🔐 Security Features

### 1. Signature Verification
```typescript
// Backend verifies every webhook
HMAC_SHA256(webhookBody, RAZORPAY_WEBHOOK_SECRET) === webhookSignature
```

### 2. UPI ID Validation
```regex
/^[a-zA-Z0-9_.\-]{3,}@[a-zA-Z]{3,}$/
// Examples: user@ybl, raj@okhdfcbank, john.doe@airtel
```

### 3. JWT Authentication
- Every payment request requires valid JWT token
- Token contains sender's UUID for verification

### 4. Transaction State Machine
```
PENDING → SUCCESS / FAILED / CANCELLED
```

---

## 🚀 Complete API Flow for Frontend

```javascript
// 1. Get OTP
POST /auth/send-otp
{ "phone": "9876543210" }

// 2. Verify OTP & Get Token
POST /auth/verify-otp
{ "phone": "9876543210", "otp": "123456" }
← accessToken, refreshToken

// 3. Create Payment (Backend)
POST /payment/create
Headers: Authorization: Bearer {accessToken}
Body: { "amount": 500, "receiverUpi": "user@ybl" }
← transactionId, paymentId, provider

// 4. Validate UPI (Optional)
POST /payment/validate-upi
Headers: Authorization: Bearer {accessToken}
Body: { "upiId": "user@ybl" }
← { "isValid": true }

// 5. Initiate Razorpay Payment (Frontend)
// Use paymentId to open Razorpay checkout

// 6. Razorpay Sends Webhook (Automatic)
POST /webhook/razorpay
x-razorpay-signature: {signature}
Body: { payment data }

// 7. Check Payment Status (Frontend)
POST /payment/status
Headers: Authorization: Bearer {accessToken}
Body: { "transactionId": "uuid-1" }
← { status: "SUCCESS", amount: 500 }

// 8. View Transaction History
GET /transaction/list
Headers: Authorization: Bearer {accessToken}
← [ { transactions } ]
```

---

## ❌ Possible Failure Scenarios

### Scenario 1: Invalid UPI ID
```
User enters: "invalid@"
System rejects: "Invalid UPI ID format"
Status: Payment not created
```

### Scenario 2: Insufficient Balance
```
User has: ₹100
Tries to send: ₹500
Bank rejects in UPI app
Webhook receives: "failed"
Status updates to: FAILED
```

### Scenario 3: Webhook Signature Invalid
```
Razorpay sends: webhook + invalid signature
Backend verifies: HMAC mismatch
Response: 400 Bad Request "Invalid webhook signature"
Status: Not updated
```

### Scenario 4: Duplicate Webhook
```
Razorpay sends: Same webhook twice (network retry)
Backend receives: First webhook → Updates to SUCCESS
Backend receives: Second webhook → Updates to SUCCESS (idempotent)
Result: Same final state (no double deduction)
```

---

## 📊 Admin Dashboard Integration

Admins can monitor:

```bash
# View all transactions
GET /transaction/list

# View payment statistics
GET /transaction/stats

# Configure payment provider
PUT /admin/payment-provider

# View all settings
GET /admin/settings

# Update webhook secret
PUT /admin/settings/RAZORPAY_WEBHOOK_SECRET
```

---

## 🔄 Webhook Retry Mechanism

Razorpay will retry webhook if:
- Response code is not 200
- Response timeout (>30 seconds)

**Your webhook should:**
1. Accept multiple identical webhooks (idempotent)
2. Return 200 immediately
3. Process async in background

---

## ✅ Summary

**Key Points:**

1. **User A sends ₹500** → Backend creates Transaction (PENDING) + Payment (CREATED)
2. **Razorpay UI opens** → User enters UPI PIN
3. **Bank processes** → Deducts from A, adds to B
4. **Webhook arrives** → Backend verifies signature, updates to SUCCESS
5. **Notifications sent** → Both users informed
6. **Admin can change** → Payment provider (Razorpay/Cashfree) anytime
7. **All secure** → JWT auth, signature verification, state machine

**The money never touches your backend** - it goes directly:
User A's Bank ← Razorpay → Receiver's Bank

Your backend just:
- Creates records
- Manages state
- Notifies users
- Stores history

---

For troubleshooting, check [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) and logs!
