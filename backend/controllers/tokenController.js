import { createConnection } from "../config/db.js";

const db = createConnection();

/**
 * GET /api/tokens
 * Fetches all tokens from the database
 * Implements Normalization: Tokens are stored in a separate table to avoid redundancy
 * Primary Key: token_id ensures each token is uniquely identifiable
 */
export const getAllTokens = async (req, res) => {
  try {
    // Raw SQL query - fetching all tokens
    // The tokens table uses token_id as PRIMARY KEY and symbol as UNIQUE constraint
    // Using created_at as last_updated (can be changed to updated_at if column is added)
    const [tokens] = await db
      .promise()
      .query(
        "SELECT token_id, symbol, name, price, created_at, created_at AS last_updated FROM tokens ORDER BY symbol ASC"
      );

    res.status(200).json({
      message: "Tokens retrieved successfully",
      tokens: tokens,
    });
  } catch (err) {
    console.error("Get tokens error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/tokens/update-price/:id
 * Updates the price of a specific token
 * 
 * DBMS Concepts Applied:
 * 1. Transactions (ACID Properties):
 *    - Atomicity: All operations succeed or all fail (BEGIN/COMMIT/ROLLBACK)
 *    - Consistency: Price constraints maintained
 *    - Isolation: Concurrent updates are serialized
 *    - Durability: Changes persist after commit
 * 
 * 2. Concurrency Control:
 *    - MySQL uses row-level locking during UPDATE
 *    - Transaction ensures atomic read-modify-write
 *    - If two users update simultaneously, MySQL serializes the transactions
 *    - The last commit wins (pessimistic locking via transaction isolation)
 * 
 * 3. Foreign Key Constraint:
 *    - audit_log references tokens via token_id (if FK exists)
 */
export const updateTokenPrice = async (req, res) => {
  const tokenId = parseInt(req.params.id);
  const userId = req.user.id;

  // Validate token ID
  if (!tokenId || isNaN(tokenId)) {
    return res.status(400).json({ message: "Invalid token ID" });
  }

  // Get promise interface from the same connection for transaction handling
  const connection = db.promise();

  try {
    // Start Transaction - Ensures ACID properties
    // All subsequent queries use the same connection, maintaining transaction context
    await connection.query("START TRANSACTION");

    // Lock the token row for update (prevents concurrent modifications)
    // SELECT ... FOR UPDATE ensures row-level locking during transaction
    // Concurrency Control: This locks the row until transaction commits/rolls back
    const [existingTokens] = await connection.query(
      "SELECT token_id, symbol, name, price FROM tokens WHERE token_id = ? FOR UPDATE",
      [tokenId]
    );

    if (existingTokens.length === 0) {
      await connection.query("ROLLBACK");
      return res.status(404).json({ message: "Token not found" });
    }

    const oldPrice = parseFloat(existingTokens[0].price);
    
    // Simulate price update: generate a random price variation (±5%)
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    const newPrice = Math.max(0.0001, oldPrice * (1 + variation)).toFixed(4);

    // Update token price
    // NOT NULL constraint on price ensures data integrity
    // Foreign Key: token_id references tokens.token_id (if FK constraint exists)
    // If updated_at column exists, it will auto-update due to ON UPDATE CURRENT_TIMESTAMP
    await connection.query(
      "UPDATE tokens SET price = ? WHERE token_id = ?",
      [newPrice, tokenId]
    );

    // Log price update to audit_log table
    // Normalization: Audit log is separate table to track all changes
    // This maintains referential integrity while avoiding data redundancy
    const auditMessage = `Token ${existingTokens[0].symbol} (${existingTokens[0].name}): Price updated from ${oldPrice} to ${newPrice}`;
    await connection.query(
      "INSERT INTO audit_log (user_id, message) VALUES (?, ?)",
      [userId, auditMessage]
    );

    // Commit transaction - Makes all changes permanent
    // Atomicity: If any step fails, all changes are rolled back
    // Durability: Changes are written to disk and persist
    await connection.query("COMMIT");

    // Fetch updated token data (outside transaction for read consistency)
    const [updatedTokens] = await connection.query(
      "SELECT token_id, symbol, name, price, created_at FROM tokens WHERE token_id = ?",
      [tokenId]
    );

    res.status(200).json({
      message: "Token price updated successfully",
      token: updatedTokens[0],
      oldPrice: oldPrice,
      newPrice: parseFloat(newPrice),
    });
  } catch (err) {
    // Rollback on any error - Ensures atomicity
    // If price update or audit log insert fails, entire transaction is undone
    try {
      await connection.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Rollback error:", rollbackErr);
    }

    console.error("Update token price error:", err);
    res.status(500).json({ message: "Server error during price update" });
  }
};

/**
 * GET /api/tokens/summary
 * Fetches token summary using the token_summary view
 * Demonstrates use of MySQL VIEW for data aggregation
 */
export const getTokenSummary = async (req, res) => {
  try {
    // Using the token_summary view which joins tokens with wallet_token_balances
    // This view demonstrates normalization and aggregation
    const [summary] = await db
      .promise()
      .query("SELECT * FROM token_summary ORDER BY total_holdings DESC");

    res.status(200).json({
      message: "Token summary retrieved successfully",
      summary: summary,
    });
  } catch (err) {
    // If view doesn't exist, create it
    if (err.code === "ER_NO_SUCH_TABLE") {
      console.log("Creating token_summary view...");
      try {
        await db
          .promise()
          .query(`
            CREATE VIEW token_summary AS
            SELECT 
              t.token_id,
              t.symbol,
              t.name,
              t.price,
              COALESCE(SUM(wtb.amount), 0) AS total_holdings,
              COUNT(DISTINCT wtb.wallet_id) AS number_of_wallets
            FROM tokens t
            LEFT JOIN wallet_token_balances wtb ON t.token_id = wtb.token_id
            GROUP BY t.token_id, t.symbol, t.name, t.price
          `);

        // Retry the query
        const [summary] = await db
          .promise()
          .query("SELECT * FROM token_summary ORDER BY total_holdings DESC");

        return res.status(200).json({
          message: "Token summary retrieved successfully",
          summary: summary,
        });
      } catch (viewErr) {
        console.error("Error creating view:", viewErr);
      }
    }

    console.error("Get token summary error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

