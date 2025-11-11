# Email Configuration Guide

## Overview
The application requires a configured email service to send verification emails and password reset links to users.

## Current Status
You're seeing this error because email credentials are not configured:
```
Failed to send email: Error: Missing credentials for "PLAIN"
```

## Setup Instructions

### Option 1: Gmail (Recommended for Development)

1. **Create or use a Gmail account**
   - Use an existing Gmail account or create a new one specifically for your app

2. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

3. **Generate an App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Google will generate a 16-character password
   - **Copy this password** - you won't see it again

4. **Update your `.env` file**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   EMAIL_FROM=noreply@mernplatform.com
   ```

5. **Restart your server**
   - The email service should now work!

### Option 2: Other Email Providers

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

#### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your-mailgun-password
EMAIL_FROM=noreply@yourdomain.com
```

#### AWS SES
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-aws-smtp-username
EMAIL_PASSWORD=your-aws-smtp-password
EMAIL_FROM=noreply@yourdomain.com
```

## Testing Email Configuration

After setting up, test by:
1. Restart your server
2. Try to sign up a new user
3. Check the server logs for "Email sent successfully" or error messages
4. Check your email inbox for the verification email

## Troubleshooting

### "Missing credentials" error
- Make sure `EMAIL_USER` and `EMAIL_PASSWORD` are set in `.env`
- Ensure `.env` file is in the `server/` directory
- Restart your server after changing `.env`

### "Invalid login" or "Authentication failed"
- For Gmail: Use an App Password, not your regular Gmail password
- Verify the email and password are correct
- Check if your email provider requires additional setup

### Emails not arriving
- Check spam/junk folder
- Verify `EMAIL_FROM` is valid
- Some providers require domain verification for custom FROM addresses

## Development Mode

For development, you can temporarily disable email verification:
1. Comment out the email verification check in `auth.controller.ts`
2. Or manually set `verified: true` in the database for test users

**Note:** Re-enable email verification before deploying to production!

## Security Notes

- **Never commit your `.env` file to version control**
- Use strong, unique passwords for email accounts
- Consider using environment-specific email accounts (dev, staging, prod)
- Rotate email credentials regularly
- Use read-only API keys when possible
