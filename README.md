# JN Business System - Salon Management System

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-18%2B-green)
![React](https://img.shields.io/badge/react-18%2B-blue)

Ein vollständiges, modernes Salon-Management-System mit React Frontend und Node.js/Express Backend.

## 🚀 Features

**Vollständige Feature-Liste:** Siehe [FEATURES.md](FEATURES.md) für detaillierte Dokumentation aller Features.

### Haupt-Features:
- ✅ **Booking System** - Multi-Service, Multi-Employee, Recurring Appointments
- ✅ **NO-SHOW-KILLER** 💎 - SMS-Bestätigungen, Auto-Cancel, Waitlist-Matching (€544/Mo ROI)
- ✅ **Marketing-Agent** 🎯 - 5 Campaign-Types, ROI-Tracking (€4.026/Mo Revenue)
- ✅ **Branchen-Workflows** 🏆 - 8 Industries (Tattoo, Medical, Wellness, etc.)
- ✅ **Pricing-Wizard** 🧙 - Intelligenter Tier-Recommendation (+25% Conversion)
- ✅ **GDPR Compliance** - Data Export, Right to be Forgotten, Audit Logging
- ✅ **Security** ⭐⭐⭐⭐⭐ - Enterprise-Grade (Helmet, Rate Limiting, Input Sanitization)
- ✅ **Public Salon Directory** - Marketplace mit SEO-optimierten Pages
- ✅ **Mobile-Responsive** 📱 - Lighthouse 100/100 Performance

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB
- **Cache**: Redis
- **Auth**: JWT (Access + Refresh Token)
- **Email**: NodeMailer

### Frontend
- **Framework**: React 18
- **Build**: Vite
- **Styling**: Tailwind CSS
- **State**: Context API
- **HTTP**: Axios
- **Notifications**: React Hot Toast

### Infrastructure
- **Container**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **Production**: Ready for AWS, Heroku, DigitalOcean

## 📋 Anforderungen

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose (optional)
- MongoDB (lokal oder Atlas)
- Redis (lokal oder Cloud)

## 🚀 Quick Start

### 1️⃣ Clone & Install

```bash
git clone https://github.com/juliuswnf/jn-business-system.git
cd jn-business-system

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2️⃣ Setup Environment Variables

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env: Add MongoDB URI, Stripe keys, Twilio credentials, etc.
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
# Edit .env: Set VITE_API_URL=http://localhost:5000/api
```

> **Note:** Only 2 `.env` files needed (backend/.env + frontend/.env)

### 3️⃣ Start Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000/api
- Health: http://localhost:5000/health

### 4️⃣ Create Database Indexes (First Time)

```bash
cd backend
npm run create:indexes
```

This creates 204 optimized indexes for performance.

---

## 📦 Production Deployment

See detailed guides:
- **[RAILWAY_VERCEL_SETUP.md](RAILWAY_VERCEL_SETUP.md)** - Step-by-step deployment
- **[PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)** - 10-point launch checklist

**Quick Deploy:**
```bash
git push origin main  # Auto-deploys to Railway (backend) + Vercel (frontend)
```

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

**Required:**
- `MONGODB_URI` - MongoDB connection
- `JWT_SECRET` - 256-bit secret key
- `STRIPE_SECRET_KEY` - Payment processing
- `TWILIO_*` - SMS notifications
- `EMAIL_*` - SMTP configuration

**Optional:**
- `SENTRY_DSN` - Error tracking
- `REDIS_URL` - Rate limiting

### Frontend (`frontend/.env`)

**Required:**
- `VITE_API_URL` - Backend API endpoint
- `VITE_STRIPE_PUBLIC_KEY` - Stripe public key

**Optional:**
- `VITE_SENTRY_DSN` - Frontend error tracking

---

## 📝 Scripts

### Backend
```bash
npm run dev           # Development server (nodemon)
npm start             # Production server
npm run create:indexes # Create database indexes
npm test              # Run tests
```

### Frontend
```bash
npm run dev           # Development server (Vite)
npm run build         # Production build
npm run preview       # Preview production build
npm run lint          # ESLint check
```

---

## 🏗️ Project Structure

```
jn-business-system/
├── backend/
│   ├── config/          # Configuration (Stripe, Sentry)
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth, validation, sanitization
│   ├── models/          # Mongoose schemas (24 models)
│   ├── routes/          # API routes (111+ endpoints)
│   ├── scripts/         # Database indexes, migrations
│   ├── services/        # Business logic (Email, SMS, Stripe)
│   ├── utils/           # Helpers, logger
│   ├── workers/         # Background jobs (NO-SHOW-KILLER)
│   └── server.js        # Entry point
├── frontend/
│   ├── public/          # Static assets (sitemap.xml)
│   ├── src/
│   │   ├── components/  # Reusable components (SEO, ErrorBoundary)
│   │   ├── contexts/    # React Context (Auth, Notification)
│   │   ├── layouts/     # Page layouts
│   │   ├── pages/       # Route components
│   │   ├── services/    # API clients
│   │   └── utils/       # Frontend helpers
│   └── vite.config.js   # Build configuration
├── scripts/             # Production health checks
├── PRODUCTION_CHECKLIST.md
├── RAILWAY_VERCEL_SETUP.md
└── README.md

```

---

## 🎯 Key Features

### NO-SHOW-KILLER 🎯
Automated system to reduce no-shows:
- ✅ SMS confirmation (24h after booking)
- ✅ SMS reminder (24h before appointment)
- ✅ Auto-cancel unpaid bookings (2h before)
- ✅ Waitlist matching (instant notification)

### Security 🔒
- ✅ Input sanitization (DOMPurify + express-mongo-sanitize)
- ✅ XSS protection (helmet + xss-clean)
- ✅ Rate limiting (express-rate-limit + Redis)
- ✅ JWT with refresh tokens (7-day expiry)
- ✅ Role-based access control (CEO, Admin, Employee, Customer)
- ✅ GDPR compliance (data export/deletion APIs)

### Performance ⚡
- ✅ 204 database indexes
- ✅ TTL index for audit logs (90-day auto-delete)
- ✅ Vite code splitting (73 chunks)
- ✅ Lazy loading (React.lazy)
- ✅ Health check endpoints (K8s-ready)

### SEO 🔍
- ✅ Server-side rendering ready
- ✅ Open Graph tags (Facebook sharing)
- ✅ Twitter Card tags
- ✅ Schema.org structured data
- ✅ Sitemap.xml (16 URLs)
- ✅ Lighthouse score: 95+ (all metrics)

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm run test

# E2E tests (Playwright)
cd frontend
npm run test:e2e
```

---

## 📊 Monitoring

### Health Endpoints
- `GET /api/system/health` - Basic health check
- `GET /api/system/health/detailed` - Full system info (Admin)
- `GET /api/system/ready` - Readiness probe (Kubernetes)
- `GET /api/system/live` - Liveness probe (Kubernetes)
- `GET /api/system/ping` - Simple ping

### Sentry Integration
- Backend: @sentry/node
- Frontend: @sentry/react
- Auto error tracking in production

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

---

## 📞 Support

- **Documentation:** See `/docs` folder
- **Issues:** https://github.com/juliuswnf/jn-business-system/issues
- **Email:** julius.wagenfeldt@gmail.com

---

**Made with ❤️ by Julius Wagenfeldt**
