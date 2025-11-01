import { createConnection } from "../config/db.js";

const db = createConnection();

/**
 * GET /api/transactions
 * Fetches all transactions for the logged-in user
 * 
 * DBMS Concepts Applied:
 * 1. JOINs (INNER JOIN):
 *    - Joins transactions table with wallets to get user ownership
 *    - Joins transactions table with tokens to get token details
 *    - Combines data from multiple normalized tables
 * 
 * 2. Normalization:
 *    - Token names stored in tokens table, not duplicated in transactions
 *    - User ownership via wallets table maintains referential integrity
 *    - Eliminates data redundancy
 * 
 * 3. ORDER BY:
 *    - Sorts transactions by timestamp DESC (newest first)
 *    - Ensures consistent result ordering
 * 
 * 4. Foreign Keys & Integrity:
 *    - transactions.wallet_id references wallets.id
 *    - transactions.token_id references tokens.token_id
 *    - Ensures data consistency and referential integrity
 * 
 * 5. ACID Properties:
 *    - Only fully committed transactions appear (atomicity)
 *    - Data reflects consistent state after successful commits (consistency)
 */
export const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    // JOIN query: Combines transactions, wallets, and tokens tables
    // Normalization: Uses foreign keys to join separate normalized tables
    // INNER JOIN ensures only transactions with valid wallet and token references
    const [transactions] = await db
      .promise()
      .query(
        `SELECT 
          t.id AS transaction_id,
          tk.name AS token_name,
          tk.symbol AS token_symbol,
          t.type AS transaction_type,
          t.quantity,
          t.price_at_transaction AS price_per_token,
          t.total_value,
          t.created_at AS timestamp
        FROM transactions t
        INNER JOIN wallets w ON t.wallet_id = w.id
        INNER JOIN tokens tk ON t.token_id = tk.token_id
        WHERE w.user_id = ?
        ORDER BY t.created_at DESC`,
        [userId]
      );

    // Format response to match required structure
    const formattedTransactions = transactions.map((tx) => ({
      transaction_id: tx.transaction_id,
      token_name: tx.token_name,
      token_symbol: tx.token_symbol,
      transaction_type: tx.transaction_type === "BUY" ? "Buy" : "Sell",
      quantity: parseFloat(tx.quantity),
      price_per_token: parseFloat(tx.price_per_token),
      total_value: parseFloat(tx.total_value),
      timestamp: tx.timestamp,
    }));

    res.status(200).json({
      message: "Transactions retrieved successfully",
      transactions: formattedTransactions,
    });
  } catch (err) {
    console.error("Get transactions error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

