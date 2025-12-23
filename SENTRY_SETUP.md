# 🔥 Sentry Monitoring Setup

## ✅ Status: COMPLETED

Sentry ist vollständig integriert für Backend und Frontend!

## 📋 Environment Variables

### Backend (.env)
```bash
# Sentry Configuration
SENTRY_DSN=https://your-backend-sentry-dsn@sentry.io/project-id
SENTRY_ENABLED=true  # Optional: Enable in development
```

### Frontend (.env)
```bash
# Sentry Configuration
VITE_SENTRY_DSN=https://your-frontend-sentry-dsn@sentry.io/project-id
VITE_SENTRY_ENABLED=true  # Optional: Enable in development
```

## 🚀 Getting Started

1. **Sign up at [sentry.io](https://sentry.io/signup/)** (Free tier: 5k errors/month)

2. **Create 2 Projects:**
   - `jn-business-system-backend` (Node.js)
   - `jn-business-system-frontend` (React)

3. **Copy DSNs** to your `.env` files

4. **Test Monitoring:**
   ```bash
   # Backend Test
   curl http://localhost:5000/api/test-sentry
   
   # Frontend Test (in browser console)
   throw new Error('Test Sentry Frontend!');
   ```

## 📊 Features

### Backend
- ✅ Error tracking
- ✅ Performance monitoring (traces)
- ✅ Profiling (CPU profiling)
- ✅ Request tracing
- ✅ MongoDB query tracking
- ✅ Automatic error capture
- ✅ Sensitive data redaction

### Frontend
- ✅ Error tracking
- ✅ Performance monitoring
- ✅ Session replay (10% of sessions, 100% on errors)
- ✅ Browser tracing
- ✅ Automatic error capture
- ✅ Sensitive data redaction

## 🔧 Configuration

### Backend (`backend/config/sentry.js`)
- Traces: 10% in production, 100% in development
- Profiling: 10% in production, 100% in development
- Only sends 5xx errors to Sentry

### Frontend (`frontend/src/main.jsx`)
- Traces: 10% in production, 100% in development
- Session Replay: 10% of sessions, 100% on errors
- Filters out known non-critical errors (e.g., ResizeObserver)

## 🧪 Test Endpoints

### Backend
- `GET /api/test-sentry` - Test error tracking
- `GET /api/test-sentry-message` - Test message tracking

### Frontend
- Open browser console and run:
  ```javascript
  throw new Error('Test Sentry Frontend!');
  ```

## 📝 Notes

- Sentry is **disabled by default** in development unless `SENTRY_ENABLED=true`
- Sentry is **enabled automatically** in production if `SENTRY_DSN` is set
- All sensitive data (passwords, tokens, cookies) is automatically redacted
- Test endpoints are only available in development or when `SENTRY_ENABLED=true`

