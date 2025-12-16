#!/bin/bash

# 🚀 JN Business System - Production Health Check Script
# Run after Railway/Vercel deployment

echo "🔍 JN BUSINESS SYSTEM - PRODUCTION HEALTH CHECK"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables (UPDATE THESE)
RAILWAY_DOMAIN="your-railway-domain.up.railway.app"
VERCEL_DOMAIN="jn-automation.vercel.app"

# Check if domains are set
if [ "$RAILWAY_DOMAIN" = "your-railway-domain.up.railway.app" ]; then
    echo -e "${RED}❌ Error: Please update RAILWAY_DOMAIN in this script${NC}"
    echo "   Find your domain: Railway Dashboard → Service → Settings → Domains"
    exit 1
fi

echo "Testing Backend: https://$RAILWAY_DOMAIN"
echo "Testing Frontend: https://$VERCEL_DOMAIN"
echo ""

# Test 1: Backend Health Check
echo "1️⃣  Testing Backend Health..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$RAILWAY_DOMAIN/health")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "   ${GREEN}✅ Backend Health: OK (200)${NC}"
else
    echo -e "   ${RED}❌ Backend Health: FAILED ($HEALTH_RESPONSE)${NC}"
fi

# Test 2: Database Connection
echo "2️⃣  Testing Database Connection..."
DB_STATUS=$(curl -s "https://$RAILWAY_DOMAIN/health" | grep -o '"database":[^,}]*' | grep -o 'healthy\|ERROR\|unhealthy')

if [ "$DB_STATUS" = "healthy" ]; then
    echo -e "   ${GREEN}✅ Database: Connected${NC}"
else
    echo -e "   ${RED}❌ Database: $DB_STATUS${NC}"
fi

# Test 3: Stripe Integration
echo "3️⃣  Testing Stripe Integration..."
STRIPE_STATUS=$(curl -s "https://$RAILWAY_DOMAIN/health" | grep -o '"stripe":[^}]*' | grep -o 'healthy\|ERROR\|unhealthy')

if [ "$STRIPE_STATUS" = "healthy" ]; then
    echo -e "   ${GREEN}✅ Stripe: Configured${NC}"
else
    echo -e "   ${YELLOW}⚠️  Stripe: $STRIPE_STATUS${NC}"
fi

# Test 4: Email Queue
echo "4️⃣  Testing Email Queue..."
EMAIL_STATUS=$(curl -s "https://$RAILWAY_DOMAIN/health" | grep -o '"emailQueue":[^}]*' | grep -o 'healthy\|ERROR\|unhealthy')

if [ "$EMAIL_STATUS" = "healthy" ]; then
    echo -e "   ${GREEN}✅ Email Queue: Running${NC}"
else
    echo -e "   ${YELLOW}⚠️  Email Queue: $EMAIL_STATUS${NC}"
fi

# Test 5: Frontend Accessibility
echo "5️⃣  Testing Frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$VERCEL_DOMAIN")

if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "   ${GREEN}✅ Frontend: Accessible (200)${NC}"
else
    echo -e "   ${RED}❌ Frontend: FAILED ($FRONTEND_RESPONSE)${NC}"
fi

# Test 6: CORS Configuration
echo "6️⃣  Testing API Connectivity (CORS)..."
API_TEST=$(curl -s -H "Origin: https://$VERCEL_DOMAIN" -I "https://$RAILWAY_DOMAIN/api/system/version" | grep -i "access-control-allow-origin")

if [ ! -z "$API_TEST" ]; then
    echo -e "   ${GREEN}✅ CORS: Configured${NC}"
else
    echo -e "   ${RED}❌ CORS: Not configured (check CORS_ORIGIN variable)${NC}"
fi

echo ""
echo "================================================"
echo "📊 SUMMARY"
echo "================================================"
echo ""
echo "Backend URL: https://$RAILWAY_DOMAIN"
echo "Frontend URL: https://$VERCEL_DOMAIN"
echo "Health Endpoint: https://$RAILWAY_DOMAIN/health"
echo "API Base: https://$RAILWAY_DOMAIN/api"
echo ""
echo "Next Steps:"
echo "1. Open https://$VERCEL_DOMAIN in browser"
echo "2. Check browser console (F12) for errors"
echo "3. Test registration flow"
echo "4. Run full checklist: See PRODUCTION_CHECKLIST.md"
echo ""
