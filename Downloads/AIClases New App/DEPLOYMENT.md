# 🚀 AIClases 4.0 - Production Deployment Guide

## Prerequisites

- [ ] Vercel account with Pro plan (for cron jobs and advanced features)
- [ ] Domain name configured with SSL
- [ ] Supabase project in production tier
- [ ] Stripe account in live mode
- [ ] MercadoPago account (for LATAM)
- [ ] Google Analytics 4 property
- [ ] Email service (Resend recommended)

## 1. Environment Setup

### Vercel Environment Variables

Copy all variables from `.env.production` to your Vercel dashboard:

```bash
# Navigate to your Vercel dashboard
https://vercel.com/your-team/aiclases/settings/environment-variables
```

**Critical Variables (Set First):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_SECRET`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Domain Configuration

1. Add custom domain in Vercel dashboard
2. Configure DNS records:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   
   Type: CNAME  
   Name: www
   Value: cname.vercel-dns.com
   ```

## 2. Database Setup

### Supabase Production Configuration

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Run all migrations from packages/database/supabase/migrations/
-- Configure RLS policies
-- Set up database backups (daily recommended)
```

### Environment Specific Settings

```bash
# Production Database URL
export SUPABASE_PROJECT_REF="your-project-ref"
export SUPABASE_DB_PASSWORD="your-secure-password"
```

## 3. Payment Configuration

### Stripe Setup

1. **Live Mode Activation:**
   - Complete Stripe onboarding
   - Activate live payments
   - Configure webhooks endpoint: `https://aiclases.com/api/payments/stripe/webhook`
   - Add webhook events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`

2. **Product Configuration:**
   ```bash
   # Create Stripe products for credit packages
   stripe products create \
     --name "Paquete Starter" \
     --description "500 créditos para comenzar"
   ```

### MercadoPago Setup (LATAM)

1. **Production Credentials:**
   - Get production access token
   - Configure webhook: `https://aiclases.com/api/payments/mercadopago/webhook`
   - Test with sandbox first

2. **Supported Countries:**
   - Argentina, Brazil, Chile, Colombia, Mexico, Peru, Uruguay

## 4. Monitoring & Analytics

### Google Analytics 4

```html
<!-- Already configured in layout.tsx -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

### Error Tracking (Sentry)

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Configure Sentry
sentry-cli login
```

## 5. Performance Optimization

### Next.js Configuration

```javascript
// next.config.js optimizations
{
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
  },
  images: {
    domains: ['aiclases.com', 'cdn.aiclases.com'],
    formats: ['image/webp', 'image/avif'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  }
}
```

### CDN Configuration

```bash
# Configure AWS CloudFront or Vercel Edge Network
# Cache static assets with 1-year TTL
# Configure custom error pages
```

## 6. Security Checklist

- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Security headers configured (see vercel.json)
- [ ] Database RLS policies active
- [ ] API rate limiting enabled
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] Content Security Policy (CSP) implemented

## 7. Pre-deployment Testing

### Staging Environment

```bash
# Deploy to staging first
vercel --prod=false

# Run smoke tests
npm run test:e2e:staging
```

### Critical User Journeys

- [ ] User registration and email verification
- [ ] Social authentication (Google, GitHub)
- [ ] Course enrollment and payment
- [ ] MentorAI chat functionality
- [ ] Credit purchase and consumption
- [ ] Mobile responsiveness

## 8. Deployment Commands

### Initial Deployment

```bash
# Connect to Vercel
npx vercel login
npx vercel link

# Deploy to production
npx vercel --prod
```

### Continuous Deployment

```bash
# Automatic deployment on main branch push
git push origin main
```

## 9. Post-deployment Setup

### Cron Jobs Configuration

```bash
# Verify cron jobs are working
curl https://aiclases.com/api/cron/update-courses
curl https://aiclases.com/api/cron/cleanup-sessions
```

### Health Checks

```bash
# API health check
curl https://aiclases.com/api/health

# Database connectivity
curl https://aiclases.com/api/health/database
```

## 10. Monitoring & Maintenance

### Daily Checks

- [ ] Error rates < 1%
- [ ] Response times < 2s
- [ ] Payment success rate > 95%
- [ ] Database connections healthy

### Weekly Tasks

- [ ] Review performance metrics
- [ ] Check credit transaction accuracy
- [ ] Monitor user engagement
- [ ] Security audit

### Monthly Tasks

- [ ] Database backup verification
- [ ] Dependency updates
- [ ] Security patches
- [ ] Performance optimization

## 11. Rollback Procedure

### Emergency Rollback

```bash
# Rollback to previous deployment
vercel rollback [deployment-url]

# Alternative: redeploy previous commit
git revert [commit-hash]
git push origin main
```

### Database Rollback

```bash
# Use Supabase point-in-time recovery
# Or restore from daily backup
```

## 12. Scaling Considerations

### Traffic Growth

- **< 10k users:** Current setup sufficient
- **10k-100k users:** Add Redis caching, optimize queries
- **100k+ users:** Consider database sharding, microservices

### Cost Optimization

- Monitor Vercel function execution time
- Optimize Supabase read/write operations
- Use edge caching for static content
- Implement lazy loading for heavy components

## 13. Contact & Support

### Emergency Contacts

- **Technical Lead:** [Your contact]
- **DevOps:** [Your contact]
- **Vercel Support:** support@vercel.com
- **Supabase Support:** support@supabase.com

### Documentation

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)

---

## Quick Deploy Checklist

- [ ] Environment variables configured
- [ ] Domain and SSL setup
- [ ] Database migrations applied
- [ ] Payment webhooks configured
- [ ] Analytics tracking active
- [ ] Error monitoring setup
- [ ] Performance optimization enabled
- [ ] Security headers configured
- [ ] Backup strategy implemented
- [ ] Monitoring alerts setup

**Estimated deployment time:** 2-4 hours
**Go-live checklist completion:** Critical for production success