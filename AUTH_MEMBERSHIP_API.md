# Authentication & Membership System API Documentation

## Table of Contents

1. [Authentication Enhancements](#authentication-enhancements)
2. [System Settings Management](#system-settings-management)
3. [Membership Plans](#membership-plans)
4. [Billing Account Management](#billing-account-management)
5. [Usage Tracking](#usage-tracking)
6. [Scheduled Jobs](#scheduled-jobs)

---

## Authentication Enhancements

### CAPTCHA Integration

The system now supports reCAPTCHA v3 for signup and login with admin-configurable settings.

#### Features:
- ✅ CAPTCHA verification on signup (configurable)
- ✅ CAPTCHA verification on login (configurable)
- ✅ Auto-enable CAPTCHA on threshold detection (failed login attempts)
- ✅ Admin toggle for CAPTCHA requirements

#### Login Tracking & Account Lockout:
- Failed login attempts are tracked by email and IP address
- Accounts are temporarily locked after too many failed attempts
- CAPTCHA is automatically required after a configurable threshold
- All login attempts are logged for audit purposes

### Modified Authentication Endpoints

#### POST /api/auth/signup
Register a new user with optional CAPTCHA verification.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "captchaToken": "optional_recaptcha_token"
}
```

**Response:** `201 Created`
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### POST /api/auth/login
Login with optional CAPTCHA and account lockout protection.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "captchaToken": "optional_recaptcha_token"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "jwt_token",
  "refreshToken": "jwt_refresh_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["MEMBER"],
    "avatar": "avatar_url"
  }
}
```

**Error Responses:**
- `429 Too Many Requests` - Account locked due to too many failed attempts
  ```json
  {
    "error": "Account temporarily locked due to too many failed login attempts",
    "lockedUntil": "2025-11-09T12:30:00Z",
    "minutesRemaining": 25
  }
  ```
- `400 Bad Request` - CAPTCHA verification failed
  ```json
  {
    "error": "CAPTCHA verification is required",
    "captchaRequired": true,
    "reason": "Multiple failed login attempts detected"
  }
  ```

---

## System Settings Management

Admin endpoints for configuring system-wide settings including CAPTCHA.

### GET /api/admin/settings/captcha-config
**Public endpoint** - Get CAPTCHA configuration for client-side integration.

**Response:** `200 OK`
```json
{
  "enabled": true,
  "onSignup": true,
  "onLogin": false,
  "siteKey": "your_recaptcha_site_key"
}
```

### GET /api/admin/settings
**Permission Required:** `MANAGE_SYSTEM`

Get all system settings.

**Response:** `200 OK`
```json
{
  "settings": {
    "captchaEnabled": true,
    "captchaOnSignup": true,
    "captchaOnLogin": false,
    "captchaAutoEnableThreshold": 5,
    "recaptchaSecretKey": "***HIDDEN***",
    "recaptchaSiteKey": "your_site_key",
    "loginFailureWindowMinutes": 15,
    "maxLoginAttempts": 10,
    "lockoutDurationMinutes": 30,
    "emailVerificationRequired": true,
    "emailVerificationTokenExpiryHours": 24,
    "accessTokenExpiryMinutes": 15,
    "refreshTokenExpiryDays": 7,
    "trialPeriodDays": 14,
    "gracePeriodDays": 7,
    "updatedAt": "2025-11-09T10:00:00Z",
    "createdAt": "2025-11-09T10:00:00Z"
  }
}
```

### PUT /api/admin/settings
**Permission Required:** `MANAGE_SYSTEM`

Update system settings.

**Request Body:**
```json
{
  "captchaEnabled": true,
  "captchaOnSignup": true,
  "captchaOnLogin": true,
  "captchaAutoEnableThreshold": 3,
  "maxLoginAttempts": 5,
  "lockoutDurationMinutes": 60
}
```

**Response:** `200 OK`
```json
{
  "message": "System settings updated successfully",
  "settings": { /* updated settings */ }
}
```

### PUT /api/admin/settings/captcha
**Permission Required:** `MANAGE_SYSTEM`

Update CAPTCHA-specific settings.

**Request Body:**
```json
{
  "captchaEnabled": true,
  "captchaOnSignup": true,
  "captchaOnLogin": false,
  "captchaAutoEnableThreshold": 5,
  "recaptchaSecretKey": "your_secret_key",
  "recaptchaSiteKey": "your_site_key"
}
```

**Response:** `200 OK`

---

## Membership Plans

Flexible membership plans supporting time-based, usage-based, and hybrid billing models.

### Plan Types:
- **TIME_BASED**: Daily, weekly, monthly, quarterly, semi-annual, yearly subscriptions
- **USAGE_BASED**: Pay per usage (downloads, storage, AI messages, etc.)
- **HYBRID**: Combination of time-based subscription with usage limits and overages
- **FREE**: Free tier with optional limits

### GET /api/admin/membership-plans/public
**Public endpoint** - Get active membership plans for display on pricing pages.

**Response:** `200 OK`
```json
{
  "plans": [
    {
      "_id": "plan_id",
      "name": "Starter",
      "description": "Perfect for individuals",
      "planType": "time_based",
      "billingInterval": "monthly",
      "price": 999,
      "currency": "USD",
      "active": true,
      "features": [
        { "name": "10GB Storage", "enabled": true },
        { "name": "100 Downloads/month", "enabled": true }
      ]
    }
  ],
  "count": 1
}
```

### GET /api/admin/membership-plans
**Permission Required:** `MANAGE_BILLING`

Get all membership plans (including inactive).

**Query Parameters:**
- `active`: Filter by active status (true/false)

**Response:** `200 OK`

### GET /api/admin/membership-plans/:id
**Permission Required:** `MANAGE_BILLING`

Get a specific membership plan.

**Response:** `200 OK`
```json
{
  "plan": {
    "_id": "plan_id",
    "name": "Professional",
    "description": "For professionals and small teams",
    "planType": "hybrid",
    "billingInterval": "monthly",
    "intervalCount": 1,
    "price": 2999,
    "currency": "USD",
    "usageLimits": [
      {
        "metric": "downloads",
        "limit": 500,
        "overageRate": 10,
        "unit": "downloads",
        "hardLimit": false
      },
      {
        "metric": "file_storage",
        "limit": 100,
        "overageRate": 50,
        "unit": "GB",
        "hardLimit": false
      },
      {
        "metric": "ai_messages",
        "limit": 1000,
        "overageRate": 1,
        "unit": "messages",
        "hardLimit": true
      }
    ],
    "features": [
      { "name": "Priority Support", "enabled": true },
      { "name": "Advanced Analytics", "enabled": true }
    ],
    "trialEnabled": true,
    "trialDays": 14,
    "autoRenew": true,
    "gracePeriodDays": 7,
    "active": true
  }
}
```

### POST /api/admin/membership-plans
**Permission Required:** `MANAGE_BILLING`

Create a new membership plan.

**Request Body:**
```json
{
  "name": "Enterprise",
  "description": "For large organizations",
  "planType": "hybrid",
  "billingInterval": "monthly",
  "intervalCount": 1,
  "price": 9999,
  "currency": "USD",
  "usageLimits": [
    {
      "metric": "downloads",
      "limit": 5000,
      "overageRate": 5,
      "unit": "downloads",
      "hardLimit": false
    }
  ],
  "features": [
    { "name": "Dedicated Support", "enabled": true }
  ],
  "trialEnabled": true,
  "trialDays": 30,
  "autoRenew": true,
  "gracePeriodDays": 14,
  "active": true,
  "displayOrder": 3
}
```

**Response:** `201 Created`

### PUT /api/admin/membership-plans/:id
**Permission Required:** `MANAGE_BILLING`

Update a membership plan.

**Response:** `200 OK`

### DELETE /api/admin/membership-plans/:id
**Permission Required:** `MANAGE_BILLING`

Deactivate a membership plan (soft delete).

**Response:** `200 OK`

---

## Billing Account Management

Admin endpoints for managing user billing accounts with override capabilities.

### GET /api/admin/billing-accounts
**Permission Required:** `MANAGE_BILLING`

Get all billing accounts with pagination.

**Query Parameters:**
- `status`: Filter by subscription status
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

**Response:** `200 OK`
```json
{
  "accounts": [
    {
      "_id": "account_id",
      "userId": { "email": "user@example.com", "profile": {...} },
      "membershipPlanId": { "name": "Professional", "price": 2999 },
      "subscriptionStatus": "active",
      "subscriptionStartDate": "2025-11-01T00:00:00Z",
      "subscriptionEndDate": "2025-12-01T00:00:00Z",
      "billingEnabled": true,
      "freeAccessGranted": false,
      "createdAt": "2025-11-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "pages": 3
  }
}
```

### GET /api/admin/billing-accounts/:id
**Permission Required:** `MANAGE_BILLING`

Get a specific billing account with full details.

### GET /api/admin/billing-accounts/:id/usage
**Permission Required:** `MANAGE_BILLING`

Get usage statistics for a billing account.

**Response:** `200 OK`
```json
{
  "billingAccountId": "account_id",
  "currentPeriodUsage": {
    "downloads": 245,
    "file_storage": 45.5,
    "ai_messages": 523
  },
  "subscriptionStatus": "active",
  "subscriptionStartDate": "2025-11-01T00:00:00Z",
  "subscriptionEndDate": "2025-12-01T00:00:00Z",
  "membershipPlan": { /* plan details */ }
}
```

### POST /api/admin/billing-accounts/:id/free-access
**Permission Required:** `MANAGE_BILLING`

Grant free access to a user.

**Request Body:**
```json
{
  "reason": "Educational institution",
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

**Response:** `200 OK`
```json
{
  "message": "Free access granted successfully",
  "account": { /* updated account */ }
}
```

### DELETE /api/admin/billing-accounts/:id/free-access
**Permission Required:** `MANAGE_BILLING`

Revoke free access from a user.

### PUT /api/admin/billing-accounts/:id/billing-enabled
**Permission Required:** `MANAGE_BILLING`

Enable or disable billing for a user.

**Request Body:**
```json
{
  "billingEnabled": false
}
```

### PUT /api/admin/billing-accounts/:id/status
**Permission Required:** `MANAGE_BILLING`

Override subscription status.

**Request Body:**
```json
{
  "status": "suspended",
  "reason": "Payment fraud detected"
}
```

**Valid Statuses:** `active`, `inactive`, `trial`, `cancelled`, `suspended`, `grace_period`

### POST /api/admin/billing-accounts/:id/assign-plan
**Permission Required:** `MANAGE_BILLING`

Assign a membership plan to a billing account.

**Request Body:**
```json
{
  "membershipPlanId": "plan_id",
  "startImmediately": true
}
```

### POST /api/admin/billing-accounts/:id/cancel
**Permission Required:** `MANAGE_BILLING`

Cancel a user's subscription.

**Request Body:**
```json
{
  "immediate": false
}
```

### POST /api/admin/billing-accounts/:id/renew
**Permission Required:** `MANAGE_BILLING`

Manually renew a subscription.

**Response:** `200 OK`

---

## Usage Tracking

Track various usage metrics for billing purposes.

### Supported Usage Metrics:
- `downloads`: Number of file downloads
- `file_storage`: File storage in GB
- `active_time`: Active usage time in minutes
- `ai_messages`: AI/chatbot messages sent
- `ai_compute`: AI computation units
- `api_calls`: API requests
- `sms_sent`: SMS messages sent
- `data_transfer`: Data transfer in GB

### Usage Limit Enforcement:
- **Soft Limits**: Allow overages with additional charges
- **Hard Limits**: Block usage when limit is reached

---

## Scheduled Jobs

Automated background tasks for subscription management.

### Jobs Running Every Hour:
1. **Process Expired Subscriptions**
   - Finds subscriptions that have ended
   - Attempts auto-renewal if enabled
   - Moves to grace period if renewal fails

2. **Process Expired Grace Periods**
   - Suspends accounts where grace period has ended

### Jobs Running Daily (Midnight):
1. **Process Expired Free Access Grants**
   - Revokes free access that has expired
   - Suspends accounts if no active subscription

---

## Subscription Lifecycle

### States:
1. **trial**: Account in trial period
2. **active**: Active subscription with valid payment
3. **grace_period**: Subscription expired, in grace period
4. **suspended**: Account suspended (no access)
5. **cancelled**: User cancelled subscription
6. **inactive**: No active subscription

### State Transitions:
```
signup → trial (if trial enabled) → active
active → grace_period (payment failed/expired) → suspended
active → cancelled (user cancellation)
suspended → active (admin override or payment resolved)
```

### Admin Override Capabilities:
- Grant free access (bypass billing)
- Disable billing entirely for specific users
- Override subscription status
- Manually renew subscriptions
- Suspend/unsuspend accounts

---

## Security Features

### Login Protection:
- Failed login attempt tracking
- Automatic account lockout (configurable threshold)
- CAPTCHA auto-enable on suspicious activity
- Audit logging of all login attempts

### CAPTCHA Integration:
- reCAPTCHA v3 support
- Score-based verification (0.0-1.0)
- Configurable minimum score threshold
- Admin toggle for signup/login requirements

### Email Verification:
- Mandatory email verification (configurable)
- 24-hour token expiry (configurable)
- Blocks unverified users from logging in

---

## Environment Variables

Add these to your `.env` file:

```env
# reCAPTCHA (optional - can be configured via admin panel)
RECAPTCHA_SITE_KEY=your_recaptcha_v3_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_v3_secret_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# JWT
ACCESS_TOKEN_SECRET=your_secret_here
REFRESH_TOKEN_SECRET=your_refresh_secret_here

# Frontend
FRONTEND_URL=http://localhost:5173
```

---

## Client-Side Integration

### reCAPTCHA v3 Integration

1. **Add reCAPTCHA script to your HTML:**
```html
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
```

2. **Get CAPTCHA configuration:**
```javascript
const response = await fetch('/api/admin/settings/captcha-config');
const config = await response.json();

if (config.enabled && config.onSignup) {
  // CAPTCHA is required for signup
}
```

3. **Execute reCAPTCHA on form submission:**
```javascript
async function handleSignup(formData) {
  let captchaToken = null;

  // Get CAPTCHA token if required
  if (captchaRequired) {
    captchaToken = await grecaptcha.execute(SITE_KEY, { action: 'signup' });
  }

  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...formData,
      captchaToken
    })
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.captchaRequired) {
      // Re-submit with CAPTCHA
    }
  }
}
```

---

## Migration Guide

### For Existing Applications:

1. **Install dependencies:**
```bash
npm install axios node-cron @types/node-cron
```

2. **Initialize system settings:**
```javascript
// Run once to create default settings
const SystemSettings = require('./models/SystemSettings');
await SystemSettings.create({});
```

3. **Configure reCAPTCHA (optional):**
   - Get keys from https://www.google.com/recaptcha/admin
   - Update via admin panel: `PUT /api/admin/settings/captcha`

4. **Create membership plans:**
```bash
curl -X POST http://localhost:5000/api/admin/membership-plans \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Free", "planType": "free", "price": 0, ... }'
```

5. **Assign plans to existing users:**
```bash
curl -X POST http://localhost:5000/api/admin/billing-accounts/:id/assign-plan \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "membershipPlanId": "plan_id" }'
```

---

## Testing

### Test CAPTCHA:
```bash
# With CAPTCHA disabled
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Enable CAPTCHA via admin panel
curl -X PUT http://localhost:5000/api/admin/settings/captcha \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"captchaEnabled":true,"captchaOnSignup":true}'

# Signup now requires CAPTCHA token
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"password123","firstName":"Test","lastName":"User","captchaToken":"YOUR_TOKEN"}'
```

### Test Account Lockout:
```bash
# Trigger failed login attempts
for i in {1..11}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}'
done

# Account should now be locked
# Response: 429 Too Many Requests
```

---

## Troubleshooting

### CAPTCHA not working:
- Verify `recaptchaSiteKey` and `recaptchaSecretKey` in system settings
- Check browser console for reCAPTCHA errors
- Ensure domain is registered in reCAPTCHA admin console

### Subscriptions not expiring:
- Check if scheduled jobs are running: Look for `[CRON]` logs
- Verify node-cron is installed
- Check server timezone settings

### Usage limits not enforced:
- Verify membership plan has `usageLimits` configured
- Check if `hardLimit` is set to `true` for strict enforcement
- Review current period usage: `GET /api/admin/billing-accounts/:id/usage`

---

## Best Practices

1. **CAPTCHA Configuration:**
   - Start with `captchaOnSignup: true` to prevent spam
   - Use `captchaAutoEnableThreshold` for adaptive security
   - Monitor `captchaOnLogin` impact on user experience

2. **Membership Plans:**
   - Always offer a free tier for user acquisition
   - Use hybrid plans for predictable revenue with usage flexibility
   - Set `hardLimit: true` for expensive resources (AI compute)

3. **Grace Periods:**
   - Configure `gracePeriodDays` based on your billing cycle
   - Send email notifications when entering grace period
   - Auto-suspend after grace period to prevent abuse

4. **Admin Overrides:**
   - Document all free access grants with clear reasons
   - Set expiry dates for temporary free access
   - Audit admin actions regularly

5. **Usage Tracking:**
   - Track all billable actions immediately
   - Implement usage dashboards for transparency
   - Send usage alerts when approaching limits

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs for `[CRON]` and error messages
3. Verify system settings: `GET /api/admin/settings`
4. Check audit logs for suspicious activity

---

**Version:** 1.0.0
**Last Updated:** November 9, 2025
