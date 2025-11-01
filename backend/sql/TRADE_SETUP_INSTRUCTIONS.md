# Trade Feature Setup Instructions

## Required SQL Scripts

### 1. Create Transactions Table (REQUIRED)

Run this script first to create the transactions table:

```sql
source backend/sql/create_transactions_table.sql;
```

Or copy-paste:
```sql
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    token_id INT NOT NULL,
    type ENUM('BUY', 'SELL') NOT NULL,
    quantity DECIMAL(18,8) NOT NULL,
    price_at_transaction DECIMAL(18,4) NOT NULL,
    total_value DECIMAL(18,4) GENERATED ALWAYS AS (quantity * price_at_transaction) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
    FOREIGN KEY (token_id) REFERENCES tokens(token_id) ON DELETE CASCADE,
    INDEX idx_wallet_id (wallet_id),
    INDEX idx_token_id (token_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;
```

### 2. Create Transaction Audit Trigger (OPTIONAL)

This automatically logs transactions to audit_log:

```sql
source backend/sql/create_transaction_audit_trigger.sql;
```

**Note:** Transactions are already logged via the controller code, so this trigger is optional but demonstrates MySQL trigger concepts.

---

## Quick Start

1. **Create the transactions table** (required)
2. **Restart your backend server**
3. **Access `/trade` page** (must be logged in)

That's it! The trade feature will work.

---

## What Gets Created

### Transactions Table Features:
- **Primary Key:** `id` - Auto-incrementing unique identifier
- **Foreign Keys:** References `wallets(id)` and `tokens(token_id)` for referential integrity
- **Generated Column:** `total_value` automatically calculates `quantity × price_at_transaction`
- **ENUM Type:** `type` can only be 'BUY' or 'SELL' (data integrity)
- **Cascade Deletion:** If wallet or token is deleted, transactions are automatically deleted

### DBMS Concepts Demonstrated:
- ✅ **Normalization:** Separate transactions table eliminates redundancy
- ✅ **Foreign Keys:** Maintain referential integrity
- ✅ **Generated Columns:** Automatic calculation of total_value
- ✅ **Constraints:** ENUM, NOT NULL, and foreign key constraints
- ✅ **Indexes:** Optimized queries on wallet_id, token_id, and created_at

---

## Testing the Feature

1. Make sure you have:
   - A wallet (create one on `/wallet` page)
   - Tokens in the database (run `insert_initial_tokens.sql` if needed)
   - Some wallet balance (you'll need funds to buy tokens)

2. Go to `/trade` page and:
   - Select a token from the dropdown
   - Enter a quantity
   - Click "Buy" to purchase tokens
   - Click "Sell" to sell tokens you own

3. Check transactions:
   ```sql
   SELECT * FROM transactions ORDER BY created_at DESC;
   ```

4. Check audit log (if trigger is enabled):
   ```sql
   SELECT * FROM audit_log ORDER BY created_at DESC;
   ```

