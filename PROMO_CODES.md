# Promo Code System

## Overview

Publisphere now includes a flexible promo code system that supports:
- **Free access** (no payment required)
- **Percentage discounts** (e.g., 50% off)
- **Fixed amount discounts** (e.g., $50 off)

---

## Default Promo Codes

### 1. PEYTON - Free Access 🎉
- **Code**: `PEYTON`
- **Type**: Free access
- **Benefits**: No credit card required, instant access
- **Max Uses**: Unlimited
- **Status**: Active
- **Description**: Founder free access

### 2. LAUNCH50 - Launch Special
- **Code**: `LAUNCH50`
- **Type**: 50% discount
- **Benefits**: Pay $73.50 instead of $147
- **Max Uses**: 100
- **Status**: Active

### 3. EARLYBIRD - Early Bird
- **Code**: `EARLYBIRD`
- **Type**: $50 off
- **Benefits**: Pay $97 instead of $147
- **Max Uses**: 50
- **Status**: Active

---

## How It Works

### For Users (Agency Signup)

1. Go to `/signup/agency`
2. Fill in agency details
3. Enter promo code in "Promo Code (Optional)" field
4. Code validates automatically after 3+ characters
5. See instant feedback:
   - ✓ Valid codes show discount/free access message
   - ✗ Invalid codes show error message
6. If code = "PEYTON":
   - No payment required
   - Instant access granted
   - Button changes to "Create Free Account"
7. Submit form and account is created

### Backend Validation

The system validates promo codes in real-time:

```typescript
// Edge function validates:
1. Code exists in database
2. Code is active (is_active = true)
3. Code hasn't expired (valid_until check)
4. Code hasn't reached max uses
5. Code is within valid date range

// If "PEYTON":
payment_status = 'free'
purchase_date = now()
requires_payment = false
```

---

## Database Schema

### `promo_codes` Table

```sql
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', 'free')),
  discount_value DECIMAL(10, 2),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### `agencies` Table Updates

New fields added:
- `promo_code_used` - Tracks which promo code was used
- `payment_status` - Values: 'pending', 'paid', 'free', 'failed'

---

## Adding New Promo Codes

### Via Database

```sql
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_uses, valid_from, valid_until)
VALUES
  ('SUMMER30', 'Summer sale - 30% off', 'percentage', 30.00, 200, '2025-06-01', '2025-08-31'),
  ('FRIEND100', 'Referral code - $100 off', 'fixed', 100.00, NULL, now(), NULL),
  ('VIPFREE', 'VIP free access', 'free', NULL, 10, now(), '2025-12-31');
```

### Via Supabase Dashboard

1. Go to Supabase Dashboard → Database → Tables
2. Select `promo_codes` table
3. Click "Insert row"
4. Fill in:
   - **code**: Uppercase code (e.g., "NEWCODE")
   - **description**: What it's for
   - **discount_type**: 'free', 'percentage', or 'fixed'
   - **discount_value**: Amount (null for 'free')
   - **max_uses**: Number limit or null for unlimited
   - **is_active**: true
   - **valid_from**: Start date (optional)
   - **valid_until**: End date (optional)

---

## Promo Code Types

### 1. Free Access (`discount_type: 'free'`)

- **Use Case**: Founder access, VIP access, beta testers
- **discount_value**: Must be `NULL`
- **Effect**: No payment required, instant access
- **Example**: PEYTON

```sql
INSERT INTO promo_codes (code, discount_type, description)
VALUES ('FOUNDER', 'free', 'Founder access');
```

### 2. Percentage Discount (`discount_type: 'percentage'`)

- **Use Case**: Sales, promotions (10%, 25%, 50% off)
- **discount_value**: Number from 1-100
- **Effect**: Reduces price by percentage
- **Example**: LAUNCH50

```sql
INSERT INTO promo_codes (code, discount_type, discount_value, description)
VALUES ('HOLIDAY25', 'percentage', 25.00, 'Holiday sale - 25% off');
```

### 3. Fixed Discount (`discount_type: 'fixed'`)

- **Use Case**: Referral credits, fixed amounts off
- **discount_value**: Dollar amount
- **Effect**: Reduces price by fixed amount
- **Example**: EARLYBIRD

```sql
INSERT INTO promo_codes (code, discount_type, discount_value, description)
VALUES ('REFERRAL50', 'fixed', 50.00, 'Referral bonus - $50 off');
```

---

## Usage Tracking

The system automatically tracks:

1. **current_uses** - Increments on successful signup
2. **agencies.promo_code_used** - Records which code was used
3. **activity_logs** - Logs promo usage in activity

### Check Promo Usage

```sql
-- See all promo codes and usage
SELECT
  code,
  description,
  discount_type,
  current_uses,
  max_uses,
  CASE
    WHEN max_uses IS NULL THEN 'Unlimited'
    ELSE CONCAT(max_uses - current_uses, ' remaining')
  END as remaining
FROM promo_codes
WHERE is_active = true
ORDER BY current_uses DESC;

-- See which agencies used promo codes
SELECT
  a.name,
  a.contact_email,
  a.promo_code_used,
  a.payment_status,
  a.created_at
FROM agencies a
WHERE a.promo_code_used IS NOT NULL
ORDER BY a.created_at DESC;
```

---

## Deactivating Promo Codes

### Disable a code:
```sql
UPDATE promo_codes
SET is_active = false
WHERE code = 'OLDCODE';
```

### Set expiration:
```sql
UPDATE promo_codes
SET valid_until = '2025-12-31 23:59:59'
WHERE code = 'LIMITEDTIME';
```

### Limit uses:
```sql
UPDATE promo_codes
SET max_uses = 100
WHERE code = 'SPECIAL';
```

---

## Frontend Implementation

### Real-time Validation

The signup form validates promo codes as the user types:

```typescript
// Auto-validates after 3+ characters
handlePromoCodeChange(value) {
  if (value.length >= 3) {
    setTimeout(() => validatePromoCode(value), 500);
  }
}

// Calls Supabase RPC
validatePromoCode(code) {
  const { data } = await supabase.rpc('validate_promo_code', {
    promo_code_input: code
  });

  if (data.is_valid) {
    setPromoStatus({
      valid: true,
      message: data.discount_type === 'free'
        ? '✓ Free access - No payment required!'
        : `✓ ${data.discount_value}% off applied`
    });
  }
}
```

### Visual Feedback

- ✅ **Valid code**: Green text, shows discount
- ❌ **Invalid code**: Red text, shows error
- 🎉 **Free code**: Special badge "No credit card required"
- 🔄 **Loading**: Validates automatically

---

## Testing Promo Codes

### Test "PEYTON" Code

1. Go to http://localhost:8080/signup/agency
2. Fill in form details
3. Enter "peyton" in promo code field (case insensitive)
4. Should see: "✓ Free access - No payment required!"
5. Button changes to "Create Free Account"
6. Submit form
7. Account created with `payment_status = 'free'`

### Test Discount Codes

1. Enter "LAUNCH50" → See "✓ 50% discount applied"
2. Enter "EARLYBIRD" → See "✓ $50 discount applied"
3. Enter "INVALID" → See error message

---

## Security

### Protected

- ✅ RLS policies prevent unauthorized access
- ✅ Service role required to create/modify codes
- ✅ Public can only read active codes (for validation)
- ✅ Usage incremented server-side only
- ✅ Validation happens in secure edge function

### Not Protected

- Promo codes are not secrets (intentionally shareable)
- Anyone can use any active code
- No rate limiting on validation (could be abused)

---

## Future Enhancements

### Possible Improvements

1. **Single-use codes** - Unique codes for each user
2. **User-specific codes** - Email-restricted codes
3. **Stackable codes** - Multiple codes per signup
4. **Referral tracking** - Track who referred whom
5. **Auto-expiry** - Codes expire after X days
6. **Geo-restriction** - Codes for specific regions
7. **First-time only** - Prevent reuse on new accounts

---

## API Reference

### Database Functions

#### `validate_promo_code(promo_code_input TEXT)`

Validates a promo code and returns discount info.

**Returns:**
```typescript
{
  is_valid: boolean,
  discount_type: 'free' | 'percentage' | 'fixed',
  discount_value: number | null,
  message: string
}
```

**Example:**
```sql
SELECT * FROM validate_promo_code('PEYTON');
-- Returns: { is_valid: true, discount_type: 'free', message: 'Promo code is valid' }
```

#### `increment_promo_usage(promo_code_input TEXT)`

Increments the usage counter for a promo code.

**Returns:** `boolean` (success/failure)

**Example:**
```sql
SELECT increment_promo_usage('PEYTON');
-- Returns: true (and increments current_uses)
```

---

## Migration File

Location: `supabase/migrations/20251117210000_add_promo_codes.sql`

Run migration:
```bash
supabase db push
```

---

## Summary

- ✅ **PEYTON** code grants free access (no payment)
- ✅ Real-time validation as user types
- ✅ Tracks usage automatically
- ✅ Supports percentage, fixed, and free discounts
- ✅ Easy to add new codes via SQL or dashboard
- ✅ Secure with RLS policies

**Try it now**: http://localhost:8080/signup/agency

Enter "PEYTON" in the promo code field! 🎉
