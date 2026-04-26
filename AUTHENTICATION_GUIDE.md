# 🔐 Authentication Guide - UPI Payment Backend

## Problem Solved
Fixed JWT secret mismatch that caused **401 Unauthorized** errors even with valid tokens.

### What was wrong:
- ❌ Tokens were signed with `'SECRET_KEY'` (hardcoded)
- ❌ Tokens were verified with `process.env.JWT_SECRET`
- ❌ These didn't match, causing authentication to fail

### What's fixed:
- ✅ Both signing and verification now use `process.env.JWT_SECRET` from `.env`
- ✅ Consistent secret across all JWT operations

---

## 📋 Step-by-Step Authentication Flow

### 1️⃣ Set JWT Secret in `.env`

```env
JWT_SECRET=your_jwt_secret_key_change_this_in_production
```

> ⚠️ **Important**: Change this in production! Use a strong, random string.

### 2️⃣ Send OTP (Public Endpoint)

**Request:**
```bash
curl -X POST http://localhost:3000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```

**Response:**
```json
{
  "message": "OTP sent successfully",
  "status": true
}
```

### 3️⃣ Verify OTP & Get Token (Public Endpoint)

**Request:**
```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "otp": "123456"}'
```

**Response:**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4️⃣ Use Token for Protected Endpoints

**Format:** `Authorization: Bearer <accessToken>`

**Example - Create Payment:**
```bash
curl -X POST http://localhost:3000/payment/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "amount": 100,
    "receiverUpi": "user@upi",
    "description": "Payment for order"
  }'
```

**Example - List Transactions:**
```bash
curl -X GET http://localhost:3000/transaction/list \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Example - Get Payment Status:**
```bash
curl -X POST http://localhost:3000/payment/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"transactionId": "uuid-here"}'
```

---

## 📚 API Endpoints Summary

### ✅ Public (No Authentication Required)
- `POST /auth/send-otp` - Send OTP to phone
- `POST /auth/verify-otp` - Verify OTP and get tokens
- `GET /health` - Health check
- `GET /db-status` - Database status
- `POST /webhook/razorpay` - Razorpay webhook
- `POST /webhook/cashfree` - Cashfree webhook

### 🔐 Protected (Requires Authorization Header)
- `POST /payment/create` - Create payment
- `POST /payment/validate-upi` - Validate UPI ID
- `POST /payment/status` - Get payment status
- `GET /payment/list` - List user's payments
- `POST /transaction/:id` - Get transaction details
- `GET /transaction/list` - List transactions
- `GET /transaction/stats` - Get transaction statistics

---

## 🧪 Testing with Postman

### 1. Set up Variables
In Postman Collection → Variables:
```
baseUrl = http://localhost:3000
token = (empty - will be set automatically)
```

### 2. Get Token
**Create a pre-request script:**
```javascript
// Send OTP
const sendOtpRequest = {
  url: pm.variables.get("baseUrl") + "/auth/send-otp",
  method: "POST",
  header: { "Content-Type": "application/json" },
  body: { mode: "raw", raw: JSON.stringify({ phone: "9876543210" }) }
};

pm.sendRequest(sendOtpRequest, (err, response) => {
  if (!err) {
    console.log("OTP sent, use code: 123456 for testing");
  }
});
```

### 3. Verify OTP and Save Token
**Request Body:**
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

**Test Script (after response):**
```javascript
if (pm.response.code === 200) {
  const jsonData = pm.response.json();
  pm.variables.set("token", jsonData.accessToken);
  console.log("Token saved:", jsonData.accessToken.substring(0, 20) + "...");
}
```

### 4. Use Token in Requests
**Authorization Tab:**
- Type: `Bearer Token`
- Token: `{{token}}`

---

## 🐛 Troubleshooting

### Issue: Still Getting 401 Unauthorized

**Check 1: Verify `.env` file**
```bash
# Should exist and contain:
JWT_SECRET=your_jwt_secret_key_change_this_in_production
```

**Check 2: Authorization Header Format**
- ✅ Correct: `Authorization: Bearer eyJhbGciOi...`
- ❌ Wrong: `Authorization: eyJhbGciOi...` (missing "Bearer")
- ❌ Wrong: `Authorization Bearer eyJhbGciOi...` (missing colon)

**Check 3: Token Validity**
- Check if token has expired (15 min for access token)
- Get a new token using `/auth/verify-otp`

**Check 4: JWT Secret Mismatch**
- Restart server: `npm run dev`
- Verify JWT_SECRET in `.env`
- Check auth.module.ts uses `process.env.JWT_SECRET`

### Issue: Token Expired

Use the `refreshToken` to get a new `accessToken`:
```bash
# TODO: Implement refresh endpoint
# POST /auth/refresh
```

### Issue: Invalid OTP

The test OTP is only valid for 5 minutes in Redis:
```bash
# Get new OTP
POST /auth/send-otp
# Wait 5 seconds
POST /auth/verify-otp (use same OTP from logs)
```

---

## 🔑 Token Payload Structure

```javascript
{
  "phone": "9876543210",
  "iat": 1700000000,      // Issued at
  "exp": 1700000000,      // Expiration (15 min)
  "aud": "UPI",           // Audience
  "role": "user",         // User role
  "permission": ["read", "write"],
  "type": "access"        // Token type
}
```

---

## 📝 Environment Variables Reference

```env
# Signing & Verification
JWT_SECRET=your_jwt_secret_key_change_this_in_production

# Server
PORT=3000
NODE_ENV=development

# Database
DB_LOGGING=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CORS_ORIGIN=http://localhost:3000

# Payment Gateway (optional)
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

---

## 🚀 Production Checklist

- [ ] Set strong `JWT_SECRET` in `.env.production`
- [ ] Use HTTPS for all endpoints
- [ ] Set `CORS_ORIGIN` to your frontend domain
- [ ] Enable rate limiting on `/auth/send-otp`
- [ ] Implement refresh token endpoint
- [ ] Add token revocation for logout
- [ ] Use secrets manager (AWS Secrets Manager, HashiCorp Vault)
- [ ] Rotate JWT_SECRET periodically
- [ ] Add request logging and monitoring

---

## ✅ Quick Test Command

```bash
# 1. Send OTP
curl -X POST http://localhost:3000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'

# 2. Verify OTP (check logs for actual OTP)
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "otp": "123456"}'

# 3. Use the returned token with other endpoints
# Copy the accessToken value and use it as: Authorization: Bearer <token>
```

---

For more help, check the individual module documentation in the `src/modules/` folder.
