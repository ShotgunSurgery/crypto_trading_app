# SQL Setup Instructions for Token Management

## Quick Start (Minimum Required)

1. **Insert Initial Tokens** (REQUIRED):
   ```sql
   source backend/sql/insert_initial_tokens.sql;
   ```
   Or run directly:
   ```sql
   INSERT INTO tokens (symbol, name, price) VALUES
   ('BTC', 'Bitcoin', 45000.0000),
   ('ETH', 'Ethereum', 2800.0000),
   ('DOGE', 'Dogecoin', 0.0800)
   ON DUPLICATE KEY UPDATE symbol = symbol;
   ```

2. **Restart your backend server**

That's it! The `/tokens` page will work now.

---

## Recommended (Better Functionality)

3. **Add updated_at Column** (Recommended):
   ```sql
   source backend/sql/add_updated_at_to_tokens.sql;
   ```
   This adds a timestamp that updates automatically when prices change.

4. **Create Token Summary View** (Recommended):
   ```sql
   source backend/sql/create_token_view.sql;
   ```
   Note: The code will auto-create this if missing, but manual setup is safer.

---

## Optional (Advanced Features)

5. **Create Price Audit Trigger** (Optional - for learning):
   ```sql
   source backend/sql/create_price_audit_trigger.sql;
   ```
   This creates an automatic trigger that logs price changes.
   Note: Price changes are already logged via the controller code.

---

## Running SQL Scripts

### Option 1: MySQL Command Line
```bash
mysql -u your_username -p crypto_trading_app < backend/sql/insert_initial_tokens.sql
```

### Option 2: MySQL Client
```sql
USE crypto_trading_app;
source backend/sql/insert_initial_tokens.sql;
```

### Option 3: Copy-Paste
Open the `.sql` file, copy its contents, and paste into your MySQL client.

---

## What Happens Without Running Scripts?

- ❌ **Without initial tokens**: The page loads but shows "No tokens found"
- ✅ **Without updated_at**: Still works, uses `created_at` for "Last Updated"
- ✅ **Without view**: Auto-creates when summary endpoint is called
- ✅ **Without trigger**: Price updates still logged via controller code

