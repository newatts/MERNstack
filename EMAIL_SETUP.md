# Email Configuration Guide

## Quick Start

1. Copy the `.env.example` file to `.env` in the `server` directory:
```bash
cp server/.env.example server/.env
```

2. Edit `server/.env` and configure your email settings

## Email Provider Configuration

### Gmail

For Gmail, you need to use an **App Password** (not your regular password):

1. Enable 2-Factor Authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate a new App Password for "Mail"
4. Use the generated password in your `.env` file

**Configuration:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM=noreply@yourdomain.com
```

### Outlook/Hotmail

**Configuration:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@yourdomain.com
```

### Office 365

**Configuration:**
```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@yourdomain.com
```

### Yahoo Mail

**Configuration:**
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

Note: Yahoo also requires an App Password. Generate one at: https://login.yahoo.com/account/security

### SendGrid

**Configuration:**
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

### Mailgun

**Configuration:**
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your-mailgun-smtp-password
EMAIL_FROM=noreply@yourdomain.com
```

### AWS SES (Simple Email Service)

**Configuration:**
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-aws-smtp-username
EMAIL_PASSWORD=your-aws-smtp-password
EMAIL_FROM=verified-email@yourdomain.com
```

Note: Email address must be verified in AWS SES console

## Development/Testing

For development and testing, you can use services like:

### Mailtrap (Recommended for Development)

Mailtrap catches all emails in a sandbox without sending them to real recipients.

1. Sign up at https://mailtrap.io
2. Get your SMTP credentials from the inbox settings

**Configuration:**
```env
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-mailtrap-username
EMAIL_PASSWORD=your-mailtrap-password
EMAIL_FROM=noreply@example.com
```

### Ethereal Email (Free Testing)

Ethereal creates temporary test accounts automatically:

1. Visit https://ethereal.email
2. Click "Create Ethereal Account"
3. Use the provided credentials

## Troubleshooting

### Error: "Missing credentials for 'PLAIN'"

This means your `.env` file is missing or `EMAIL_USER` and `EMAIL_PASSWORD` are not set.

**Solution:**
1. Ensure `server/.env` file exists
2. Verify `EMAIL_USER` and `EMAIL_PASSWORD` are set correctly
3. Restart your server after changing `.env`

### Error: "Invalid login"

**Solutions:**
- For Gmail: Use App Password instead of regular password
- For Yahoo: Use App Password instead of regular password
- Check that username/password are correct
- Ensure 2FA is enabled (for Gmail/Yahoo)

### Error: "Connection refused"

**Solutions:**
- Check `EMAIL_HOST` is correct for your provider
- Verify `EMAIL_PORT` (usually 587 for TLS or 465 for SSL)
- Check firewall settings
- Ensure your hosting provider allows SMTP connections

### Emails not being received

**Solutions:**
- Check spam/junk folder
- For production: Verify domain SPF, DKIM, and DMARC records
- For AWS SES: Ensure email addresses are verified (sandbox mode)
- Check email provider's sending limits

## Security Best Practices

1. **Never commit `.env` file to version control** - it contains sensitive credentials
2. **Use App Passwords** when available (Gmail, Yahoo)
3. **Use environment-specific credentials** - different for dev/staging/production
4. **Rotate credentials regularly** - especially if exposed
5. **Use dedicated email services** (SendGrid, Mailgun, AWS SES) for production
6. **Set up SPF, DKIM, and DMARC records** for production domains
7. **Monitor email sending** for abuse/spam

## Required Environment Variables

```env
# SMTP Server Settings
EMAIL_HOST=smtp.example.com          # SMTP server hostname
EMAIL_PORT=587                        # SMTP port (587 for TLS, 465 for SSL)
EMAIL_SECURE=false                    # true for port 465, false for other ports
EMAIL_USER=your-email@example.com    # SMTP username (usually email address)
EMAIL_PASSWORD=your-password          # SMTP password or app password
EMAIL_FROM=noreply@yourdomain.com    # From address for outgoing emails
```

## Next Steps

After configuring email:

1. Restart your development server
2. Test by creating a new account (signup)
3. Check that verification email is received
4. Verify the email verification flow works

## Production Recommendations

For production deployments, consider using:

- **SendGrid** - Easy to set up, generous free tier, good deliverability
- **Mailgun** - Flexible, good documentation, reliable
- **AWS SES** - Cost-effective, scalable, integrates with AWS ecosystem
- **Postmark** - Focus on transactional emails, excellent deliverability

Avoid using personal email accounts (Gmail, Yahoo, etc.) in production due to:
- Sending limits
- Higher chance of being marked as spam
- Security risks
- Lack of dedicated IP addresses
