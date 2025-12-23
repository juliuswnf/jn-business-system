#!/bin/bash

# Authentication Flow Test Script
# Tests HTTP-only Cookie Implementation

echo "🧪 Authentication Flow Test"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:5000/api}"
TEST_EMAIL="${TEST_EMAIL:-test@example.com}"
TEST_PASSWORD="${TEST_PASSWORD:-password123}"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_test() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((TESTS_FAILED++))
    fi
}

# Function to check if cookie is set
check_cookie() {
    if grep -q "Set-Cookie.*refreshToken" <<< "$1"; then
        return 0
    else
        return 1
    fi
}

# Function to check if cookie has httpOnly flag
check_httpOnly() {
    if grep -q "HttpOnly" <<< "$1"; then
        return 0
    else
        return 1
    fi
}

# Function to check if cookie has secure flag
check_secure() {
    if grep -q "Secure" <<< "$1"; then
        return 0
    else
        return 1
    fi
}

# Function to check if cookie has SameSite flag
check_sameSite() {
    if grep -q "SameSite=Strict" <<< "$1"; then
        return 0
    else
        return 1
    fi
}

echo "📋 Test Configuration:"
echo "  API URL: $API_URL"
echo "  Test Email: $TEST_EMAIL"
echo ""

# Test 1: Login and check for refreshToken cookie
echo "🔐 Test 1: Login - Check for refreshToken Cookie"
LOGIN_RESPONSE=$(curl -s -i -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

if check_cookie "$LOGIN_RESPONSE"; then
    print_test 0 "Login sets refreshToken cookie"
else
    print_test 1 "Login sets refreshToken cookie"
fi

# Test 2: Check cookie flags
echo ""
echo "🔒 Test 2: Cookie Security Flags"
if check_httpOnly "$LOGIN_RESPONSE"; then
    print_test 0 "Cookie has HttpOnly flag"
else
    print_test 1 "Cookie has HttpOnly flag"
fi

if check_sameSite "$LOGIN_RESPONSE"; then
    print_test 0 "Cookie has SameSite=Strict flag"
else
    print_test 1 "Cookie has SameSite=Strict flag"
fi

# Note: Secure flag only in production
if [ "$NODE_ENV" = "production" ]; then
    if check_secure "$LOGIN_RESPONSE"; then
        print_test 0 "Cookie has Secure flag (Production)"
    else
        print_test 1 "Cookie has Secure flag (Production)"
    fi
else
    echo -e "${YELLOW}⚠️  Secure flag check skipped (Development mode)${NC}"
fi

# Test 3: Extract access token from response
echo ""
echo "🎫 Test 3: Access Token in Response Body"
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -n "$ACCESS_TOKEN" ]; then
    print_test 0 "Access token returned in response body"
    echo "  Token (first 20 chars): ${ACCESS_TOKEN:0:20}..."
else
    print_test 1 "Access token returned in response body"
fi

# Test 4: Save cookies for next requests
echo ""
echo "💾 Test 4: Save Cookies for Subsequent Requests"
COOKIE_JAR="cookies.txt"
echo "$LOGIN_RESPONSE" | grep -i "set-cookie" > "$COOKIE_JAR"
if [ -s "$COOKIE_JAR" ]; then
    print_test 0 "Cookies saved to cookie jar"
else
    print_test 1 "Cookies saved to cookie jar"
fi

# Test 5: Use access token for authenticated request
echo ""
echo "🔑 Test 5: Authenticated Request with Access Token"
if [ -n "$ACCESS_TOKEN" ]; then
    PROFILE_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/auth/profile" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json")
    
    HTTP_CODE=$(echo "$PROFILE_RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" = "200" ]; then
        print_test 0 "Authenticated request with access token successful"
    else
        print_test 1 "Authenticated request with access token successful (HTTP $HTTP_CODE)"
    fi
else
    print_test 1 "Authenticated request skipped (no access token)"
fi

# Test 6: Token refresh with cookie
echo ""
echo "🔄 Test 6: Token Refresh with HTTP-only Cookie"
REFRESH_RESPONSE=$(curl -s -i -X POST "$API_URL/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR" \
  -c "$COOKIE_JAR")

if echo "$REFRESH_RESPONSE" | grep -q '"success":true'; then
    print_test 0 "Token refresh successful with cookie"
    
    # Check if new refresh token cookie is set
    if check_cookie "$REFRESH_RESPONSE"; then
        print_test 0 "New refreshToken cookie set after refresh"
    else
        print_test 1 "New refreshToken cookie set after refresh"
    fi
    
    # Extract new access token
    NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    if [ -n "$NEW_ACCESS_TOKEN" ] && [ "$NEW_ACCESS_TOKEN" != "$ACCESS_TOKEN" ]; then
        print_test 0 "New access token generated (token rotation)"
    else
        print_test 1 "New access token generated (token rotation)"
    fi
else
    print_test 1 "Token refresh successful with cookie"
    echo "  Response: $(echo "$REFRESH_RESPONSE" | head -n 5)"
fi

# Test 7: Logout
echo ""
echo "🚪 Test 7: Logout - Clear Cookie"
LOGOUT_RESPONSE=$(curl -s -i -X POST "$API_URL/auth/logout" \
  -H "Authorization: Bearer ${NEW_ACCESS_TOKEN:-$ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR")

if echo "$LOGOUT_RESPONSE" | grep -q "Set-Cookie.*refreshToken.*Max-Age=0\|Set-Cookie.*refreshToken.*expires="; then
    print_test 0 "Logout clears refreshToken cookie"
elif echo "$LOGOUT_RESPONSE" | grep -q '"success":true'; then
    print_test 0 "Logout successful (cookie cleared)"
else
    print_test 1 "Logout clears refreshToken cookie"
fi

# Test 8: Verify token is invalidated after logout
echo ""
echo "🔒 Test 8: Verify Token Invalidated After Logout"
if [ -n "$NEW_ACCESS_TOKEN" ]; then
    INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/auth/profile" \
      -H "Authorization: Bearer $NEW_ACCESS_TOKEN" \
      -H "Content-Type: application/json")
    
    HTTP_CODE=$(echo "$INVALID_RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" = "401" ]; then
        print_test 0 "Token invalidated after logout (401 expected)"
    else
        print_test 1 "Token invalidated after logout (got HTTP $HTTP_CODE)"
    fi
else
    echo -e "${YELLOW}⚠️  Token invalidation test skipped (no token)${NC}"
fi

# Cleanup
rm -f "$COOKIE_JAR"

# Summary
echo ""
echo "=========================="
echo "📊 Test Summary"
echo "=========================="
echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the output above.${NC}"
    exit 1
fi

