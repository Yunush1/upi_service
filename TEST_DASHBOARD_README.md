# 🧪 UPI Payment System - Testing Dashboard

Complete interactive HTML dashboard to test the entire UPI payment flow without writing any code.

## 📋 Features

### ✅ User Authentication
- OTP-based login (Phone number → OTP → JWT Token)
- Automatic token storage (persists on page refresh)
- Auto logout with token expiry display
- Session management

### 💰 Payment Operations
- Send payments to any UPI ID
- Check payment status in real-time
- Add payment descriptions
- View confirmation details

### 📊 Transaction Management
- View complete transaction history
- Filter and search transactions
- See transaction status (PENDING/SUCCESS/FAILED)
- View transaction statistics
- Real-time updates

### ⚙️ Admin Control (For Testing)
- Switch payment provider (Razorpay ↔ Cashfree)
- Configure OTP expiry time
- Set maximum transaction amount
- View all system settings

### 📟 API Console
- Real-time API request/response logs
- Error tracking and debugging
- Request timestamps
- Formatted JSON responses

---

## 🚀 Quick Start

### Step 1: Start Your Backend
```bash
cd UPI-based-service
npm run dev
```

Server should be running on `http://localhost:3000`

### Step 2: Open Dashboard
1. Open `test-dashboard.html` in your browser
   - Or run: `open test-dashboard.html`
   - Or use: File → Open → test-dashboard.html

2. You should see the Testing Dashboard

### Step 3: Test Complete Flow

#### A. User Login with OTP
```
1. Enter Phone: 9876543210
2. Click "📱 Send OTP"
   - OTP will appear in the input field (check console logs too)
3. Enter OTP: (it's auto-filled)
4. Click "✅ Verify OTP"
5. You're logged in! ✅
```

#### B. Send Payment
```
1. Enter Receiver UPI: user@ybl
2. Enter Amount: 500
3. Optional: Add description
4. Click "💳 Create Payment"
5. You'll see transaction ID and payment ID
```

#### C. Check Transaction Status
```
1. Copy Transaction ID from payment result
2. Paste in "Payment Status" section
3. Click "Check Status"
4. View current status (PENDING, SUCCESS, etc.)
```

#### D. View Transaction History
```
1. Click "🔄 Refresh History"
2. See all your transactions
3. View totals and statistics
```

---

## 🎮 Admin Testing (Special Access)

To access admin features:
1. Log in with phone: **9999999999**
2. Admin panel automatically appears
3. You can now:
   - Switch payment providers
   - Update OTP expiry
   - Change max transaction amount
   - View all settings

---

## 📍 Complete Test Flow

### Test Scenario: Full Payment Journey

```
1️⃣ AUTHENTICATION
   └─ Phone: 9876543210
   └─ Send OTP → Receive "123456"
   └─ Verify OTP → Get JWT Token
   └─ Status: ✅ Logged In

2️⃣ SEND PAYMENT
   └─ Receiver UPI: user@ybl
   └─ Amount: ₹500
   └─ Click Create Payment
   └─ Receive: Transaction ID, Payment ID, Status

3️⃣ CHECK STATUS
   └─ Use Transaction ID from step 2
   └─ View current payment status
   └─ Status: PENDING (waiting for webhook)

4️⃣ SIMULATE WEBHOOK
   └─ In real scenario, payment gateway sends webhook
   └─ Backend updates: PENDING → SUCCESS
   └─ Check status again to see update

5️⃣ VIEW HISTORY
   └─ Click "Refresh History"
   └─ See all transactions
   └─ View statistics

6️⃣ ADMIN CONFIG (Optional)
   └─ Log in with: 9999999999
   └─ Switch provider: RAZORPAY → CASHFREE
   └─ Update OTP expiry: 300 → 600 seconds
   └─ Verify changes reflected
```

---

## 🔐 Test Users

Pre-configured test users:

| Phone | Role | Purpose |
|-------|------|---------|
| 9876543210 | User | Regular payments |
| 9999999998 | User | Receiver testing |
| 9999999999 | Admin | Admin settings |

---

## 📟 Console Logs

All API calls are logged to the console at bottom:

```
[10:30:45] INFO: {
  "accessToken": "eyJhbGc...",
  "refreshToken": "...",
  "expiresIn": 900
}

[10:31:12] INFO: {
  "transactionId": "550e8400-e29b-41d4",
  "paymentId": "pay_123xyz",
  "status": "CREATED"
}
```

### How to Use Console
1. Look at the green console at bottom
2. Every API call logged with timestamp
3. See exact response from server
4. Debug any errors
5. Use "Clear Console" button to reset

---

## 🐛 Troubleshooting

### "❌ Failed to fetch" Error
**Problem:** Backend not running
**Solution:** 
```bash
cd UPI-based-service
npm run dev
# Should show: [Nest] 12345  - 04/27/2026, 10:30:45 AM   LOG [NestFactory] Nest application successfully started
```

### "❌ 401 Unauthorized" Error
**Problem:** Token expired or not sent
**Solution:** 
- Re-login (token expires every 15 minutes)
- Check localStorage in DevTools (F12 → Application → LocalStorage)

### "❌ UUID error" in console
**Problem:** Controller not getting user ID correctly
**Solution:** Check JWT token in console logs contains `id` field

### OTP always "123456"
**Note:** This is correct for development!
- Real production: OTP sent via SMS
- Testing: OTP appears in console and auto-fills

---

## 🔍 API Endpoints Being Tested

### Public Endpoints
```
POST   /auth/send-otp
POST   /auth/verify-otp
POST   /webhook/razorpay  (simulated)
```

### Protected Endpoints (with JWT)
```
POST   /payment/create
POST   /payment/status
GET    /transaction/list

GET    /admin/payment-provider
PUT    /admin/payment-provider
GET    /admin/settings
PUT    /admin/settings/{key}
```

---

## 📊 What Gets Tested

### Database Records Created
```
users table
  └─ One record per phone number

transactions table
  └─ One record per payment
  └─ Status: PENDING, SUCCESS, FAILED

payments table
  └─ Links to transaction
  └─ Stores provider info

settings table
  └─ Admin configurations
  └─ Payment provider choice
```

### Authentication Flow
```
✅ OTP sent via Redis (5 min expiry)
✅ JWT token generated
✅ Token stored in localStorage
✅ Used in Authorization header
```

### Payment Flow
```
✅ UPI validation
✅ Transaction created (PENDING)
✅ Payment record created
✅ Provider selected from settings
✅ Status can be checked
✅ History retrievable
```

---

## 🎯 Testing Checklist

Use this to verify everything works:

### Phase 1: Authentication
- [ ] Send OTP works
- [ ] OTP appears in input
- [ ] Verify OTP succeeds
- [ ] Token saved to localStorage
- [ ] Logout clears data

### Phase 2: Payments
- [ ] Can create payment
- [ ] Transaction ID generated
- [ ] Payment ID generated
- [ ] Status shows "CREATED"

### Phase 3: History
- [ ] Refresh history works
- [ ] Transaction appears in list
- [ ] Statistics update
- [ ] Total amount correct

### Phase 4: Status Checking
- [ ] Can check payment status
- [ ] Status matches database
- [ ] Correct transaction ID shown

### Phase 5: Admin (with 9999999999)
- [ ] Admin panel visible
- [ ] Current provider shown
- [ ] Can switch providers
- [ ] Can update OTP expiry
- [ ] Can update max amount

---

## 💡 Pro Tips

1. **Open DevTools (F12)** to see:
   - Network tab: See actual API calls
   - Console tab: See JS errors
   - Application tab: See localStorage/cookies

2. **Check Backend Logs** to see:
   - What backend is receiving
   - Any errors processing requests
   - Database queries executing

3. **Use Multiple Browsers** to:
   - Test different users simultaneously
   - One user = one session
   - Test payment between two users

4. **Check Console Logs** in dashboard for:
   - All API responses
   - Error details
   - Request/response format

---

## 🔒 Security Notes

This dashboard is for **testing only**:

⚠️ Never use with real payment credentials  
⚠️ Test data only (fake amounts, test UPIs)  
⚠️ Only on localhost during development  
⚠️ Don't deploy to production  

---

## 📚 Next Steps

### After Testing Works

1. **Run Database Migrations**
   ```bash
   npm run typeorm migration:run
   ```

2. **Set Up Real Payment Gateway**
   - Configure Razorpay credentials in `.env`
   - Or Cashfree credentials
   - Set webhook URL

3. **Test With Real Gateway**
   - Change API calls to use real credentials
   - Webhook will actually be called
   - Real payments will process

4. **Deploy to Production**
   - Set production payment credentials
   - Enable HTTPS
   - Set up monitoring
   - Configure rate limiting

---

## 🎬 Demo Video Script

```
1. Open dashboard
2. Enter phone: 9876543210
3. Send OTP
4. Verify OTP
5. Enter UPI: user@ybl
6. Send ₹500
7. Check status
8. Refresh history
9. Switch to admin
10. Change payment provider
```

---

## 📞 Support

If something doesn't work:

1. Check **Console Logs** (green section at bottom)
2. Check **Backend Logs** (terminal running npm run dev)
3. Check **Browser Console** (F12 → Console)
4. Verify backend is running on http://localhost:3000
5. Check `.env` has correct configuration

---

## ✅ Success Indicators

You'll know everything works when:

✅ Can log in with OTP  
✅ Can create payments  
✅ Transaction appears in history  
✅ Can check status  
✅ Admin can switch providers  
✅ All console logs show successful responses  
✅ No 401 or 500 errors  

---

Happy testing! 🚀

Questions? Check [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) or backend logs.
