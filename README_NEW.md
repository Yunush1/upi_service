# 💳 UPI Payment Backend - NestJS + PostgreSQL

A scalable, production-ready backend system for UPI-style payments with OTP authentication, transaction management, and payment gateway integration.

## 📚 Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Configuration](#configuration)
- [Docker Setup](#docker-setup)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.0.0
- PostgreSQL >= 12
- Redis (optional, for caching)
- npm >= 10.0.0

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env

# 3. Configure .env with your values
# Edit .env and set:
# - JWT_SECRET
# - Database credentials
# - Redis connection

# 4. Run migrations
npm run typeorm migration:run

# 5. Start development server
npm run dev
```

### Health Check
```bash
curl http://localhost:3000/health
```

---

## ✨ Features

### 🔐 Authentication
- OTP-based login (phone verification)
- JWT tokens (access + refresh)
- Redis-based OTP storage (5 min expiry)
- Automatic user creation on first login
- Secure token refresh mechanism

### 💳 Payment Processing
- UPI payment initiation
- Payment gateway integration (Razorpay/Cashfree ready)
- Transaction status tracking
- Secure webhook signature verification
- Payment history and statistics

### 📊 Transaction Management
- All transaction types (SEND, RECEIVE, REFUND)
- Real-time status updates (PENDING, SUCCESS, FAILED, CANCELLED)
- Advanced filtering and pagination
- User-specific transaction analytics
- Metadata storage for custom data

### 🔔 Notifications
- Multi-channel support (Email, SMS, Push, In-app)
- Transaction status alerts
- Payment confirmations
- Extensible notification service

### 🛡️ Security
- JWT authentication
- Input validation (class-validator)
- OTP expiration handling
- Webhook signature verification
- CORS protection
- Rate limiting ready

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js 20+ |
| **Framework** | NestJS 11 |
| **Language** | TypeScript 5 |
| **Database** | PostgreSQL 12+ |
| **ORM** | TypeORM |
| **Auth** | JWT + Passport.js |
| **Cache** | Redis (ioredis) |
| **Validation** | class-validator |
| **Queue** | BullMQ (optional) |
| **Testing** | Jest |
| **API Docs** | Swagger |

---

## 📁 Project Structure

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/
│   │   ├── guards/
│   │   └── strategies/
│   │
│   ├── payment/
│   │   ├── payment.controller.ts
│   │   ├── payment.service.ts
│   │   ├── payment.module.ts
│   │   └── dto/
│   │
│   ├── transaction/
│   │   ├── transaction.controller.ts
│   │   ├── transaction.service.ts
│   │   ├── transaction.module.ts
│   │   └── dto/
│   │
│   ├── webhook/
│   │   ├── webhook.controller.ts
│   │   ├── webhook.service.ts
│   │   ├── webhook.module.ts
│   │   └── dto/
│   │
│   ├── notification/
│   │   ├── notification.service.ts
│   │   ├── notification.module.ts
│   │   └── dto/
│   │
│   └── user/
│       ├── user.controller.ts
│       ├── user.service.ts
│       └── user.module.ts
│
├── database/
│   ├── entities/
│   │   ├── user.entity.ts
│   │   ├── session.entity.ts
│   │   ├── transaction.entity.ts
│   │   └── payment.entity.ts
│   ├── migrations/
│   ├── database.module.ts
│   └── database.config.ts
│
├── config/
│   ├── redis.config.ts
│   └── database.config.ts
│
├── common/
│   ├── decorators/
│   ├── filters/
│   └── middleware/
│
├── utils/
│   └── redis.service.ts
│
├── app.module.ts
├── app.controller.ts
├── app.service.ts
└── main.ts
```

---

## 📡 API Documentation

### Authentication Endpoints

#### 1. Send OTP (Public)
```http
POST /auth/send-otp
Content-Type: application/json

{
  "phone": "9876543210"
}
```

#### 2. Verify OTP & Get Token (Public)
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456"
}

Response:
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Payment Endpoints (Protected)

#### 1. Create Payment
```http
POST /payment/create
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "amount": 100,
  "receiverUpi": "user@upi",
  "description": "Payment for service"
}
```

#### 2. Validate UPI
```http
POST /payment/validate-upi
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "upiId": "user@upi"
}
```

#### 3. Get Payment Status
```http
POST /payment/status
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "transactionId": "uuid-here"
}
```

#### 4. List Payments
```http
GET /payment/list?limit=10&offset=0
Authorization: Bearer {accessToken}
```

### Transaction Endpoints (Protected)

#### 1. Get Transaction Details
```http
POST /transaction/:id
Authorization: Bearer {accessToken}

{
  "transactionId": "uuid-here"
}
```

#### 2. List Transactions
```http
GET /transaction/list?status=SUCCESS&limit=20&offset=0
Authorization: Bearer {accessToken}
```

#### 3. Get Statistics
```http
GET /transaction/stats
Authorization: Bearer {accessToken}
```

### Webhook Endpoints (Public)

#### 1. Razorpay Webhook
```http
POST /webhook/razorpay
x-razorpay-signature: {signature}
Content-Type: application/json

{
  "id": "event_id",
  "event": "payment.captured",
  "payload": { ... }
}
```

#### 2. Cashfree Webhook
```http
POST /webhook/cashfree
Content-Type: application/json

{ ... }
```

---

## 🔐 Authentication

### Token Flow
1. User sends phone number → OTP is sent and stored in Redis (5 min)
2. User verifies OTP → JWT tokens are generated
3. Access Token (15 min) for API requests
4. Refresh Token (7 days) for getting new access tokens

### Using Tokens

**Format:**
```
Authorization: Bearer {accessToken}
```

**Example:**
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3000/payment/list
```

See [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) for detailed examples.

---

## ⚙️ Configuration

### Environment Variables (.env)

```env
# Server
NODE_ENV=development
PORT=3000

# JWT (IMPORTANT: Use same secret for signing and verification)
JWT_SECRET=your_jwt_secret_key_change_in_production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/upi_db
DB_LOGGING=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# CORS
CORS_ORIGIN=*

# Payment Gateway
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### JWT Configuration
The JWT secret is critical for security:
- Used for both signing tokens (auth.service) and verifying tokens (jwt.strategy)
- Must match across all instances in production
- Rotate periodically for enhanced security

---

## 🐳 Docker Setup

### Build Image
```bash
docker build -t upi-backend .
```

### Run Container
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:password@db:5432/upi_db \
  -e JWT_SECRET=your_secret \
  -e REDIS_HOST=redis \
  upi-backend
```

### Using Docker Compose
```bash
docker-compose up -d
```

Check [docker-compose.yml](./docker-compose.yml) for service configuration.

---

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# Watch mode
npm test:watch

# Coverage report
npm test:cov

# E2E tests
npm run test:e2e
```

### Manual Testing with cURL

```bash
# 1. Send OTP
curl -X POST http://localhost:3000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'

# 2. Verify OTP (check console for actual OTP)
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "otp": "123456"}'

# 3. Create Payment (use token from step 2)
curl -X POST http://localhost:3000/payment/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {accessToken}" \
  -d '{
    "amount": 100,
    "receiverUpi": "user@upi",
    "description": "Test payment"
  }'
```

---

## 📝 Development Commands

```bash
# Start development server (with auto-reload)
npm run dev

# Debug mode
npm run debug

# Build for production
npm build

# Production mode
npm run prod

# Run migrations
npm run typeorm migration:run

# Create new migration
npm run typeorm migration:generate

# Linting
npm run lint

# Format code
npm run format
```

---

## 🐛 Troubleshooting

### Issue: 401 Unauthorized

**Solution:** See [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md#troubleshooting)

Key checks:
1. Verify JWT_SECRET in .env matches signing and verification
2. Ensure token is in correct format: `Authorization: Bearer {token}`
3. Check token hasn't expired (15 min for access token)
4. Verify JWT_SECRET is loaded from environment

### Issue: Database Connection Failed

```bash
# Check PostgreSQL is running
psql postgresql://user:password@localhost:5432/upi_db

# Check .env DATABASE_URL is correct
grep DATABASE_URL .env

# Run migrations
npm run typeorm migration:run
```

### Issue: Redis Connection Failed

```bash
# Check Redis is running
redis-cli ping

# Verify REDIS_HOST and REDIS_PORT in .env
grep REDIS .env

# Restart Redis if needed
redis-server
```

### Issue: OTP Not Received

OTPs are logged to console in development:
```bash
# Check server logs
npm run dev | grep "OTP for"
```

---

## 🚀 Production Checklist

- [ ] Set strong JWT_SECRET (use password generator)
- [ ] Enable database SSL/TLS
- [ ] Configure CORS_ORIGIN to your domain
- [ ] Use Redis password
- [ ] Enable rate limiting
- [ ] Set NODE_ENV=production
- [ ] Configure external email/SMS service
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Use secrets manager (AWS Secrets, HashiCorp Vault)
- [ ] Enable HTTPS
- [ ] Set up API rate limiting
- [ ] Configure payment gateway secrets

---

## 📚 Additional Resources

- [Authentication Guide](./AUTHENTICATION_GUIDE.md) - Detailed auth setup and examples
- [NestJS Docs](https://docs.nestjs.com)
- [TypeORM Docs](https://typeorm.io)
- [JWT.io](https://jwt.io) - JWT debugger and info
- [Razorpay Docs](https://razorpay.com/docs) - Payment gateway

---

## 📞 Support

For issues or questions:
1. Check [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md)
2. Review logs: `npm run dev 2>&1 | grep -i error`
3. Check database connection: `npm run typeorm schema:drop && npm run typeorm migration:run`

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🎯 Roadmap

- [ ] Refresh token endpoint
- [ ] Transaction notifications
- [ ] QR code payments
- [ ] Fraud detection
- [ ] Admin dashboard
- [ ] Analytics API
- [ ] Mobile push notifications
- [ ] Multi-currency support

---

**Happy coding! 🚀**
